import base64
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ExactaGrade - Vision Engine")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# We only care about the extraction and confidence for now
class ExtractionResult(BaseModel):
    content: str = Field(description="The full extracted text. Use LaTeX for all mathematical notation.")
    confidence_score: float = Field(description="OCR accuracy confidence from 0.0 to 1.0.")

@app.post("/api/v1/extract")
async def extract_content(file: UploadFile = File(...)):
    try:
        # 1. Convert image to Base64
        file_bytes = await file.read()
        base64_image = base64.b64encode(file_bytes).decode("utf-8")
        
        # 2. Pure Extraction Prompt
        # We tell the AI to be a 'perfect transcriber'
        system_prompt = (
            "You are a highly accurate document digitizer. "
            "Transcribe everything in the image. "
            "For any mathematical symbols, formulas, or equations, "
            "you MUST use standard LaTeX notation (e.g., use \\frac{a}{b} for fractions)."
        )

        # 3. Call GPT-4o
        response = client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Transcribe this image exactly."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{file.content_type};base64,{base64_image}",
                                "detail": "high" # 'high' uses more tokens but is needed for math
                            }
                        }
                    ]
                }
            ],
            response_format=ExtractionResult
        )

        # 4. Grab the data
        data = response.choices[0].message.parsed
        usage = response.usage
        
        # 5. Safely extract usage statistics (handling OpenAI's nested objects)
        prompt_details = getattr(usage, 'prompt_tokens_details', None)
        cached_tokens = getattr(prompt_details, 'cached_tokens', 0) if prompt_details else 0

        return {
            "extracted_data": data.model_dump(),
            "usage_stats": {
                "prompt_tokens": getattr(usage, 'prompt_tokens', 0),
                "completion_tokens": getattr(usage, 'completion_tokens', 0),
                "total_tokens": getattr(usage, 'total_tokens', 0),
                "cached_tokens": cached_tokens
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))