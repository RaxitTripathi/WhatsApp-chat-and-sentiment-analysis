# 🐍 Python / Streamlit / Django Architecture & Code Reference

This directory contains pure **Python**, **Streamlit**, and **Django** implementations of the WhatsApp Chat Intelligence Platform and the **Shared Files & Document Finder**.

You can use these files directly in your **project report**, **presentation slides**, and **college viva defense**!

---

## 📁 Files Included

1. **`app_streamlit.py`**:
   - Complete, standalone **Streamlit** application.
   - Includes:
     - 📁 **Shared Files & PDF Finder** (with keyword search for items like `"DAA Assignment 3 PDF"`, file type filters, and one-click downloads).
     - ✅ **Bilingual Action Item Extractor** (English & Hinglish modal patterns).
     - 📊 **Overview Statistics & KPIs** (message counts, participant activity).
     - 🛡️ **1-Click GDPR Privacy & PII Redaction** (phone and name masking).
   - **How to run on your local PC:**
     ```bash
     pip install streamlit pandas
     streamlit run python_backend/app_streamlit.py
     ```

2. **`django_views.py`**:
   - Standard **Django** view controller.
   - Demonstrates:
     - `chat_analyzer_view`: Handling `.txt` file uploads via Django multipart forms.
     - `search_files_api`: RESTful JSON endpoint (`/api/search-files/?q=daa+assignment+3`).
     - `download_file_api`: Streaming dynamic PDF downloads via `HttpResponse`.

---

## 💡 How to Explain This to Examiners in Your Review:

> *"Sir/Ma'am, for our architecture we built both:
> 1. A **High-Performance Client-Side React/TypeScript Dashboard** running in the browser with zero server latency and 100% in-memory data confidentiality.
> 2. A **Python-Powered Backend Engine (Streamlit & Django)** implementing the regex parsing, semantic document indexing, and Hinglish NLP slot-filling algorithms."*
