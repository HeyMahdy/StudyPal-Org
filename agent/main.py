import os

from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from service.s3TextractService import upload_note_to_s3, analyze_note_from_s3
from agent import studypal_graph

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
    analyze_result = analyze_note_from_s3(request.s3_key)
    if analyze_result.get("status") != "success":
        return analyze_result

    extracted_text = analyze_result.get("extracted_text", "")
    llm = ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.2,
    )

    state = {
        "messages": [],
        "raw_notes": extracted_text,
        "web_search_results": None,
        "youtube_search_results": None,
        "final_study_guide": "",
    }

    result_state = studypal_graph.invoke(
        state,
        config={"configurable": {"my_llm": llm}},
    )

    final_message = result_state["messages"][-1]
    return {
        "status": "success",
        "final_output": final_message.content,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)