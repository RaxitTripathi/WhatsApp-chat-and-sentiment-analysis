"""
Django Views and NLP Processing Engine
File: python_backend/django_views.py

This file demonstrates how the entire WhatsApp Chat Intelligence and Document Finder
can be integrated into standard Django function-based or class-based views.
"""

from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
import re
import json

HEADER_REGEX = re.compile(
    r'^\[?(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}|[A-Za-z]{3,9}\.?\s\d{1,2},?\s\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:[APap]\.?[Mm]\.?)?)\]?\s*[-–—]?\s*(.*)$'
)
FILE_EXT_REGEX = re.compile(
    r'\b([a-zA-Z0-9_\-.\s]+\.(pdf|docx?|pptx?|xlsx?|csv|zip|rar|ipynb|py|cpp|java))\b',
    re.IGNORECASE
)
DRIVE_URL_REGEX = re.compile(
    r'(https?://(?:drive|docs)\.google\.com/[^\s]+|https?://github\.com/[^\s]+)',
    re.IGNORECASE
)
ACTION_PATTERNS = re.compile(
    r'\b(i will|i\'ll|let me|please send|make sure to|reminder|deadline|main kar dunga|bhej dena|submit karna hai)\b',
    re.IGNORECASE
)

def parse_raw_chat(text):
    messages = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        match = HEADER_REGEX.match(line)
        if match:
            date_str, time_str, rest = match.groups()
            user = "System"
            msg = rest
            if ": " in rest:
                parts = rest.split(": ", 1)
                user = parts[0].strip()
                msg = parts[1].strip()
            messages.append({
                "date": date_str,
                "time": time_str,
                "user": user,
                "message": msg
            })
        elif messages:
            messages[-1]["message"] += f"\n{line}"
    return messages

def extract_files_from_messages(messages):
    files = []
    for msg in messages:
        text = msg["message"]
        for match in FILE_EXT_REGEX.findall(text):
            filename = match[0].strip()
            ext = match[1].lower()
            files.append({
                "filename": filename,
                "extension": ext,
                "user": msg["user"],
                "date": f"{msg['date']} {msg['time']}",
                "context": text,
                "url": None
            })
        for drive_url in DRIVE_URL_REGEX.findall(text):
            files.append({
                "filename": "Google Drive / Cloud Resource",
                "extension": "cloud",
                "user": msg["user"],
                "date": f"{msg['date']} {msg['time']}",
                "context": text,
                "url": drive_url
            })
    return files

# -------------------------------------------------------------
# Django View Endpoints
# -------------------------------------------------------------
def chat_analyzer_view(request):
    """
    Main Django template view rendering the dashboard
    """
    if request.method == "POST" and request.FILES.get("chat_file"):
        uploaded = request.FILES["chat_file"].read().decode("utf-8")
        messages = parse_raw_chat(uploaded)
        files = extract_files_from_messages(messages)
        return render(request, "chat_analyzer.html", {
            "messages": messages,
            "files": files,
            "total_messages": len(messages),
            "total_files": len(files)
        })

    return render(request, "chat_analyzer.html", {"messages": [], "files": []})

def search_files_api(request):
    """
    Django REST/JSON endpoint for searching files (e.g. /api/search-files/?q=daa+assignment+3)
    """
    query = request.GET.get("q", "").lower()
    raw_chat = request.session.get("raw_chat", "")
    messages = parse_raw_chat(raw_chat)
    all_files = extract_files_from_messages(messages)

    if query:
        filtered = [
            f for f in all_files
            if query in f["filename"].lower() or query in f["context"].lower()
        ]
    else:
        filtered = all_files

    return JsonResponse({"results": filtered, "count": len(filtered)})

def download_file_api(request, filename):
    """
    Django response to serve or generate a PDF file for download
    """
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    # Generate simple PDF content
    response.write(b"%PDF-1.4 ... Synthetic Companion Content for " + filename.encode("utf-8"))
    return response
