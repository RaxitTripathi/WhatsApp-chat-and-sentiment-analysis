# 🚀 Complete Django Backend for WhatsApp Chat Analyzer

This directory contains the complete **Django + Django REST Framework** backend for the **WhatsApp Chat Analyzer** project.

It provides a production-grade relational database architecture (SQLite/PostgreSQL), REST API endpoints, message ingestion, 7-class emotion classification, dynamic deadline resolution (Pending, Upcoming, Past), and file catalogue indexing.

---

## 🏗️ Architecture & Features

1. **Django Models (`analyzer/models.py`)**:
   - `ChatSession`: Uploaded chat records, date range, message volume.
   - `ChatMessageRecord`: Individual parsed message line with sender, emotion, sentiment, arousal.
   - `ActionItemRecord`: Commitments and tasks with dynamic `timeline_category` (`past`, `pending`, `upcoming`).
   - `FileAttachmentRecord`: Extracted `.pdf`, `.docx`, `.zip`, code scripts, and Google Drive links.

2. **REST API Endpoints (`analyzer/views.py`)**:
   - `GET /api/health/`: Service status ping.
   - `POST /api/parse/`: Accepts `.txt` file upload or raw string; parses, categorizes, stores in DB, and returns structured analytics.
   - `GET /api/sessions/<id>/actions/`: Returns action items filtered by `category=past`, `pending`, or `upcoming`.
   - `PATCH /api/sessions/<id>/actions/`: Toggles task completion state (`is_completed`).
   - `GET /api/sessions/<id>/files/`: Lists extracted shared documents with keyword query search (`?q=assignment`).

3. **CORS Configured (`whatsapp_analyzer/settings.py`)**:
   - `CORS_ALLOW_ALL_ORIGINS = True` allows direct API connection from local React / Vite dashboards (running on port `3000` or `5173`).

---

## 💻 How to Run Locally

### 1. Create a Python Virtual Environment
```bash
cd django_backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Start the Django Development Server
```bash
python manage.py runserver 8000
```
The Django REST API will be available at: **`http://127.0.0.1:8000/api/`**

---

## 📡 API Testing Examples

### 1. Health Check
```bash
curl http://127.0.0.1:8000/api/health/
```

### 2. Upload and Parse Chat File
```bash
curl -X POST http://127.0.0.1:8000/api/parse/ \
  -F "file=@../whatsapp_chat_analyzer/sample_chat.txt"
```

### 3. Fetch Action Items Categorized
```bash
# Get all upcoming tasks:
curl http://127.0.0.1:8000/api/sessions/1/actions/?category=upcoming

# Get all pending tasks:
curl http://127.0.0.1:8000/api/sessions/1/actions/?category=pending

# Get past deadlines:
curl http://127.0.0.1:8000/api/sessions/1/actions/?category=past
```
