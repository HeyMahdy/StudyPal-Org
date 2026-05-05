import os
import uuid
from typing import Dict

import boto3
from dotenv import load_dotenv
from fastapi import UploadFile

load_dotenv()

_s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
)

_textract_client = boto3.client(
    "textract",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
)

_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")


def upload_note_to_s3(file: UploadFile) -> Dict[str, str]:
    """Uploads an image or PDF to the S3 'notes' directory."""
    unique_filename = f"{uuid.uuid4()}-{file.filename}"
    file_key = f"notes/{unique_filename}"

    try:
        _s3_client.upload_fileobj(
            file.file,
            _BUCKET_NAME,
            file_key,
            ExtraArgs={"ContentType": file.content_type},
        )

        file_url = (
            f"https://{_BUCKET_NAME}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{file_key}"
        )

        return {
            "status": "success",
            "s3_key": file_key,
            "url": file_url,
        }
    except Exception as e:
        return {"status": "DOWN", "error": str(e)}


def analyze_note_from_s3(s3_key: str) -> Dict[str, str]:
    """Reads the S3 file using Textract and returns extracted text."""
    try:
        response = _textract_client.detect_document_text(
            Document={
                "S3Object": {
                    "Bucket": _BUCKET_NAME,
                    "Name": s3_key,
                }
            }
        )

        extracted_text = ""
        for item in response.get("Blocks", []):
            if item.get("BlockType") == "LINE":
                extracted_text += item.get("Text", "") + "\n"

        return {
            "status": "success",
            "extracted_text": extracted_text.strip(),
        }
    except Exception as e:
        return {"status": "DOWN", "error": str(e)}
