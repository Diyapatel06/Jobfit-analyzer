# optimizer.py
# Gemini AI feedback, resume optimization, role keywords

from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

ROLE_KEYWORDS = {
    "developer": [
        "Python", "JavaScript", "REST API", "Git", "Agile",
        "backend", "frontend", "database", "deployment", "debugging",
        "version control", "code review", "unit testing"
    ],
    "analyst": [
        "data analysis", "Excel", "SQL", "Power BI", "reporting",
        "dashboard", "insights", "metrics", "KPI", "visualization",
        "business intelligence", "data cleaning", "stakeholder"
    ],
    "designer": [
        "Figma", "UI/UX", "wireframe", "prototype", "user research",
        "design system", "responsive", "accessibility", "Adobe XD",
        "user flow", "interaction design", "visual design"
    ],
    "marketing": [
        "SEO", "content strategy", "social media", "campaign",
        "analytics", "engagement", "brand", "copywriting",
        "email marketing", "conversion", "audience", "growth"
    ],
    "general": [
        "communication", "teamwork", "problem solving", "leadership",
        "time management", "adaptability", "critical thinking",
        "project management", "attention to detail", "collaboration"
    ]
}

if api_key:
    client = genai.Client(api_key=api_key)
    print("Gemini API connected")
else:
    client = None
    print("No GEMINI_API_KEY found in .env file")


def get_ai_feedback(
    resume_text: str,
    jd_text: str = "",
    platform: str = "",
    role: str = ""
) -> str:
    """
    Returns structured AI analysis as plain text.
    Sections are separated by |SECTION| markers for easy frontend parsing.
    """

    if not client:
        return "Add your GEMINI_API_KEY to backend/.env to enable AI analysis."

    try:
        jd_section = (
            f"JOB DESCRIPTION:\n{jd_text[:2000]}"
            if jd_text and jd_text.strip()
            else f"No JD provided. Analyze resume quality for a {role or 'software'} role."
        )

        prompt = f"""You are an expert AI Resume Analyzer for a platform called JobFit Analyzer.
Analyze this exact resume against this exact job description. Be 100% specific — never give generic advice.
Use plain text only. No markdown, no **, no ##, no *.

RESUME:
{resume_text[:3000]}

{jd_section}

TARGET ROLE: {role or "Not specified"}
TARGET PLATFORM: {platform or "General"}

Output EXACTLY these sections with EXACTLY these pipe-separated markers as shown. Do not add any extra text before or after the markers.

|SECTION|READINESS_SCORE
Write exactly: You are X% ready to become a [role from JD or target role].
Then on the next line write exactly: To reach 85% readiness:
Then list 3 to 5 specific things from THIS resume and THIS JD only. Each on its own line starting with ITEM:
Example:
ITEM: Learn Docker — the JD requires containerization but your resume shows no container experience
ITEM: Add SQL query examples — the JD mentions "complex SQL queries" but your skills section only lists SQL without specifics
ITEM: Mention your MongoDB certification from [certificate name if present] in the Skills section header

|SECTION|RECRUITER_DECISION
Write exactly one of: SHORTLISTED or MAYBE or REJECTED
Then on the next line write a 2-sentence recruiter reasoning specific to this resume and JD only.

|SECTION|ATS_SCORE
Write exactly: ATS Score: X/10
Then on next line write: JD Match: Y/10
Then on next line write: Keyword Coverage: Z/10
These numbers must be based on actual analysis of the resume vs JD. Do not default to high scores.
Then write 2-3 sentences explaining the scores referencing specific missing or present elements.

|SECTION|MISSING_SKILLS
List only skills and tools explicitly mentioned in the JD that are NOT found anywhere in the resume.
Format each as: CRITICAL: [skill] — [why it matters for this specific JD]
Or: SECONDARY: [skill] — [why it matters for this specific JD]
Maximum 8 items. Only include real gaps — do not invent missing skills.

|SECTION|IMPROVEMENTS
List 4 to 6 specific improvements for THIS resume based on THIS JD.
Each must reference a real section or line from the resume.
Format each as: IMPROVE: [specific change] — [exact reason tied to JD requirement]

|SECTION|REWRITE
Pick the weakest section (Summary or one Project) from this resume.
Write: REWRITING: [section name]
Then write the original line or paragraph.
Then write: IMPROVED VERSION:
Then write the rewritten version with action verbs, metrics, and keywords from the JD woven in naturally.

|SECTION|TIPS_AND_TRICKS
Write 4 to 6 platform-specific and role-specific tips for this candidate only.
These must be actionable tactics — not generic resume advice.
Base each tip on what you see in their resume and what the JD asks for.
Format each as: TIP: [specific tip tied to this resume and JD]

|SECTION|INTERVIEW_PREP
List 3 interview questions likely to be asked based on this specific resume and JD.
Format each as: Q: [question]
Then write: PREP TIP: [one specific preparation advice for this candidate]

Rules:
- Every single point must be derived from the actual resume text and actual JD text provided
- Do not invent skills, experiences, or certifications not present in the resume
- Do not give generic advice that could apply to anyone
- Scores should reflect real gaps — a resume with 3 matching skills out of 15 JD requirements should score low
- Keep language direct, recruiter-style, no fluff"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text

    except Exception as e:
        return (
            "|SECTION|READINESS_SCORE\n"
            "You are 0% ready — API unavailable.\n"
            "To reach 85% readiness:\n"
            "ITEM: Add your GEMINI_API_KEY to backend/.env to get full analysis\n\n"
            "|SECTION|RECRUITER_DECISION\n"
            "MAYBE\n"
            "API key missing — connect Gemini to get real recruiter analysis.\n\n"
            "|SECTION|ATS_SCORE\n"
            "ATS Score: 0/10\n"
            "JD Match: 0/10\n"
            "Keyword Coverage: 0/10\n"
            "Add GEMINI_API_KEY to get real scores.\n\n"
            "|SECTION|MISSING_SKILLS\n"
            "CRITICAL: API Key — Add GEMINI_API_KEY to backend/.env\n\n"
            "|SECTION|IMPROVEMENTS\n"
            "IMPROVE: Add API key — Connect Gemini to get specific improvements\n\n"
            "|SECTION|REWRITE\n"
            "REWRITING: N/A\nConnect Gemini API to get resume rewrite.\n\n"
            "|SECTION|TIPS_AND_TRICKS\n"
            "TIP: Add your GEMINI_API_KEY to backend/.env to unlock tips\n\n"
            "|SECTION|INTERVIEW_PREP\n"
            "Q: Connect Gemini API to get interview questions\n"
            "PREP TIP: Add GEMINI_API_KEY to backend/.env"
        )


def get_optimized_resume(
    resume_text: str,
    missing_keywords: list,
    role: str = "",
    platform: str = ""
) -> str:
    """Returns AI-rewritten resume text with keywords added naturally."""

    if not client:
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
1. Naturally incorporate these missing keywords where they genuinely apply: {keywords_str}
2. {role_line}
3. {platform_line}
4. Keep ALL original facts, dates, companies, education, and achievements — do not invent anything
5. Only improve wording and add missing keywords naturally where they fit
6. Make it ATS-friendly: plain text, no tables, no graphics, no special characters
7. Use strong action verbs at the start of each bullet point
8. Improve measurability — add metrics where implied but not stated
9. Return ONLY the improved resume text with no explanations, no preamble, no commentary

Original Resume:
{resume_text[:3000]}"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text

    except Exception as e:
        return resume_text
