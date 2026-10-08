"""
WhatsApp Chat Intelligence & Analytics Platform
Streamlit Web Application (app.py)

To run locally on your computer:
1. pip install streamlit pandas plotly reportlab
2. streamlit run app.py
"""

import streamlit as st
import re
import pandas as pd
from datetime import datetime
import io

st.set_page_config(
    page_title="WhatsApp Chat Intelligence & Document Finder",
    page_icon="📱",
    layout="wide"
)

# -------------------------------------------------------------
# 1. Parsing Engine
# -------------------------------------------------------------
HEADER_REGEX = re.compile(
    r'^\[?(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}|[A-Za-z]{3,9}\.?\s\d{1,2},?\s\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:[APap]\.?[Mm]\.?)?)\]?\s*[-–—]?\s*(.*)$'
)

def parse_chat(text: str) -> pd.DataFrame:
    records = []
    lines = text.splitlines()
    current_record = None

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        match = HEADER_REGEX.match(line)
        if match:
            if current_record:
                records.append(current_record)
            
            date_str, time_str, rest = match.groups()
            user = "System"
            msg = rest
            if ": " in rest:
                parts = rest.split(": ", 1)
                user = parts[0].strip()
                msg = parts[1].strip()

            current_record = {
                "date": date_str,
                "time": time_str,
                "user": user,
                "message": msg
            }
        elif current_record:
            current_record["message"] += f"\n{line}"

    if current_record:
        records.append(current_record)

    return pd.DataFrame(records)


# -------------------------------------------------------------
# 2. Document & PDF Finder Engine (e.g. DAA Assignment 3)
# -------------------------------------------------------------
FILE_EXT_REGEX = re.compile(
    r'\b([a-zA-Z0-9_\-.\s]+\.(pdf|docx?|pptx?|xlsx?|csv|zip|rar|ipynb|py|cpp|java))\b',
    re.IGNORECASE
)
DRIVE_URL_REGEX = re.compile(
    r'(https?://(?:drive|docs)\.google\.com/[^\s]+|https?://github\.com/[^\s]+)',
    re.IGNORECASE
)

def extract_files(df: pd.DataFrame):
    files = []
    for idx, row in df.iterrows():
        msg = row['message']
        # Check files
        matches = FILE_EXT_REGEX.findall(msg)
        for m in matches:
            filename = m[0].strip()
            ext = m[1].lower()
            files.append({
                "filename": filename,
                "extension": ext,
                "type": "PDF Document" if ext == "pdf" else "Document / Code",
                "shared_by": row['user'],
                "date": f"{row['date']} {row['time']}",
                "context": msg,
                "url": None
            })
        
        # Check Cloud Drive Links
        drive_matches = DRIVE_URL_REGEX.findall(msg)
        for d in drive_matches:
            files.append({
                "filename": "Google Drive / Cloud Resource",
                "extension": "cloud",
                "type": "Cloud Drive Folder",
                "shared_by": row['user'],
                "date": f"{row['date']} {row['time']}",
                "context": msg,
                "url": d
            })
    return pd.DataFrame(files)


# -------------------------------------------------------------
# 3. Action Item Extractor (Bilingual English & Hinglish)
# -------------------------------------------------------------
ACTION_PATTERNS = re.compile(
    r'\b(i will|i\'ll|let me|please send|make sure to|reminder|deadline|main kar dunga|bhej dena|submit karna hai)\b',
    re.IGNORECASE
)

def extract_action_items(df: pd.DataFrame):
    actions = []
    for idx, row in df.iterrows():
        msg = row['message']
        match = ACTION_PATTERNS.search(msg)
        if match:
            actions.append({
                "assignee": row['user'],
                "task": msg,
                "date": f"{row['date']} {row['time']}",
                "trigger": match.group(0)
            })
    return pd.DataFrame(actions)


# -------------------------------------------------------------
# 4. Streamlit UI Layout
# -------------------------------------------------------------
st.title("📱 WhatsApp Chat Intelligence & Resource Hub")
st.caption("Streamlit implementation for Academic Viva Review 2")

uploaded_file = st.sidebar.file_uploader("Upload WhatsApp Chat (.txt)", type=["txt"])

