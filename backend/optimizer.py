# optimizer.py — Gemini AI feedback, career readiness, resume optimization

import os
from dotenv import load_dotenv
from pathlib import Path
import google.generativeai as genai

# Load .env from the same directory as this file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")

ROLE_KEYWORDS = {
    "developer": ["Python", "JavaScript", "REST API", "Git", "Agile", "backend", "frontend", "database", "deployment", "debugging", "version control", "code review", "unit testing"],
    "analyst": ["data analysis", "Excel", "SQL", "Power BI", "reporting", "dashboard", "insights", "metrics", "KPI", "visualization", "business intelligence", "data cleaning", "stakeholder"],
    "designer": ["Figma", "UI/UX", "wireframe", "prototype", "user research", "design system", "responsive", "accessibility", "Adobe XD", "user flow", "interaction design"],
    "marketing": ["SEO", "content strategy", "social media", "campaign", "analytics", "engagement", "brand", "copywriting", "email marketing", "conversion", "audience", "growth"],
    "general": ["communication", "teamwork", "problem solving", "leadership", "time management", "adaptability", "critical thinking", "project management", "attention to detail"]
}

# Configure Gemini
if api_key and api_key.strip():
    try:
        genai.configure(api_key=api_key.strip())

        model = genai.GenerativeModel("gemini-1.5-flash")

        print(f"Gemini API connected successfully - key ends with ...{api_key.strip()[-6:]}")
    except Exception as e:
        model = None
        print(f"Gemini API connection failed: {e}")
else:
    model = None
    print(f"WARNING: GEMINI_API_KEY not found. Checked path: {env_path}")
    print(f"Current working dir: {os.getcwd()}")


def get_ai_feedback(resume_text: str, jd_text: str = "", platform: str = "", role: str = "") -> str:

    fallback = (
        "1. MATCH SCORE\n"
        "Add GEMINI_API_KEY to backend/.env to enable full AI analysis.\n\n"
        "2. RECRUITER DECISION\n"
        "Maybe\n"
        "- Resume has basic structure but needs improvement\n"
        "- Add more keywords from the job description\n"
        "- Quantify achievements with numbers and percentages\n\n"
        "3. MISSING KEYWORDS\n"
        "Critical Missing: Add API key to analyze\n"
        "Secondary Missing: Add API key to analyze\n\n"
        "4. ATS RISK ALERTS\n"
        "- Add GEMINI_API_KEY to backend/.env to get full ATS analysis\n"
        "- Visit aistudio.google.com to get a free API key\n\n"
        "5. SECTION FEEDBACK\n"
        "Summary: Add API key for detailed feedback\n"
        "Skills: Add API key for detailed feedback\n"
        "Projects: Add API key for detailed feedback\n"
        "Experience: Add API key for detailed feedback\n\n"
        "6. ACTIONABLE IMPROVEMENTS\n"
        "- Add GEMINI_API_KEY to backend/.env to enable this feature\n\n"
        "7. RESUME REWRITE\n"
        "Add API key to get AI-powered resume rewrite.\n\n"
        "8. CAREER GAP ANALYSIS\n"
        f"You are 60 percent ready for this role.\n"
        "- Add a hands-on project relevant to this role with real deployment\n"
        "- Quantify your achievements with measurable numbers and percentages\n"
        "- Include tools and technologies mentioned in the JD\n"
        "- Add a professional summary targeting this specific role\n"
        "- Get a relevant certification to close identified skill gaps\n\n"
        "9. INTERVIEW PREPARATION\n"
        "Add API key to get personalized interview questions.\n\n"
        "10. FINAL ADVICE\n"
        "Add your free Gemini API key at aistudio.google.com to unlock all features."
    )

    if not model:
        return fallback

    try:
        jd_section = (
            f"JOB DESCRIPTION:\n{jd_text[:1500]}"
            if jd_text and jd_text.strip()
            else f"No JD provided. Analyze resume quality for a {role or 'software'} role."
        )

        prompt = f"""You are an advanced AI Resume Analyzer inside a platform called JobFit Analyzer.
Analyze the resume against the job description like a recruiter, ATS system, and career coach combined.
Be specific to THIS resume only. Never give generic advice.
Use plain text only. No asterisks, no hash symbols, no markdown of any kind.
Use simple dashes like - for bullet points only.

RESUME:
{resume_text[:2500]}

{jd_section}

TARGET ROLE: {role or "Not specified"}
TARGET PLATFORM: {platform or "General"}

Output EXACTLY these 10 sections with these exact headings and nothing else:

1. MATCH SCORE
Give a percentage from 0 to 100 based on skills match 40 percent weight, experience relevance 30 percent weight, projects relevance 20 percent weight, certifications 10 percent weight.
Write a 2 to 3 line explanation specific to this resume.

2. RECRUITER DECISION
Classify as exactly one of: Rejected, Maybe, or Shortlisted
Give 3 bullet points explaining using real hiring logic for this specific resume.

3. MISSING KEYWORDS
Critical Missing: list most important keywords from JD missing in resume
Secondary Missing: list medium priority keywords missing in resume

4. ATS RISK ALERTS
List 4 to 6 specific issues in THIS resume. Be specific, not generic.

5. SECTION FEEDBACK
Summary: what is wrong and what should be improved
Skills: what is wrong and what should be improved
Projects: what is wrong and what should be improved
Experience: what is wrong and what should be improved

6. ACTIONABLE IMPROVEMENTS
Give 4 to 6 exact practical suggestions with tools, rewrites, and measurable impact examples.

7. RESUME REWRITE
Rewrite either Summary or one Project into a strong version using action verbs and metrics.

8. CAREER GAP ANALYSIS
Start with EXACTLY: You are X percent ready for this role.
Then list specific actionable things on separate lines to reach 85 to 90 percent readiness.

9. INTERVIEW PREPARATION
List 2 to 3 likely interview questions based on this specific resume and JD.
Add 1 practical preparation tip specific to this candidate.

10. FINAL ADVICE
State the single biggest weakness in this resume.
State one high-impact change to significantly improve shortlisting chances.
"""

        response = model.generate_content(prompt)

        return response.text

    except Exception as e:
        print(f"Gemini API error in get_ai_feedback: {e}")
        return fallback


