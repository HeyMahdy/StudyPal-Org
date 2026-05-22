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
        raw_response = self._call_openai(system_prompt, user_payload, json_mode=True)
        logger.info('Agent 2 raw response: %s', raw_response)

        try:
            categorized = json.loads(raw_response.strip())
        except json.JSONDecodeError:
            retry_response = self._call_openai(system_prompt, user_payload, json_mode=True)
            logger.info('Agent 2 retry response: %s', retry_response)
            try:
                categorized = json.loads(retry_response.strip())
            except json.JSONDecodeError as exc:
                raise ExpenseCategorizationError('Failed to parse Agent 2 response.') from exc

        logger.info('Agent 2 complete')
        return self._normalize_categorized_output(categorized)

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

    def _call_openai(self, system_prompt: str, user_content: str, json_mode: bool = False) -> str:
        if not self.openai_api_key:
            raise ExpenseParseError('OPENAI_API_KEY is not configured.')

        payload: Dict[str, Any] = {
            'model': self.openai_model,
            'temperature': 0.2,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_content}
            ]
        }
        if json_mode:
            payload['response_format'] = {'type': 'json_object'}

        headers = {
            'Authorization': f"Bearer {self.openai_api_key}",
            'Content-Type': 'application/json'
        }

        last_error = None
        for attempt in range(3):
            try:
                response = requests.post(
                    OPENAI_URL,
                    headers=headers,
                    json=payload,
                    timeout=60
                )
                response.raise_for_status()
                data = response.json()
                return data.get('choices', [{}])[0].get('message', {}).get('content', '')
            except requests.exceptions.ReadTimeout as exc:
                last_error = exc
                logger.warning('OpenAI read timeout (attempt %s)', attempt + 1)
            except requests.exceptions.RequestException as exc:
                last_error = exc
                break

        raise ExpenseParseError(f'OpenAI request failed: {last_error}')

    def _normalize_categorized_output(self, categorized: Dict[str, Any]) -> Dict[str, Any]:
        raw_category = str(categorized.get('category', '')).strip()
        normalized = raw_category.lower()
        category_map = {
            'food & dining': 'Food & Dining',
            'food and dining': 'Food & Dining',
            'food': 'Food & Dining',
            'dining': 'Food & Dining',
            'housing': 'Housing',
            'rent': 'Housing',
            'transport': 'Transport',
            'transportation': 'Transport',
            'entertainment': 'Entertainment',
            'shopping': 'Shopping',
            'health': 'Health',
            'utilities': 'Utilities',
            'subscriptions': 'Subscriptions',
            'subscription': 'Subscriptions',
            'savings': 'Savings',
            'saving': 'Savings',
            'other': 'Other',
            'misc': 'Other',
            'miscellaneous': 'Other'
        }
        categorized['category'] = category_map.get(normalized, 'Shopping')

        if categorized.get('is_academic') is None:
            categorized['is_academic'] = False

        return categorized

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
            'You are a student expense categorization agent for a university student in Bangladesh.\n\n'
            'You receive a parsed expense object and must return it with added categorization fields.\n\n'
            '═══════════════════════════════\n'
            'STRICT OUTPUT RULE\n'
            '═══════════════════════════════\n'
            'Return ONLY valid JSON. No markdown, no explanation, no extra keys.\n'
            'Preserve ALL original fields exactly as received, then append the new fields below.\n\n'
            '═══════════════════════════════\n'
            'NEW FIELDS TO ADD\n'
            '═══════════════════════════════\n'
            '{\n'
            '  "is_academic": boolean,\n'
            '  "category": string,        // see category rules\n'
            '  "sub_category": string,    // max 3 words, lowercase\n'
            '  "is_exam_week": boolean,\n'
            '  "academic_reason": string | null\n'
            '}\n\n'
            '═══════════════════════════════\n'
            'STEP 1 — PICK CATEGORY\n'
            '═══════════════════════════════\n'
            'Match the expense to exactly one category from the list below.\n'
            'If unsure, return category as "Shopping" by default.\n\n'
            '  "Food & Dining"   → meal, snack, tea, coffee, water, restaurant, canteen, delivery\n'
            '  "Housing"         → rent, hostel, dorm, maintenance, furniture tied to housing\n'
            '  "Transport"       → rickshaw, CNG, bus, Pathao, Shohoz, Uber, fuel, parking\n'
            '  "Entertainment"   → movie ticket, game purchase, outing, hangout, streaming\n'
            '  "Shopping"        → clothes, accessories, general retail, electronics, gifts\n'
            '  "Health"          → medicine, pharmacy purchase, doctor visit, clinic fee\n'
            '  "Utilities"       → electricity, gas, water, internet bill, mobile recharge\n'
            '  "Subscriptions"   → SaaS, app subscriptions, paid tools, memberships\n'
            '  "Savings"         → money set aside, deposits, savings transfers\n'
            '  "Other"           → does not fit any above\n\n'
            'TIEBREAKERS:\n'
            '  • Streaming subscription → "Subscriptions" (not Entertainment)\n'
            '  • Mobile/data recharge → "Utilities" (not Subscriptions)\n'
            '  • Tuition/course fee → "Subscriptions" (if recurring) else "Shopping"\n\n'
            '═══════════════════════════════\n'
            'STEP 2 — SET is_academic\n'
            '═══════════════════════════════\n'
            'Set true only if the expense directly supports studying or academic work.\n'
            'Otherwise set false.\n\n'
            '═══════════════════════════════\n'
            'STEP 3 — DETECT is_exam_week\n'
            '═══════════════════════════════\n'
            'Set true if ANY of the following signals appear in the item name,\n'
            'description, or context:\n\n'
            '  □ item contains: "past paper", "model test", "revision", "mock exam"\n'
            '  □ last-minute book or notes purchase (e.g., "urgent", "exam copy")\n'
            '  □ energy drink, coffee, or late-night snack during a study session\n'
            '  □ transport to exam venue or coaching at unusual hour\n'
            '  □ date is close to a known exam period (if date is provided)\n\n'
            'If NONE of the above apply → false\n\n'
            '═══════════════════════════════\n'
            'STEP 4 — WRITE academic_reason\n'
            '═══════════════════════════════\n'
            '  • If is_academic is true  → write a short sentence explaining why\n'
            '                               (e.g., "Printed lecture notes for upcoming exam")\n'
            '  • If is_academic is false → set to null\n\n'
            '═══════════════════════════════\n'
            'FEW-SHOT EXAMPLES\n'
            '═══════════════════════════════\n'
            'Input:\n'
            '  { "item": "Photocopy of past papers", "amount": 40, "currency": "BDT" }\n'
            'Output:\n'
            '  {\n'
            '    "item": "Photocopy of past papers", "amount": 40, "currency": "BDT",\n'
            '    "is_academic": true,\n'
            '    "category": "Shopping",\n'
            '    "sub_category": "past paper copy",\n'
            '    "is_exam_week": true,\n'
            '    "academic_reason": "Photocopied past exam papers for exam preparation."\n'
            '  }\n\n'
            'Input:\n'
            '  { "item": "Pathao ride to Dhanmondi", "amount": 85, "currency": "BDT" }\n'
            'Output:\n'
            '  {\n'
            '    "item": "Pathao ride to Dhanmondi", "amount": 85, "currency": "BDT",\n'
            '    "is_academic": false,\n'
            '    "category": "Transport",\n'
            '    "sub_category": "ride share",\n'
            '    "is_exam_week": false,\n'
            '    "academic_reason": null\n'
            '  }\n\n'
            'Input:\n'
            '  { "item": "Red Bull during revision session", "amount": 120, "currency": "BDT" }\n'
            'Output:\n'
            '  {\n'
            '    "item": "Red Bull during revision session", "amount": 120, "currency": "BDT",\n'
            '    "is_academic": true,\n'
            '    "category": "Food & Dining",\n'
            '    "sub_category": "study energy drink",\n'
            '    "is_exam_week": true,\n'
            '    "academic_reason": "Energy drink consumed during late-night exam revision session."\n'
            '  }\n\n'
            'Input:\n'
            '  { "item": "Canva Pro monthly", "amount": 750, "currency": "BDT", "context": "used for client logo work" }\n'
            'Output:\n'
            '  {\n'
            '    "item": "Canva Pro monthly", "amount": 750, "currency": "BDT", "context": "used for client logo work",\n'
            '    "is_academic": false,\n'
            '    "category": "Subscriptions",\n'
            '    "sub_category": "design subscription",\n'
            '    "is_exam_week": false,\n'
            '    "academic_reason": null\n'
            '  }\n\n'
            'Now categorize the following expense object:'
        )


if __name__ == '__main__':
    agent = ExpenseAgent()
    result = agent.process_text('spent 150tk on photocopy at library')
    print(json.dumps(result, indent=2))
