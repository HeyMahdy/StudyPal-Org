import json
import logging
import os
from datetime import datetime
from typing import Any, Dict

import boto3
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')

OPENAI_URL = 'https://api.openai.com/v1/chat/completions'


class ClarificationNeeded(Exception):
    def __init__(self, question: str):
        super().__init__(question)
        self.question = question


class ExpenseParseError(Exception):
    pass


class ExpenseCategorizationError(Exception):
    pass


class ReceiptExtractionError(Exception):
    pass


class ExpenseSaveError(Exception):
    pass


class ExpenseAgent:
    def __init__(self) -> None:
        self.api_base_url = os.getenv('API_BASE_URL', 'http://localhost:5000')
        self.api_token = os.getenv('API_TOKEN', '')
        self.openai_api_key = os.getenv('OPENAI_API_KEY', '')
        self.openai_model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
        self.s3_bucket = os.getenv('S3_BUCKET') or os.getenv('S3_BUCKET_NAME')
        self._textract = boto3.client(
            'textract',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION')
        )

    def run_ingestion_agent(self, raw_text: str) -> Dict[str, Any]:
        system_prompt = self._ingestion_prompt()
        raw_response = self._call_openai(system_prompt, raw_text)
        logger.info('Agent 1 raw response: %s', raw_response)

        try:
            parsed = json.loads(raw_response.strip())
        except json.JSONDecodeError:
            retry_response = self._call_openai(system_prompt, raw_text)
            logger.info('Agent 1 retry response: %s', retry_response)
            try:
                parsed = json.loads(retry_response.strip())
            except json.JSONDecodeError as exc:
                raise ExpenseParseError('Failed to parse Agent 1 response.') from exc

        if isinstance(parsed, dict) and parsed.get('needs_clarification'):
            raise ClarificationNeeded(parsed.get('question', 'Please clarify the expense.'))

        logger.info('Agent 1 complete')
        return parsed

    def run_categorization_agent(self, parsed: Dict[str, Any]) -> Dict[str, Any]:
        system_prompt = self._categorization_prompt()
        user_payload = json.dumps(parsed)
        raw_response = self._call_openai(system_prompt, user_payload)
        logger.info('Agent 2 raw response: %s', raw_response)

        try:
            categorized = json.loads(raw_response.strip())
        except json.JSONDecodeError:
            retry_response = self._call_openai(system_prompt, user_payload)
            logger.info('Agent 2 retry response: %s', retry_response)
            try:
                categorized = json.loads(retry_response.strip())
            except json.JSONDecodeError as exc:
                raise ExpenseCategorizationError('Failed to parse Agent 2 response.') from exc

        logger.info('Agent 2 complete')
        return categorized

    def extract_from_receipt(self, s3_key: str) -> str:
        if not self.s3_bucket:
            raise ReceiptExtractionError('S3 bucket not configured.')

        response = self._textract.detect_document_text(
            Document={
                'S3Object': {
                    'Bucket': self.s3_bucket,
                    'Name': s3_key
                }
            }
        )

        lines = [
            block.get('Text', '')
            for block in response.get('Blocks', [])
            if block.get('BlockType') == 'LINE'
        ]
        raw_text = '\n'.join([line for line in lines if line]).strip()
        if not raw_text:
            raise ReceiptExtractionError('Could not read receipt — try a clearer photo or type manually')

        return raw_text

    def save_expense(self, categorized: Dict[str, Any], auth_token: str | None = None) -> Dict[str, Any]:
        url = f"{self.api_base_url.rstrip('/')}/api/ai-expenses"
        headers = {}
        token = auth_token or self.api_token
        if token:
            headers['Authorization'] = token if token.startswith('Bearer ') else f"Bearer {token}"
        response = requests.post(url, json=categorized, headers=headers, timeout=20)
        if response.status_code != 201:
            raise ExpenseSaveError(f"Save failed: {response.status_code} {response.text}")

        payload = response.json()
        if isinstance(payload, dict) and payload.get('data', {}).get('expense'):
            saved = payload['data']['expense']
        else:
            saved = payload

        logger.info('Saved expense id: %s', saved.get('id'))
        logger.info('Saved')
        return saved

    def process_text(self, text: str, auth_token: str | None = None) -> Dict[str, Any]:
        parsed = self.run_ingestion_agent(text)
        categorized = self.run_categorization_agent(parsed)
        saved = self.save_expense(categorized, auth_token=auth_token)
        return saved

    def process_receipt(self, s3_key: str, auth_token: str | None = None) -> Dict[str, Any]:
        raw_text = self.extract_from_receipt(s3_key)
        parsed = self.run_ingestion_agent(raw_text)
        categorized = self.run_categorization_agent(parsed)
        saved = self.save_expense(categorized, auth_token=auth_token)
        return saved

    def _call_openai(self, system_prompt: str, user_content: str) -> str:
        if not self.openai_api_key:
            raise ExpenseParseError('OPENAI_API_KEY is not configured.')

        response = requests.post(
            OPENAI_URL,
            headers={
                'Authorization': f"Bearer {self.openai_api_key}",
                'Content-Type': 'application/json'
            },
            json={
                'model': self.openai_model,
                'temperature': 0.2,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_content}
                ]
            },
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        return data.get('choices', [{}])[0].get('message', {}).get('content', '')

    def _ingestion_prompt(self) -> str:
        today = datetime.utcnow().date().isoformat()
        return (
            'You are a student expense parser for a university student in Bangladesh.\n'
            'Extract structured data from the input (typed text or OCR\'d receipt text).\n\n'
            'Return ONLY valid JSON, no markdown, no explanation:\n'
            '{\n'
            '  "amount": number (in BDT, convert if other currency),\n'
            '  "original_currency": "BDT" or actual currency if different,\n'
            '  "item": string (what was bought, clean concise label),\n'
            '  "vendor": string or null,\n'
            '  "location": string or null,\n'
            '  "expense_date": "YYYY-MM-DD" (use today if not mentioned),\n'
            '  "raw_input": string (original input text unchanged)\n'
            '}\n\n'
            'Rules:\n'
            '- If amount is in USD/EUR, convert to BDT (use 110 for USD, 120 for EUR)\n'
            '- If item is vague like "stuff", return:\n'
            '  { "needs_clarification": true, "question": "What did you buy?" }\n'
            '- Dates like "yesterday" or "last Monday" must be resolved to actual YYYY-MM-DD\n'
            '- Vendor and location are optional — only include if clearly mentioned\n'
            f"- Today's date for reference: {today}"
        )

    def _categorization_prompt(self) -> str:
        return (
            'You are a student expense categorization agent for a university student in Bangladesh.\n'
            'You receive a parsed expense object and must add categorization fields.\n\n'
            'Return ONLY valid JSON with ALL original fields preserved plus these new fields:\n'
            '{\n'
            '  ...all fields from Agent 1 output...,\n'
            '  "is_academic": boolean,\n'
            '  "category": one of exactly:\n'
            '    "food" | "transport" | "books" | "printing" | "software" |\n'
            '    "courses" | "supplies" | "entertainment" | "health" |\n'
            '    "freelance_tool" | "other",\n'
            '  "sub_category": string (max 3 words),\n'
            '  "is_exam_week": boolean,\n'
            '  "academic_reason": string or null\n'
            '}\n\n'
            'Category rules:\n'
            '- food        → meal, snack, tea, coffee, restaurant, canteen\n'
            '- transport   → rickshaw, CNG, bus, Pathao, Shohoz, Uber, fuel\n'
            '- books       → textbooks, notebooks, reference books\n'
            '- printing    → photocopy, print, binding, lamination\n'
            '- software    → app, subscription, online tool, domain, hosting\n'
            '- courses     → Udemy, Coursera, coaching, tuition fees\n'
            '- supplies    → stationery, pen, USB, calculator, lab materials\n'
            '- entertainment → movie, game, outing, non-study activity\n'
            '- health      → medicine, doctor, pharmacy\n'
            '- freelance_tool → Canva Pro, Figma, tools used for earning\n'
            '- other       → anything that does not fit above\n\n'
            'is_exam_week detection — set true if item context suggests:\n'
            '  printing/photocopy, "past paper", "model test", "revision",\n'
            '  last-minute book purchase, energy drink during study session\n\n'
            'Examples:\n'
            '- "photocopy at library" → is_academic:true, category:"printing", is_exam_week:true\n'
            '- "lunch at TSC"         → is_academic:false, category:"food", is_exam_week:false\n'
            '- "Pathao to Nilkhet"    → is_academic:true, category:"transport", is_exam_week:false\n'
            '- "Udemy Python course"  → is_academic:true, category:"courses", is_exam_week:false'
        )


if __name__ == '__main__':
    agent = ExpenseAgent()
    result = agent.process_text('spent 150tk on photocopy at library')
    print(json.dumps(result, indent=2))
