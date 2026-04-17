# scorer.py — ONE JOB: score resume and find ATS problems

def score_resume(text: str) -> dict:
    text_lower = text.lower()
    score = 0
    found = []
    missing = []

    # Check 6 sections — 15 points each = 90 max
    sections = {
        "Email":      "@" in text,
        "Phone":      any(char.isdigit() for char in text),
        "Education":  "education" in text_lower or "qualification" in text_lower,
        "Experience": "experience" in text_lower or "work" in text_lower,
        "Skills":     "skills" in text_lower or "technologies" in text_lower,
        "Projects":   "project" in text_lower
    }

    for name, present in sections.items():
        if present:
            score += 15
            found.append(name)
        else:
            missing.append(name)

    return {
        "total_score": score,          # e.g. 75
        "found_sections": found,       # e.g. ["Email", "Skills"]
        "missing_sections": missing    # e.g. ["Phone"]
    }


def check_ats(text: str) -> list:
    issues = []
    words = text.split()
    text_lower = text.lower()

    if len(words) < 200:
        issues.append("Resume is too short — add more detail")
    if "@" not in text:
        issues.append("No email address found")
    if not any(char.isdigit() for char in text):
        issues.append("No phone number found")
    if "experience" not in text_lower and "work" not in text_lower:
        issues.append("No experience section detected")
    if "skills" not in text_lower:
        issues.append("No skills section detected")

    return issues