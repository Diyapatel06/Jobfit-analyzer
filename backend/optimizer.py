# optimizer.py
# ONE JOB: use Gemini AI to give feedback and optimize resume

from google import genai
import os
from dotenv import load_dotenv

# Load .env file so GEMINI_API_KEY is available
load_dotenv()

# Get API key from environment
api_key = os.getenv("GEMINI_API_KEY")

# Role-specific keywords for each job category
# Used to add relevant keywords when no JD is provided
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

# Configure Gemini client
if api_key:
    client = genai.Client(api_key=api_key)
    print("✅ Gemini API connected")
else:
    client = None
    print("⚠️ No GEMINI_API_KEY found in .env file")


def get_ai_feedback(
    resume_text: str,
    jd_text: str = "",
    platform: str = ""
) -> str:
    # Returns 5 bullet points of AI feedback as a string

    # If no API key return helpful message
    if not client:
        return "• Add your GEMINI_API_KEY to backend/.env to enable AI feedback\n• Get a free key at aistudio.google.com"

    try:
        # Build the prompt
        platform_line = f"The candidate is targeting {platform} specifically." if platform else ""
        jd_line = f"\nJob Description to match against:\n{jd_text[:1500]}" if jd_text else ""

        prompt = f"""You are a professional resume reviewer and ATS expert.

Analyze this resume and provide exactly 5 specific, actionable improvement suggestions.
{platform_line}
{jd_line}

Format: exactly 5 bullet points, each starting with •
Each point: 1-2 sentences, direct, practical, specific.
Focus on: missing keywords, weak sections, ATS issues, formatting problems, content gaps.
Do NOT give generic advice. Be specific to this resume.

Resume to analyze:
{resume_text[:2500]}"""

        # Call Gemini API using new google-genai package
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text

    except Exception as e:
        # Return fallback feedback if API fails
        return "• Ensure your contact information is clearly visible at the top\n• Add measurable achievements with numbers and percentages\n• Include relevant technical keywords matching your target role\n• Add a professional summary section at the top\n• Ensure each job description uses strong action verbs"


def get_optimized_resume(
    resume_text: str,
    missing_keywords: list,
    role: str = "",
    platform: str = ""
) -> str:
    # Returns AI-rewritten resume text with missing keywords added naturally

    # Return original if no API key
    if not client:
        return resume_text

    try:
        keywords_str = ", ".join(missing_keywords) if missing_keywords else "none identified"
        role_line = f"Optimize for the role of: {role}" if role else ""
        platform_line = f"Format specifically for {platform}." if platform else ""

        # Add role keywords if role is specified and no JD keywords
        if role and not missing_keywords:
            role_kws = ROLE_KEYWORDS.get(role.lower(), ROLE_KEYWORDS["general"])
            keywords_str = ", ".join(role_kws)

        prompt = f"""You are a professional resume writer and ATS optimization expert.

Rewrite this resume with these exact requirements:
1. Naturally incorporate these missing keywords: {keywords_str}
2. {role_line}
3. {platform_line}
4. Keep ALL original facts, dates, companies, and achievements
5. Only improve wording, add missing keywords naturally
6. Make it ATS-friendly — plain text, no tables, no graphics
7. Use strong action verbs at the start of each bullet point
8. Return ONLY the improved resume text — no explanations

Original Resume:
{resume_text[:2500]}"""

        # Call Gemini API using new google-genai package
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text

    except Exception as e:
        # Return original resume if AI fails
        return resume_text