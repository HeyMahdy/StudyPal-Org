import json
import os

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import ToolMessage

from service.s3TextractService import upload_note_to_s3, analyze_note_from_s3
from agent import studypal_graph

# Load environment variables
load_dotenv()

app = FastAPI(title="StudyPal Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    messages = result_state["messages"]
    final_message = messages[-1]

    youtube_links = []
    web_links = []
    for message in messages:
        if not isinstance(message, ToolMessage):
            continue

        tool_name = getattr(message, "name", "")
        payload = message.content
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                payload = {}

        if tool_name == "search_youtube" and isinstance(payload, dict):
            for item in payload.get("results", []) or []:
                title = item.get("title")
                url = item.get("url")
                if title and url:
                    youtube_links.append({"title": title, "url": url})

        if tool_name == "search_web" and isinstance(payload, dict):
            for item in payload.get("organic", []) or []:
                title = item.get("title")
                url = item.get("link")
                if title and url:
                    web_links.append({"title": title, "url": url})

    structured_output = {
        "notes_markdown": final_message.content,
        "youtube_links": youtube_links,
        "web_links": web_links,
    }
    try:
        parsed = json.loads(final_message.content)
        if isinstance(parsed, dict):
            structured_output.update(parsed)
    except json.JSONDecodeError:
        pass

    structured_output["youtube_links"] = youtube_links
    structured_output["web_links"] = web_links

    return {
        "status": "success",
        "final_output": structured_output,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)