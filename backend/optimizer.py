# optimizer.py — ONE JOB: call Gemini AI for feedback and optimization

import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()  # load GEMINI_API_KEY from .env file

# Configure Gemini with API key
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def get_ai_feedback(resume_text: str, jd_text: str = "", platform: str = "") -> str:
    # Returns AI-generated feedback as a string
    if not api_key:
        return "Add your GEMINI_API_KEY to the .env file to enable AI feedback."

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")

        platform_note = f"The resume is being optimized for {platform}." if platform else ""

        prompt = f"""You are a professional resume reviewer and career coach.

Analyze this resume and give exactly 5 specific, actionable improvement suggestions.
{platform_note}
{"Compare it against this job description: " + jd_text if jd_text else ""}

Format your response as exactly 5 bullet points starting with •
Each point should be 1-2 sentences, direct and practical.
Focus on what's missing or weak.

Resume:
{resume_text[:3000]}"""

        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        return f"AI feedback unavailable: {str(e)}"


def get_optimized_resume(resume_text: str, missing_keywords: list, role: str = "", platform: str = "") -> str:
    # Returns AI-optimized resume text
    if not api_key:
        return resume_text

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")

        keywords_str = ", ".join(missing_keywords) if missing_keywords else "none"
        platform_note = f"Format it specifically for {platform}." if platform else ""

        prompt = f"""You are a professional resume writer.

Rewrite this resume to naturally include these missing keywords: {keywords_str}
{"Optimize it for the role of: " + role if role else ""}
{platform_note}

Rules:
- Keep ALL original information and facts
- Only improve wording and naturally add missing keywords
- Keep it ATS-friendly — no tables, no graphics, plain text only
- Return ONLY the improved resume text, nothing else

Resume:
{resume_text[:3000]}"""

        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        return resume_text  # return original if AI fails