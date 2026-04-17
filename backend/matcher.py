# matcher.py — ONE JOB: match resume against job description

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

def extract_keywords(text: str, top_n: int = 15) -> list:
    # Remove short words and stopwords
    stopwords = {"this","that","with","from","have","been","will","your",
                 "they","them","their","what","when","where","which","into",
                 "more","also","than","about","other","some","such","only",
                 "both","each","much","very","just","over","even","most",
                 "many","then","well","come","here","make","like","time",
                 "year","good","know","take","people","those","these","would",
                 "could","should","shall","must","need","want","used","using"}

    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    filtered = [w for w in words if w not in stopwords]

    # Count frequency
    freq = {}
    for w in filtered:
        freq[w] = freq.get(w, 0) + 1

    # Sort by frequency and return top N
    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [w for w, _ in sorted_words[:top_n]]


def match_jd(resume_text: str, jd_text: str) -> dict:
    if not jd_text or not jd_text.strip():
        return {"match_score": None, "missing_keywords": [], "jd_keywords": []}

    # Extract keywords from JD
    jd_keywords = extract_keywords(jd_text, top_n=20)
    resume_lower = resume_text.lower()

    # Check which keywords are present/missing in resume
    present = [kw for kw in jd_keywords if kw in resume_lower]
    missing = [kw for kw in jd_keywords if kw not in resume_lower]

    # Calculate match score using cosine similarity
    try:
        vectorizer = TfidfVectorizer()
        vectors = vectorizer.fit_transform([resume_text, jd_text])
        similarity = cosine_similarity(vectors[0], vectors[1])[0][0]
        match_score = round(float(similarity) * 100, 1)
    except:
        # Fallback to simple keyword match
        match_score = round((len(present) / len(jd_keywords)) * 100) if jd_keywords else 0

    return {
        "match_score": match_score,        # 0-100 float
        "missing_keywords": missing[:12],  # top 12 missing
        "jd_keywords": jd_keywords         # all JD keywords
    }