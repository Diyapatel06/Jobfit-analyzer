# parser.py — ONE JOB: read resume file, return text

import fitz                   # PyMuPDF — reads PDF
from docx import Document     # reads DOCX
import io                     # work with file bytes in memory

def parse_resume(filename: str, file_bytes: bytes) -> str:
    # filename = "resume.pdf" or "resume.docx"
    # file_bytes = raw binary content of uploaded file

    if filename.lower().endswith(".pdf"):
        # Open PDF from memory
        pdf = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in pdf:           # loop every page
            text += page.get_text() # extract text
        return text

    elif filename.lower().endswith(".docx"):
        # Open DOCX from memory
        doc = Document(io.BytesIO(file_bytes))
        text = ""
        for paragraph in doc.paragraphs:  # loop every paragraph
            text += paragraph.text + "\n"
        return text

    else:
        return "Unsupported file type. Please upload PDF or DOCX."