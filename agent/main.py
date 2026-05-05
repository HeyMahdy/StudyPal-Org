from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv

from service.s3TextractService import upload_note_to_s3, analyze_note_from_s3

# Load environment variables
load_dotenv()

app = FastAPI(title="StudyPal Agent API")

# Request Model for Textract
class AnalyzeRequest(BaseModel):
    s3_key: str

@app.post("/upload-note/")
async def upload_note(file: UploadFile = File(...)):
    """Uploads an image or PDF to the S3 'notes' directory."""
    return upload_note_to_s3(file)

@app.post("/analyze-note/")
async def analyze_note(request: AnalyzeRequest):
    """Reads the S3 file using Textract and returns extracted text."""
    return analyze_note_from_s3(request.s3_key)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)