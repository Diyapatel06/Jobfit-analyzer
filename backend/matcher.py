# matcher.py
# ONE JOB: compare resume against job description
# Returns match score, missing keywords, JD keywords

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

def extract_keywords(text: str, top_n: int = 20) -> list:
    # These common words add no value — ignore them
    stopwords = {
        "this","that","with","from","have","been","will","your",
        "they","them","their","what","when","where","which","into",
        "more","also","than","about","other","some","such","only",
        "both","each","much","very","just","over","even","most",
        "many","then","well","come","here","make","like","time",
        "year","good","know","take","people","those","these","would",
        "could","should","shall","must","need","want","used","using",
        "work","working","role","position","team","company","looking",
        "candidate","required","requirements","experience","skills"
    }

    # Extract all words with 4+ letters
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())

    # Remove stopwords
    filtered = [w for w in words if w not in stopwords]

    # Count how many times each word appears
    freq = {}
    for w in filtered:
        freq[w] = freq.get(w, 0) + 1

    # Return top N most frequent words
    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, count in sorted_words[:top_n]]


def match_jd(resume_text: str, jd_text: str) -> dict:
    # If no JD provided return empty result
    if not jd_text or not jd_text.strip():
        return {
            "match_score": None,
            "missing_keywords": [],
            "jd_keywords": []
        }

    # Step 1 — extract important keywords from JD
    jd_keywords = extract_keywords(jd_text, top_n=20)

    resume_lower = resume_text.lower()

    # Step 2 — check which keywords are in resume and which are missing
    present = [kw for kw in jd_keywords if kw in resume_lower]
    missing = [kw for kw in jd_keywords if kw not in resume_lower]

    # Step 3 — calculate match score using TF-IDF cosine similarity
    # This is the same method real ATS systems use
    try:
        vectorizer = TfidfVectorizer(
            stop_words='english',   # remove common English words
            max_features=500        # consider top 500 features
        )
        # Create vectors for both resume and JD
        vectors = vectorizer.fit_transform([resume_text, jd_text])

        # Calculate similarity — 1.0 = perfect match, 0.0 = no match
        similarity = cosine_similarity(vectors[0], vectors[1])[0][0]

        # Convert to percentage
        match_score = round(float(similarity) * 100, 1)

    except Exception as e:
        # Fallback — simple keyword match percentage
        match_score = round(
            (len(present) / len(jd_keywords)) * 100
        ) if jd_keywords else 0

    return {
        "match_score": match_score,         # float like 67.3
        "missing_keywords": missing[:12],   # top 12 missing keywords
        "jd_keywords": jd_keywords          # all JD keywords found
    }
