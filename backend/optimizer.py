import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")
    print("Gemini API connected ✅")
else:
    model = None
    print("No GEMINI_API_KEY found ❌")


def get_ai_feedback(resume_text, jd_text="", platform="", role=""):
    if not model:
        return "Add GEMINI_API_KEY to backend/.env"

    prompt = f"""
    Resume:
    {resume_text[:2000]}

    JD:
    {jd_text[:1000]}
    """

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception:
        return "AI failed. Try again."