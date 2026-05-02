# matcher.py
# ONE JOB: compare resume against job description
# Returns match score out of 10, missing keywords, JD keywords

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re


def extract_keywords(text: str, top_n: int = 20) -> list:
    """Extract meaningful keywords from text, filtering common stopwords."""
    stopwords = {
        "this", "that", "with", "from", "have", "been", "will", "your",
        "they", "them", "their", "what", "when", "where", "which", "into",
        "more", "also", "than", "about", "other", "some", "such", "only",
        "both", "each", "much", "very", "just", "over", "even", "most",
        "many", "then", "well", "come", "here", "make", "like", "time",
        "year", "good", "know", "take", "people", "those", "these", "would",
        "could", "should", "shall", "must", "need", "want", "used", "using",
        "work", "working", "role", "position", "team", "company", "looking",
        "candidate", "required", "requirements", "experience", "skills",
        "ability", "strong", "excellent", "great", "good", "plus", "bonus",
        "including", "preferred", "minimum", "least", "years", "degree",
        "bachelor", "master", "knowledge", "understanding", "familiarity"
    }

    # Extract meaningful words (4+ chars) and tech-terms (2+ chars that are uppercase/mixed)
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    tech_terms = re.findall(r'\b[A-Z][a-zA-Z0-9+#.]{1,}\b', text)  # camelCase/caps tech terms
    tech_lower = [t.lower() for t in tech_terms]

    filtered = [w for w in words if w not in stopwords]
    all_words = filtered + tech_lower

    freq = {}
    for w in all_words:
        freq[w] = freq.get(w, 0) + 1

    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, count in sorted_words[:top_n]]


def extract_tech_skills(text: str) -> set:
    """
    Extract specific tech skills, tools, frameworks mentioned in text.
    These are harder to match with simple TF-IDF.
    """
    # Common tech patterns: CamelCase, all-caps acronyms, version numbers
    tech_pattern = re.findall(
        r'\b(?:[A-Z]{2,}|[A-Z][a-z]+(?:[A-Z][a-z]*)+|[a-z]+\.[a-z]+|[A-Za-z]+\d+|'
        r'React|Vue|Angular|Node|Django|FastAPI|Flask|Spring|Docker|Kubernetes|'
        r'AWS|Azure|GCP|SQL|NoSQL|MongoDB|PostgreSQL|MySQL|Redis|GraphQL|REST|'
        r'Python|Java|JavaScript|TypeScript|Golang|Rust|Swift|Kotlin|Scala|'
        r'Figma|Sketch|Adobe|Tableau|PowerBI|Excel|Jira|GitHub|GitLab)\b',
        text
    )
    return set(t.lower() for t in tech_pattern)


def match_jd(resume_text: str, jd_text: str) -> dict:
    """
    Compare resume against job description.
    Returns match_score OUT OF 10 (not 100) for accuracy.
    """
    if not jd_text or not jd_text.strip():
        return {
            "match_score": None,
            "missing_keywords": [],
            "jd_keywords": [],
            "present_keywords": []
        }

    # Step 1 — extract keywords from JD
    jd_keywords = extract_keywords(jd_text, top_n=25)
    jd_tech = extract_tech_skills(jd_text)
    resume_lower = resume_text.lower()
    resume_tech = extract_tech_skills(resume_text)

    # Step 2 — keyword presence check
    present = [kw for kw in jd_keywords if kw in resume_lower]
    missing = [kw for kw in jd_keywords if kw not in resume_lower]

    # Step 3 — tech skill gap (harder requirements)
    tech_missing = jd_tech - resume_tech
    tech_present = jd_tech & resume_tech

    # Step 4 — TF-IDF cosine similarity for semantic match
    try:
        vectorizer = TfidfVectorizer(
            stop_words='english',
            max_features=300,
            ngram_range=(1, 2)  # include bigrams like "machine learning"
        )
        vectors = vectorizer.fit_transform([resume_text, jd_text])
        similarity = cosine_similarity(vectors[0], vectors[1])[0][0]
        # Raw similarity — usually 0.05 to 0.40 for most resumes
        # Scale to 0-10 honestly: most resumes score 2-6 out of 10
        raw_score = float(similarity)
    except Exception:
        raw_score = (len(present) / len(jd_keywords)) if jd_keywords else 0

    # Step 5 — keyword coverage ratio (0 to 1)
    keyword_ratio = len(present) / len(jd_keywords) if jd_keywords else 0
    tech_ratio = len(tech_present) / len(jd_tech) if jd_tech else keyword_ratio

    # Step 6 — weighted final score out of 10
    # TF-IDF similarity: 50%, keyword coverage: 30%, tech coverage: 20%
    weighted = (raw_score * 0.5) + (keyword_ratio * 0.3) + (tech_ratio * 0.2)

    # Scale: cosine similarity rarely exceeds 0.4 even for good matches
    # Map 0.0–0.5 → 0–10 honestly (0.5 cosine similarity = near perfect match)
    match_score_10 = min(round(weighted * 20, 1), 10.0)

    # Build the missing keywords list — prioritize tech skills
    tech_missing_list = [t for t in list(tech_missing)[:6] if len(t) > 2]
    keyword_missing_list = [k for k in missing[:10] if k not in tech_missing_list]
    all_missing = tech_missing_list + keyword_missing_list

    return {
        "match_score": match_score_10,          # float 0.0–10.0
        "missing_keywords": all_missing[:12],    # combined missing list
        "jd_keywords": jd_keywords,
        "present_keywords": present,
        "tech_missing": tech_missing_list,
        "tech_present": list(tech_present)
    }
