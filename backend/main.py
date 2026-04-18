# main.py
# Entry point — starts FastAPI server and defines all routes

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from typing import Optional

# Import all our modules
from parser import parse_resume          # reads resume file → text
from scorer import score_resume, check_ats  # scores resume, finds ATS issues
from matcher import match_jd             # compares resume vs JD
from optimizer import get_ai_feedback, get_optimized_resume  # Gemini AI

app = FastAPI(title="JobFit Analyzer API")

# CORS — lets React frontend on port 5173 call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    # Simple health check
    return {"message": "JobFit Analyzer API is running ✅"}


@app.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),              # resume file — required
    jd_text: Optional[str] = Form(None),       # job description — optional
    platform: Optional[str] = Form(None)        # linkedin/naukri/internshala — optional
):
    # ── Step 1: Read file into memory ──────────────────────────
    file_bytes = await file.read()
    # await = wait for full file to load before continuing

    # ── Step 2: Extract text from resume ───────────────────────
    text = parse_resume(file.filename, file_bytes)
    # text = full resume as plain string

    # ── Step 3: Score the resume ────────────────────────────────
    score_data = score_resume(text)
    # score_data = {"total_score": 75, "found_sections": [...], "missing_sections": [...]}

    # ── Step 4: Check ATS issues ────────────────────────────────
    ats_issues = check_ats(text)
    # ats_issues = list of strings like ["Resume too short", ...]

    # ── Step 5: Match against JD ────────────────────────────────
    jd_match = match_jd(text, jd_text or "")
    # jd_match = {"match_score": 67.3, "missing_keywords": [...], "jd_keywords": [...]}

    # ── Step 6: Get AI feedback from Gemini ─────────────────────
    ai_feedback = get_ai_feedback(text, jd_text or "", platform or "")
    # ai_feedback = string with 5 bullet points

    # ── Step 7: Return everything to frontend ───────────────────
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
    # ── Step 1: Read and parse resume ──────────────────────────
    file_bytes = await file.read()
    text = parse_resume(file.filename, file_bytes)

    # ── Step 2: Get missing keywords from JD ───────────────────
    jd_match = match_jd(text, jd_text or "")
    missing = jd_match.get("missing_keywords", [])

    # ── Step 3: Optimize resume with Gemini AI ──────────────────
    optimized = get_optimized_resume(
        text,
        missing,
        role or "",
        platform or ""
    )

    # ── Step 4: Generate platform-specific DOCX ─────────────────
    from templates import generate_resume_docx
    docx_bytes = generate_resume_docx(text, optimized, platform or "general")

    # ── Step 5: Return as downloadable DOCX file ────────────────
    filename = f"optimized_resume_{platform or 'general'}.docx"
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )