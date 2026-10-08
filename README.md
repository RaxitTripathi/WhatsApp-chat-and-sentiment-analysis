# 📱 WhatsApp Chat Intelligence & Behavioral NLP System
### Academic Project Review 2 & Final Viva Technical Documentation

---

## 📌 Executive Summary
This project is an **in-browser, client-side NLP and Behavioral Analytics platform** designed to process exported WhatsApp chat archives (`.txt`). It performs:
1. **Multi-format deterministic parsing** (12/24h, Android, iOS, dates with hyphens/brackets).
2. **Bilingual Hinglish natural language processing** (slang dictionary normalization, code-mixed stopwords, sentiment scoring).
3. **Behavioral interaction analytics** (response latency, conversational initiators, peak temporal windows).
4. **Action item & commitment extraction** (intent detection and deadline slot-filling).
5. **1-Click GDPR/Research ethics compliance** (in-memory PII masking of names, numbers, emails, and UPI handles).
6. **Automated executive PDF summary generation** (vector document export for project defense and reviews).

---

## 🏛 High-Level Architecture & Data Flow

```
[ Exported WhatsApp .txt File ]
               │
               ▼
   ┌───────────────────────┐
   │    parser.ts          │ ──► Regex multi-format normalization (Timestamp, User, Body)
   └───────────────────────┘
               │
               ▼
   [ Raw ChatMessage[] ]
               │
      Is Privacy Mode Active?
        ├── YES ──► ┌────────────────────┐
        │           │   anonymizer.ts    │ ──► Mask real names to P1, P2...
        │           └────────────────────┘     Redact phones, emails, UPI
        │                     │
        └── NO ───────────────┼────────────────────────┐
                              ▼                        ▼
                  [ Active ChatMessage[] ]      [ UI State Filters ]
                              │                 (Date, Participant)
                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                Feature Analysis Engines                     │
    ├──────────────────────────┬──────────────────────────────────┤
    │ actionItems.ts           │ Bilingual intent & slot-filling  │
    │ analytics.ts             │ Activity, user rankings, words   │
    │ behavioral.ts            │ Response latency, initiators     │
    │ sentiment.ts             │ VADER/Lexicon sentiment scoring  │
    │ emojiAnalysis.ts         │ Unicode emoji extraction         │
    └──────────────────────────┴──────────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
   ┌───────────────────────┐     ┌───────────────────────┐
   │ Interactive React UI  │     │     pdfReport.ts      │
   │ (10 Feature Tabs)     │     │ (Client jsPDF Engine) │
   └───────────────────────┘     └───────────────────────┘
```

---

## 📂 File-by-File Technical Directory

### 1. Root & Configuration
| File | Responsibility |
|---|---|
| `package.json` | Project dependencies (`lucide-react`, `jspdf`, `jspdf-autotable`, `recharts`, `motion`, Tailwind CSS). |
| `vite.config.ts` | Vite configuration for ultra-fast compilation and HMR. |
| `metadata.json` | Platform metadata defining application title and server-side capabilities. |
| `index.html` | Entry HTML file mounting the React virtual DOM at `#root`. |

---

### 2. Core Application Logic (`/src`)

| File | Responsibility |
|---|---|
| `src/main.tsx` | Entrypoint for React 18 ReactDOM root rendering with strict mode. |
| `src/App.tsx` | Main application controller. Manages tab routing, uploaded chat state, privacy mode toggle, date/user filters, and coordinates all analysis engines. |
| `src/types.ts` | Comprehensive TypeScript interfaces (`ChatMessage`, `ActionItem`, `UserStats`, `OverviewStats`, `ResponseLatencyMetric`). |
| `src/index.css` | Global Tailwind CSS stylesheet styling clean typography and dark/light color schemes. |

---

### 3. Computation & NLP Engines (`/src/lib`)

#### 🔹 `src/lib/parser.ts` (Chat Ingestion Engine)
* **What it does:** Converts unstructured text lines from `.txt` WhatsApp exports into structured `ChatMessage[]` objects.
* **How it works:**
  1. Uses modular regular expressions supporting both:
     - Android standard: `15/05/23, 10:00 am - Meera: Message text`
     - iOS bracket format: `[15/05/23, 10:00:00] Meera: Message text`
  2. Handles multiline messages by appending non-timestamped lines to the previous message.
  3. Detects WhatsApp media omissions (`<Media omitted>`) and system notifications.

