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
    # Returns structured 10-section AI analysis as plain text

    if not client:
        return "Add your GEMINI_API_KEY to backend/.env to enable AI analysis."

    try:
        jd_section = (
            f"JOB DESCRIPTION:\n{jd_text[:1500]}"
            if jd_text and jd_text.strip()
            else f"No JD provided. Analyze resume quality for a {role or 'software'} role."
        )

        prompt = f"""You are an advanced AI Resume Analyzer inside a platform called JobFit Analyzer.

Analyze the resume against the job description like a recruiter, ATS system, and career coach.
Be specific to THIS resume. Never give generic advice.
Use plain text only. No markdown symbols like **, ##, or *.

RESUME:
{resume_text[:2500]}

{jd_section}

TARGET ROLE: {role or "Not specified"}
TARGET PLATFORM: {platform or "General"}

Output EXACTLY these 10 sections with these exact headings:

1. MATCH SCORE
Give a percentage from 0 to 100 based on skills match 40 percent, experience relevance 30 percent, projects relevance 20 percent, certifications and extras 10 percent. Write a 2 to 3 line explanation of the score.

2. RECRUITER DECISION
Classify the candidate as exactly one of: Rejected, Maybe, or Shortlisted.
Explain the decision in 3 bullet points using real hiring logic specific to this resume.

3. MISSING KEYWORDS
List keywords from the JD missing in the resume.
Critical Missing: list the most important ones
Secondary Missing: list medium priority ones
Only include role-relevant terms.

4. ATS RISK ALERTS
List 4 to 6 specific issues found in this resume such as missing measurable achievements, generic project descriptions, missing tools from JD, weak summary, or poor alignment with target role.
Be specific to this resume only.

5. SECTION FEEDBACK
For each of these sections: Summary, Skills, Projects, Experience
State exactly what is wrong and what should be improved.

6. ACTIONABLE IMPROVEMENTS
Give 4 to 6 exact practical suggestions including specific tools to add, how to rewrite content, where to include keywords naturally, and how to add measurable impact with examples.

7. RESUME REWRITE
Rewrite either the Summary section or one Project description into a strong version using action verbs and measurable metrics. Label clearly which section you are rewriting.

8. CAREER GAP ANALYSIS
Start with: You are X percent ready for this role.
Then list skills to learn, projects to add, and improvements needed to reach 85 to 90 percent readiness.

9. INTERVIEW PREPARATION
List 2 to 3 interview questions likely to be asked based on this specific resume and JD.
Add 1 practical preparation tip specific to this candidate.

10. FINAL ADVICE
State the single biggest weakness in this resume.
State one high-impact change that will significantly improve shortlisting chances.

Rules:
- No asterisks, no hash symbols, no markdown formatting of any kind
- Every point must be specific to the resume and JD provided
- Do not assume skills not present in the resume
- Keep each section concise and actionable"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text

    except Exception as e:
        return (
            "1. MATCH SCORE\n"
            "Unable to calculate score - API unavailable.\n\n"
            "2. RECRUITER DECISION\n"
            "Maybe\n"
            "- Resume has basic structure but needs improvement\n"
            "- Add more relevant keywords from the job description\n"
            "- Quantify achievements with numbers and metrics\n\n"
            "10. FINAL ADVICE\n"
            "Add your GEMINI_API_KEY to backend/.env to get full analysis."
        )


def get_optimized_resume(
    resume_text: str,
    missing_keywords: list,
    role: str = "",
    platform: str = ""
) -> str:
    # Returns AI-rewritten resume text with keywords added

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
1. Naturally incorporate these missing keywords: {keywords_str}
2. {role_line}
3. {platform_line}
4. Keep ALL original facts, dates, companies, and achievements
5. Only improve wording and add missing keywords naturally
6. Make it ATS-friendly with plain text, no tables, no graphics
7. Use strong action verbs at the start of each bullet point
8. Return ONLY the improved resume text with no explanations

Original Resume:
{resume_text[:2500]}"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text

    except Exception as e:
        return resume_text