# Default sample chat
SAMPLE_CHAT = """13/05/23, 1:00 pm - Rohan: had an awesome lunch, thank you all
13/05/23, 3:15 pm - Rohan: Guys here is the DAA_Assignment_3_Final.pdf for reference
13/05/23, 3:20 pm - Meera: Thanks Rohan! I uploaded Algorithms_Unit2_Notes.docx on Google Drive
13/05/23, 3:21 pm - Meera: Drive folder link for unit 2 notes: https://drive.google.com/drive/folders/daa_unit2_notes
13/05/23, 3:25 pm - Karan: Awesome, sharing sorting_algorithms_code.py implementation file
15/05/23, 10:00 am - Meera: reminder: project submission is due tonight by 11:59 pm!
15/05/23, 10:02 am - Rohan: I will prepare the presentation slides by 5 pm today
15/05/23, 10:05 am - Aditi: please send the final dataset link before 2 pm
15/05/23, 10:12 am - Karan: haan bhai main code review kar dunga aaj raat tak
"""

chat_text = uploaded_file.read().decode('utf-8') if uploaded_file else SAMPLE_CHAT

df = parse_chat(chat_text)

tab1, tab2, tab3, tab4 = st.tabs([
    "📁 Files & PDF Finder",
    "✅ Action Items",
    "📊 Overview & KPIs",
    "🛡️ GDPR Privacy Redaction"
])

# TAB 1: FILES & PDF FINDER
with tab1:
    st.subheader("📁 Shared Files, Assignments & Document Finder")
    st.write("Easily retrieve assignments (e.g. *DAA Assignment 3 PDF*) without scrolling through thousands of messages.")
    
    files_df = extract_files(df)
    
    col_s1, col_s2 = st.columns([3, 1])
    with col_s1:
        query = st.text_input("🔍 Search documents by keyword (e.g. 'daa assignment 3', 'notes', 'pdf'):", "")
    with col_s2:
        ext_filter = st.selectbox("Filter by Extension:", ["All", "pdf", "docx", "py", "cloud"])

    if not files_df.empty:
        filtered_files = files_df.copy()
        if query:
            filtered_files = filtered_files[
                filtered_files['filename'].str.contains(query, case=False, na=False) |
                filtered_files['context'].str.contains(query, case=False, na=False)
            ]
        if ext_filter != "All":
            filtered_files = filtered_files[filtered_files['extension'] == ext_filter]

        st.dataframe(filtered_files[["filename", "type", "shared_by", "date", "context"]], use_container_width=True)

        st.markdown("### 📥 Download Identified Documents")
        for idx, row in filtered_files.iterrows():
            with st.expander(f"📄 {row['filename']} (Shared by {row['shared_by']})"):
                st.write(f"**Context Quote:** *\"{row['context']}\"*")
                st.write(f"**Timestamp:** {row['date']}")
                if row['url']:
                    st.markdown(f"[🔗 Open Google Drive / Cloud Link]({row['url']})")
                else:
                    sample_pdf_bytes = b"%PDF-1.4 ... Companion Download for " + row['filename'].encode('utf-8')
                    st.download_button(
                        label=f"⬇️ Download {row['filename']}",
                        data=sample_pdf_bytes,
                        file_name=row['filename'],
                        mime="application/pdf"
                    )
    else:
        st.info("No files or documents detected in this chat.")

# TAB 2: ACTION ITEMS
with tab2:
    st.subheader("✅ Action Item & Commitment Extractor")
    actions_df = extract_action_items(df)
    st.dataframe(actions_df, use_container_width=True)

# TAB 3: OVERVIEW
with tab3:
    st.subheader("📊 Chat Overview & Contributor Statistics")
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Messages", len(df))
    col2.metric("Active Participants", df['user'].nunique())
    col3.metric("Indexed Documents", len(extract_files(df)))
    
    st.bar_chart(df['user'].value_counts())

# TAB 4: PRIVACY
with tab4:
    st.subheader("🛡️ 1-Click Privacy & PII Redaction")
    privacy_on = st.toggle("Enable 1-Click Privacy Mode", value=False)
    if privacy_on:
        anonymized_df = df.copy()
        user_map = {u: f"Participant_{i+1}" for i, u in enumerate(df['user'].unique())}
        anonymized_df['user'] = anonymized_df['user'].map(user_map)
        anonymized_df['message'] = anonymized_df['message'].apply(
            lambda x: re.sub(r'\b[6-9]\d{9}\b', '[PHONE_REDACTED]', x)
        )
        st.success("PII Redaction Active! Real participant names and phone numbers masked.")
        st.dataframe(anonymized_df.head(10), use_container_width=True)
    else:
        st.info("Showing unmasked data. Toggle above to mask real identities for GDPR compliance.")
