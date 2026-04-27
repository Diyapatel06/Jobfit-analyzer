# main.py
# FastAPI entry point — all routes

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from typing import Optional

from parser import parse_resume
from scorer import score_resume, check_ats
from matcher import match_jd
from optimizer import get_ai_feedback, get_optimized_resume

app = FastAPI(title="JobFit Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "JobFit Analyzer API is running"}


@app.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    jd_text: Optional[str] = Form(None),
    platform: Optional[str] = Form(None),
    role: Optional[str] = Form(None)
):
    # Step 1 — read file
    file_bytes = await file.read()

    # Step 2 — extract text
    text = parse_resume(file.filename, file_bytes)

    # Step 3 — score resume
    score_data = score_resume(text)

    # Step 4 — ATS check
    ats_issues = check_ats(text)

    # Step 5 — JD match
    jd_match = match_jd(text, jd_text or "")

    # Step 6 — AI feedback (10-section analysis)
    ai_feedback = get_ai_feedback(
        text,
        jd_text or "",
        platform or "",
        role or ""
    )

    # Step 7 — generate optimized resume text
    missing = jd_match.get("missing_keywords", [])
    optimized_text = get_optimized_resume(
        text,
        missing,
        role or "",
        platform or ""
    )

    return {
        "extracted_text": text,
        "optimized_text": optimized_text,
        "score_data": score_data,
        "ats_issues": ats_issues,
        "jd_match": jd_match,
        "ai_feedback": ai_feedback,
        "platform": platform or "general"
    }


@app.post("/download")
async def download_resume(
    resume_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    jd_text: Optional[str] = Form(None),
    platform: Optional[str] = Form(None),
    role: Optional[str] = Form(None)
):
    # Use edited resume text if provided directly
    # Otherwise parse from file
    if resume_text and resume_text.strip():
        text = resume_text
        optimized = resume_text
    elif file:
        file_bytes = await file.read()
        text = parse_resume(file.filename, file_bytes)
        jd_match = match_jd(text, jd_text or "")
        missing = jd_match.get("missing_keywords", [])
        optimized = get_optimized_resume(text, missing, role or "", platform or "")
    else:
        return {"error": "No resume content provided"}

    # Generate platform-specific DOCX
    from templates import generate_resume_docx
    docx_bytes = generate_resume_docx(text, optimized, platform or "general")

    filename = f"optimized_resume_{platform or 'general'}.docx"
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