#### 🔹 `src/lib/actionItems.ts` (NLP Intent & Slot-Filling Engine)
* **What it does:** Automatically discovers tasks, promises, and deadlines from conversational text in both English and Hinglish.
* **How it works:**
  1. **Noise Filter:** Skips media placeholders, deletions, and system messages.
  2. **Intent Matching:** Matches modal verbs (`I will`, `let me`, `please send`, `kindly`) and Hinglish future-tense verbs (`main kar dunga`, `bhej dena`, `kar do`).
  3. **Deadline Slot-Filling:** Scans for temporal markers (`today`, `tonight`, `tomorrow`, `by 5 pm`, `kal subah`, `ASAP`).
  4. **Categorization:** Clusters into `Deliverable`, `Meeting`, `Review`, `Resource`, or `Task`.

#### 🔹 `src/lib/anonymizer.ts` (1-Click Privacy & PII Redaction)
* **What it does:** Anonymizes conversation data for research ethics compliance (GDPR principle).
* **How it works:**
  1. Creates a deterministic alias map for participants (`Participant 1 (P1)`, `Participant 2 (P2)`).
  2. Redacts phone numbers (`[PHONE_REDACTED]`), email addresses (`[EMAIL_REDACTED]`), and UPI IDs (`[UPI_REDACTED]`).
  3. Runs 100% in-browser without network requests.

#### 🔹 `src/lib/pdfReport.ts` (Executive PDF Generator)
* **What it does:** Compiles an academic/business executive summary into a multi-page PDF document.
* **How it works:**
  1. Uses `jspdf` and `jspdf-autotable`.
  2. Renders an Executive KPI banner, Contributor Workload matrix, Extracted Action Items table, Word frequency summary, and an **Academic Viva Defense Methodology Appendix**.

#### 🔹 `src/lib/behavioral.ts` (Response Latency & Dynamics)
* **What it does:** Computes conversational timing and participant behavior.
* **How it works:**
  1. Calculates elapsed response time between consecutive messages from different senders.
  2. Filters out conversational breaks using configurable session gap thresholds (default: 60 mins).
  3. Identifies conversation starters (who initiates chats after inactivity).

#### 🔹 `src/lib/sentiment.ts` (Sentiment Scoring)
* **What it does:** Evaluates message sentiment using a lexicon-based analyzer tailored with Hinglish emotional modifiers.
* **How it works:**
  1. Tokenizes text and checks word polarity (+1 for positive, -1 for negative).
  2. Accounts for intensifiers (`bohot`, `very`, `so`) and negation words (`not`, `nahi`, `never`).
  3. Outputs compound sentiment scores classified into Positive, Neutral, or Negative.

#### 🔹 `src/lib/emojiAnalysis.ts` (Emoji Analytics)
* **What it does:** Extracts Unicode emoji glyphs, computes frequency per participant, and calculates overall emoji diversity.

#### 🔹 `src/lib/preprocessing.ts` (Hinglish Slang & Stopword Pipeline)
* **What it does:** Expands Romanized Hindi slang (`bc`, `mc`, `sahi h`, `kya baat`) into standardized tokens and filters both English and Hinglish stopwords (`hai`, `tha`, `toh`, `bhi`, `aur`).

#### 🔹 `src/lib/analytics.ts` (General Aggregate Metrics)
* **What it does:** Computes overview KPIs (total messages, words, media counts, active days) and builds chronological timeline datasets for Recharts.

#### 🔹 `src/lib/exportCsv.ts` (CSV Exporter)
* **What it does:** Serializes tabular datasets (filtered messages or action items) into downloadable RFC 4180 CSV files.

#### 🔹 `src/lib/sampleChat.ts`
* **What it does:** Provides a realistic sample conversation covering college project coordination, deadlines, and Hinglish dialogue.

---

### 4. User Interface Tabs (`/src/components`)

| Component | Tab Name | Purpose |
|---|---|---|
| `Header.tsx` | Navigation Header | Houses the App logo, 1-Click Privacy toggle, Export PDF button, Viva Guide trigger, and Light/Dark theme toggle. |
| `Sidebar.tsx` | Left Sidebar | File uploader, participant dropdowns, date picker, behavioral threshold sliders, and local analysis history. |
| `OverviewTab.tsx` | Overview | High-level metrics, daily activity timeline charts, and chat download buttons. |
| `ActionItemsTab.tsx` | Action Items | Interactive to-do board with checkboxes, urgency badges, deadline indicators, search filter, and CSV/clipboard export. |
| `UserAnalyticsTab.tsx` | User Analytics | Contributor leaderboards, message share % breakdowns, and average message length comparisons. |
| `ActivityTab.tsx` | Activity | Temporal heatmaps: Day-of-week distribution and 24-hour peak activity curves. |
| `LatencyTab.tsx` | Response Latency | Visualizes median response times per user and conversation starter ratios. |
| `NlpTab.tsx` | Hinglish NLP | Explains the preprocessing pipeline, slang dictionary expansion, and stopword filtering. |
| `SentimentTab.tsx` | Sentiment | Sentiment distribution pie charts, polarity over time, and most positive/negative messages. |
| `EmojiTab.tsx` | Emoji Analysis | Most used emojis per participant and group emoji distribution. |
| `WordsTab.tsx` | Words & Phrases | Word frequency bar charts and top n-gram phrase combinations. |
| `SearchTab.tsx` | Chat Search | Instant text search across all messages with regex highlight and sender filter. |
| `HelpModal.tsx` | Feature & Viva Guide | Comprehensive interactive guide with pre-formulated viva defense answers for every feature. |

