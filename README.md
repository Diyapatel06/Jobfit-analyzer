# 🚀 JobFit Analyzer

> AI-powered resume analysis and multi-platform optimization tool

---

## 📌 What is JobFit Analyzer?

JobFit Analyzer is a full-stack AI-powered web application that helps job seekers optimize their resumes for specific job descriptions and platforms. It uses Natural Language Processing and Google's Gemini AI to provide actionable feedback, ATS compatibility scores, and platform-specific formatted resume downloads.

---

## ✨ Features

- **Resume Score** — Scores resume out of 100 based on section completeness
- **ATS Compatibility** — Checks if resume will pass Applicant Tracking Systems
- **JD Match Score** — Compares resume against job description using TF-IDF cosine similarity
- **Missing Keywords** — Identifies keywords from JD missing in resume
- **AI Feedback** — 5 specific improvement suggestions powered by Gemini 2.0 Flash
- **Platform Optimization** — Formats resume for LinkedIn, Naukri, or Internshala
- **DOCX Download** — Downloads platform-specific formatted Word document
- **Dark/Light Theme** — Beautiful responsive UI with theme toggle

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Framer Motion |
| Backend | FastAPI (Python 3.11) |
| AI/NLP | Gemini 2.0 Flash, TF-IDF, Cosine Similarity |
| Resume Parsing | PyMuPDF (PDF), python-docx (DOCX) |
| Document Generation | python-docx with platform templates |
| DevOps | Docker, Docker Compose |
| Deployment | Netlify (Frontend) |

---

## 📁 Project Structure
jobfit-analyzer/
├── backend/
│   ├── main.py          # FastAPI entry point
│   ├── parser.py        # PDF and DOCX extraction
│   ├── scorer.py        # Resume scoring and ATS
│   ├── matcher.py       # TF-IDF JD matching
│   ├── optimizer.py     # Gemini AI feedback
│   ├── templates.py     # DOCX generation
│   └── requirements.txt
├── frontend/
│   └── src/
│       └── App.jsx      # Complete React app
├── docker-compose.yml
└── README.md

---

## 🚀 How to Run Locally

### Backend
```bash
cd backend
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## 🎓 Project Details

- **Institution:** Vidyavahini First Grade College, Tumkur
- **Course:** Bachelor of Computer Applications (BCA)
- **Academic Year:** 2024-25
- **Domain:** AI + NLP + Full Stack Web Application

---

## 👩‍💻 Developer

- GitHub: 

**Diya Patel**
[@Diyapatel06](https://github.com/Diyapatel06)
**Sameeksha TS**
[@Sameekshats](https://github.com/Sameekshats)
**Goutham N**
[@Vihaan1906](https://github.com/Vihaan1906)
**Kavya NR**
[@kavyanr22](https://github.com/kavyanr22)
