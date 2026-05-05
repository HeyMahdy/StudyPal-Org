import boto3
import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("S3_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("S3_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

@app.post("/upload-note/")
async def upload_note(file: UploadFile = File(...)):
    # Rule: Use a UUID to prevent overwriting files in your 'notes' folder
    unique_filename = f"{uuid.uuid4()}-{file.filename}"
    file_key = f"notes/{unique_filename}" 

    try:
        s3_client.upload_fileobj(
            file.file, 
            BUCKET_NAME, 
            file_key,
            ExtraArgs={"ContentType": file.content_type}
        )

        # This URL is what you'll pass to your frontend or AI service
        file_url = f"https://{BUCKET_NAME}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{file_key}"

        return {
            "status": "success",
            "s3_key": file_key,
            "url": file_url
        }

    except Exception as e:
        # Standardized error response for your observability engine
        return {"status": "DOWN", "error": str(e)}