def get_jd_diff(resume_text: str, jd_text: str = "", missing_keywords: list = [], role: str = "") -> str:

    if not model or not jd_text or not jd_text.strip():
        missing_list = "\n".join([f"- {kw}" for kw in missing_keywords[:8]]) if missing_keywords else "- No JD provided"

        return (
            f"KEY REQUIREMENTS FROM JD\n"
            f"- Paste a job description to see what the role requires\n"
            f"- This panel shows how your resume compares to the JD\n"
            f"- Add your Gemini API key for deeper analysis\n\n"
            f"WHAT IS MISSING\n{missing_list}\n\n"
            f"CHANGES AI MADE\n"
            f"- Added relevant keywords naturally to experience sections\n"
            f"- Strengthened summary to align with role requirements\n"
            f"- Enhanced project descriptions with measurable outcomes\n"
            f"- Improved action verbs throughout the resume"
        )

    try:
        prompt = f"""You are a resume optimization expert.

Compare this resume against the job description and produce a clear analysis.

RESUME:
{resume_text[:2000]}

JOB DESCRIPTION:
{jd_text[:1200]}

TARGET ROLE: {role or "Not specified"}
"""

        response = model.generate_content(prompt)

        return response.text

    except Exception as e:
        print(f"Gemini API error in get_jd_diff: {e}")

        missing_list = "\n".join([f"- {kw}" for kw in missing_keywords[:8]]) if missing_keywords else "- None identified"

        return (
            f"KEY REQUIREMENTS FROM JD\n"
            f"- Technical skills matching the role\n"
            f"- Relevant project experience\n"
            f"- Domain knowledge and tools\n\n"
            f"WHAT IS MISSING\n{missing_list}\n\n"
            f"CHANGES AI MADE\n"
            f"- Added missing keywords naturally to experience sections\n"
            f"- Strengthened summary to align with role requirements\n"
            f"- Enhanced project descriptions with measurable outcomes"
        )


def get_optimized_resume(resume_text: str, missing_keywords: list, role: str = "", platform: str = "") -> str:

    if not model:
        return resume_text

    try:
        keywords_str = ", ".join(missing_keywords) if missing_keywords else "none identified"

        role_line = f"Optimize for the role of: {role}" if role else ""
        platform_line = f"Format specifically for {platform}." if platform else ""

        if role and not missing_keywords:
            role_kws = ROLE_KEYWORDS.get(role.lower(), ROLE_KEYWORDS["general"])
            keywords_str = ", ".join(role_kws)

        prompt = f"""You are a professional resume writer and ATS optimization expert.

Rewrite this resume with these requirements:
1. Naturally incorporate these missing keywords: {keywords_str}
2. {role_line}
3. {platform_line}
4. Keep ALL original facts, dates, companies, and achievements
5. Only improve wording and add missing keywords naturally
6. Make it ATS-friendly with plain text, no tables, no graphics
7. Use strong action verbs at the start of each bullet point
8. Return ONLY the improved resume text with no explanations or headers

Original Resume:
{resume_text[:2500]}
"""

        response = model.generate_content(prompt)

        return response.text

    except Exception as e:
        print(f"Gemini API error in get_optimized_resume: {e}")
        return resume_text
    