---

## 🔄 Detailed Feature Workflows & Flowcharts

### 1. Action Item Extraction Flowchart
```
[ User Uploads Chat / Selects Sample ]
                  │
                  ▼
         [ Message Received ]
                  │
         Is it Media or Deleted?
             ├── Yes ──► [ Discard from Task Search ]
             └── No
                  │
                  ▼
         [ Regex Intent Match ]
         (English modal verbs OR Hinglish future-tense verbs)
                  │
             Did it match?
             ├── No ───► [ Mark as Regular Message ]
             └── Yes
                  │
                  ▼
         [ Deadline Slot-Filling ]
         (Extract "today", "tonight", "by 5 pm", "kal subah")
                  │
                  ▼
         [ Semantic Category Classification ]
         (Deliverable, Meeting, Review, Resource, Task)
                  │
                  ▼
         [ Assign Confidence (75% - 98%) & Urgency ]
                  │
                  ▼
         [ Render on Action Items Interactive Tab ]
```

---

### 2. 1-Click Privacy / Anonymization Mode Flowchart
```
[ User Clicks "Privacy Mode: ON" ]
                  │
                  ▼
   [ Step 1: Collect Unique Senders ]
   ["Meera", "Karan", "Rohan", "Aditi"]
                  │
                  ▼
   [ Step 2: Build Deterministic Alias Map ]
   {"Meera": "Participant 1 (P1)", "Karan": "Participant 2 (P2)", ...}
                  │
                  ▼
   [ Step 3: Stream Regex Masking ]
   • Phone Regex: \b[6-9]\d{9}\b ──────► [PHONE_REDACTED]
   • Email Regex: \b\S+@\S+\.\S+\b ────► [EMAIL_REDACTED]
   • UPI Regex:   \b\S+@(oksbi|paytm) ─► [UPI_REDACTED]
   • Participant Name Mentions ────────► Respective Aliases
                  │
                  ▼
   [ Re-calculate In-Memory Word & Metric Buffers ]
                  │
                  ▼
   [ All Tabs, Search Results & PDF Reports Display Anonymized Data ]
```

---

### 3. Executive PDF Generation Flowchart
```
[ User Clicks "Export PDF" ]
                  │
                  ▼
   [ In-Memory jsPDF Canvas Initialization (A4) ]
                  │
                  ▼
   [ Render Color Banner & Document Header ]
                  │
                  ▼
   [ Draw Metadata Grid: Date Range, Senders, Privacy State ]
                  │
                  ▼
   [ AutoTable 1: Participant Workload Distribution ]
   (Messages, Words, Media, % Share, Peak Hours)
                  │
                  ▼
   [ AutoTable 2: Extracted Action Items & Deliverables ]
   (Speaker, Task Description, Deadline, Urgency, Status)
                  │
                  ▼
   [ Draw Methodology Appendix for Examiners ]
   (Bilingual Parsing, Regex Tokenization, GDPR Privacy Verification)
                  │
                  ▼
   [ Auto Number Pages: "Page X of Y" ]
                  │
                  ▼
   [ Trigger Native Browser Download: "WhatsApp_Chat_Intelligence_Report.pdf" ]
```

---

## 🎯 Viva & Defense Talking Points (Quick Cheat-Sheet)

1. **Why In-Browser Execution?**
   * *Answer:* Privacy compliance (GDPR/HIPAA considerations). User personal chat conversations never leave their local device or traverse third-party servers.
2. **Why Rule-Based NLP for Action Items?**
   * *Answer:* Extremely low latency (<10ms for 5,000 messages), zero cloud API cost, and high precision on domain-specific modal verbs and Hinglish syntax without hallucination.
3. **How is Hinglish Handled?**
   * *Answer:* Slang dictionary expansion (`/src/lib/preprocessing.ts`), colloquial stopwords removal, and Hinglish verb stem extraction (`kar dunga`, `bhej dena`).
