# main.py — Entry point: starts server, defines all API routes

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from typing import Optional
import io

from parser import parse_resume
from scorer import score_resume, check_ats
from matcher import match_jd
from optimizer import get_ai_feedback, get_optimized_resume

app = FastAPI(title="JobFit Analyzer API")

# CORS — allows React on port 5173 to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "JobFit Analyzer API is running ✅"}


@app.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    jd_text: Optional[str] = Form(None),      # job description text
    platform: Optional[str] = Form(None)       # linkedin / naukri / internshala
):
    # Step 1 — read file bytes
    file_bytes = await file.read()

    # Step 2 — extract text from resume
    text = parse_resume(file.filename, file_bytes)

    # Step 3 — score the resume
    score_data = score_resume(text)

    # Step 4 — check ATS issues
    ats_issues = check_ats(text)

    # Step 5 — match against JD if provided
    jd_match = match_jd(text, jd_text or "")

    # Step 6 — get AI feedback
    ai_feedback = get_ai_feedback(text, jd_text or "", platform or "")

    # Step 7 — return everything
    return {
        "extracted_text": text,
        "score_data": score_data,
        "ats_issues": ats_issues,
        "jd_match": jd_match,
        "ai_feedback": ai_feedback,
        "platform": platform or "general"
    }


@app.post("/download")
async def download_resume(
    file: UploadFile = File(...),
    jd_text: Optional[str] = Form(None),
    platform: Optional[str] = Form(None),
    role: Optional[str] = Form(None)
):
    # Read and parse resume
    file_bytes = await file.read()
    text = parse_resume(file.filename, file_bytes)

    # Get missing keywords
    jd_match = match_jd(text, jd_text or "")
    missing = jd_match.get("missing_keywords", [])

    # Optimize resume with AI
    optimized = get_optimized_resume(text, missing, role or "", platform or "")

    # Return as downloadable text file
    filename = f"optimized_resume_{platform or 'general'}.txt"
    return Response(
        content=optimized.encode("utf-8"),
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )