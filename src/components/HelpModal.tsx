import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  BookOpen,
  HelpCircle,
  BarChart3,
  Users,
  Clock,
  Sparkles,
  Smile,
  MessageCircle,
  FileText,
  Search as SearchIcon,
  Shield,
  Smartphone,
  GraduationCap,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  FileDown,
  FolderDown
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Category = 'all' | 'analytics' | 'behavior' | 'nlp' | 'export' | 'viva';

interface FeatureGuide {
  id: string;
  title: string;
  icon: React.FC<{ className?: string }>;
  category: Category;
  summary: string;
  howItWorks: string;
  vivaTip: string;
  details: string[];
}

const FEATURE_GUIDES: FeatureGuide[] = [
  {
    id: 'overview',
    title: 'Overview & Top Statistics',
    icon: BarChart3,
    category: 'analytics',
    summary: 'High-level dashboard summarizing conversation volume, media sharing, and top contributors.',
    howItWorks: 'The parser iterates through every message line, aggregating total message counts, tokenizing words by whitespace, and detecting placeholder strings like "<Media omitted>" or URLs.',
    vivaTip: 'Point out that all statistics are computed on-the-fly and dynamically adjust when filters (date range slider, specific user dropdown) change in the sidebar.',
    details: [
      'Total Messages: Count of all valid messages excluding system join/leave notices.',
      'Total Words: Sum of words across all textual messages.',
      'Media Count: Detects WhatsApp media notifications (images, videos, audio, documents).',
      'Links Count: Detected using regular expressions matching http://, https://, and www domains.',
      'Active User Ranking: Identifies the most frequent chatter in the group or direct chat.'
    ]
  },
  {
    id: 'users',
    title: 'User Analytics & Contribution',
    icon: Users,
    category: 'analytics',
    summary: 'Detailed individual participant statistics showing conversation dominance, verbosity, and peak hours.',
    howItWorks: 'Groups messages by sender, computing count, word total, average words per message (length), percentage share of the conversation, and their single most active hour of the day.',
    vivaTip: 'Explain that comparing average message length vs message count distinguishes "rapid short-texters" (who send 5 messages of 2 words) from "long-form texters" (who send paragraphs).',
    details: [
      'Conversation Share %: Shows who dominates the group discussion.',
      'Average Message Length: Total words divided by total messages for each participant.',
      'Peak Activity Hour: The specific 1-hour interval where each user sends the most messages.',
      'Top Rank Tables: Instant sorting by highest volume, longest messages, and word totals.'
    ]
  },
  {
    id: 'activity',
    title: 'Activity Timeline & Heatmap',
    icon: Clock,
    category: 'analytics',
    summary: 'Temporal distribution showing when conversation peaks across days, months, and hours of the week.',
    howItWorks: 'Extracts temporal features (year, month, day of week, hour of day) using Pandas/Date objects. Maps weekly activity to a 7x24 grid.',
    vivaTip: 'Mention that the 24x7 activity heatmap allows identifying college study hours, late-night cram sessions, or peak weekend chatting times.',
    details: [
      'Daily Timeline: Line graph tracking message spikes over calendar dates.',
      'Busiest Day of Week: Bar graph identifying the most active day (Monday - Sunday).',
      'Monthly Volume: Identifies long-term trends and semester activity peaks.',
      'Weekly 24-Hour Heatmap: Visual matrix highlighting the busiest hour of each day of the week.'
    ]
  },
  {
    id: 'latency',
    title: 'Response Latency & Behavioral Metrics',
    icon: Clock,
    category: 'behavior',
    summary: 'Measures conversational dynamics: reply speeds, night owl index, who starts conversations, and chatting streaks.',
    howItWorks: 'Iterates through sorted messages. When sender A is followed by sender B within a threshold window (e.g., 180 min), the timestamp delta is calculated as response latency. Messages after a 60+ min gap count as conversation initiations.',
    vivaTip: 'Examiners love latency! Emphasize the threshold limit (default 180 min) — without this cap, replying to a message 3 weeks later would falsely skew average response time to hundreds of hours.',
    details: [
      'Median & Mean Response Time: Indicates how quickly each participant replies when prompted.',
      'Conversation Starters: Number of times a user sent a message that revived a conversation after at least 60 minutes of total silence.',
      'Night Owl Score: Percentage of a user’s messages sent during late-night hours (11:00 PM to 5:00 AM).',
      'Chatting Streaks: Tracks maximum and current consecutive active days of conversation.'
    ]
  },
  {
    id: 'nlp',
    title: 'Hinglish NLP Preprocessing',
    icon: Sparkles,
    category: 'nlp',
    summary: 'Specialized natural language preprocessing engine tailored for code-mixed English + Romanized Hindi chat text.',
    howItWorks: 'Applies regular expressions to strip mentions (@91...) and URLs, compresses elongated letters ("sooooo" -> "so"), expands a 20+ item chat slang dictionary ("kr" -> "kar", "plz" -> "please"), and strips bilingual stopwords.',
    vivaTip: 'Explain why standard NLTK or SpaCy fails: they do not recognize Hinglish slang or Romanized Hindi fillers ("hai", "toh", "bhi", "accha"). Our custom pipeline bridges this exact gap.',
    details: [
      'Slang Normalization: Maps common Indian texting shorthand to standard forms for accurate frequency counts.',
      'Character De-elongation: Reduces emotional exaggerated keystrokes ("happpyyyy" -> "happy").',
      'Bilingual Stopword Removal: Filters out both English grammar words and Romanized Hindi conjunctions/auxiliaries.',
      'Tokenization: Splits clean text into meaningful semantic tokens for word clouds and n-gram analysis.'
    ]
  },
  {
    id: 'sentiment',
    title: 'Sentiment Analysis (Phase 3 Roadmap)',
    icon: Smile,
    category: 'nlp',
    summary: 'Review 2 status milestone explaining Hinglish sentiment classification challenges and the upcoming Phase 3 machine learning pipeline.',
    howItWorks: 'In Phase 1 & 2, the data foundation and text cleaning pipeline are established. Phase 3 will introduce TF-IDF vectorization and multi-model benchmarking (Logistic Regression, Naive Bayes, Random Forest).',
    vivaTip: 'Clearly state: "Sentiment analysis on Hinglish requires custom lexicons and n-gram models because standard English models fail on sarcasm and Romanized Hindi. That is why hyperparameter tuning is scheduled for Phase 3."',
    details: [
      'Review 2 Milestone: Clearly states that model training and tuning are in progress for Phase 3.',
      'Hinglish Challenges: Code-mixing, phonetic Roman script variations, sarcasm, and lack of standard spelling.',
      'Phase 3 Deliverables: TF-IDF feature extraction, train/test cross-validation, and per-user mood trajectory charts.'
    ]
  },
  {
    id: 'emoji',
    title: 'Emoji Frequency & Preferences',
    icon: MessageCircle,
    category: 'analytics',
    summary: 'Extracts and ranks Unicode emoticons used across the chat, including user-specific favorites.',
    howItWorks: 'Scans message strings using Unicode regex patterns matching emoji codepoints, tallying frequency per user and overall.',
    vivaTip: 'Emojis carry vital emotional context in text messaging when words alone are ambiguous.',
    details: [
      'Top Emojis: Ranked list and distribution of the most frequently shared emoticons.',
      'User Preferences: Shows which emoji each participant uses most often.',
      'Visual Bar Charts: Clean graphical breakdown of expressive communication styles.'
    ]
  },
  {
    id: 'words',
    title: 'Words & Frequent Vocabulary',
    icon: FileText,
    category: 'nlp',
    summary: 'Discovers the most common conversational themes, words, and 2-word phrases (bigrams) after filtering noise.',
    howItWorks: 'Passes messages through the Hinglish text cleaner, computes token frequencies, and extracts consecutive word pairs (bigrams).',
    vivaTip: 'Highlight that without stopword cleaning, the top words would just be "the", "hai", "and", which provide zero contextual insight.',
    details: [
      'Cleaned Vocabulary: Top words after removing stopwords and slang normalization.',
      'Common Bigrams: Frequent 2-word combinations revealing repeated conversational topics.',
      'Interactive Filter: Filter words by individual participants.'
    ]
  },
  {
    id: 'search',
    title: 'Chat Search & Export',
    icon: SearchIcon,
    category: 'analytics',
    summary: 'Instant full-text keyword search across thousands of messages with user filtering and CSV download.',
    howItWorks: 'Performs fast client-side sub-string queries across parsed messages, with pagination and real-time highlighting.',
    vivaTip: 'Demonstrates data utility: users can verify parsed message contents and export cleaned subsets for external reporting.',
    details: [
      'Instant Search: Case-insensitive search across full message history.',
      'Sender Filters: Restrict search results to specific participants.',
      'CSV Download: Export filtered search results or full chat datasets.'
    ]
  },
  {
    id: 'export-guide',
    title: 'How to Export WhatsApp Chats',
    icon: Smartphone,
    category: 'export',
    summary: 'Step-by-step instructions for exporting chats from Android and iOS devices.',
    howItWorks: 'WhatsApp allows exporting any 1-on-1 or group chat into a lightweight plain .txt file without attachments.',
    vivaTip: 'Remind evaluators that exports MUST be done "Without Media" so WhatsApp produces a clean .txt transcript.',
    details: [
      'Android: Open Chat -> 3 dots (Menu) -> More -> Export Chat -> Select "Without Media" -> Save or send .txt file.',
      'iPhone (iOS): Open Chat -> Tap Contact/Group Name at top -> Scroll down to "Export Chat" -> Select "Without Media" -> Save to Files.',
      'Privacy Assurance: The .txt file stays on your computer. Nothing is uploaded to any server.'
    ]
  },
  {
    id: 'action-items',
    title: 'Action Item & Commitment Extractor',
    icon: CheckSquare,
    category: 'nlp',
    summary: 'Identifies deliverables, promises, assignments, and deadlines from unstructured conversational text in English & Hinglish.',
    howItWorks: 'Scans messages using bilingual heuristic regex patterns (self-commitments like "I will...", "main kar dunga", delegations like "please share...", "bhej dena", and deadline tags like "tonight", "by 5 PM", "kal"). Classifies each task into Deliverable, Meeting, Review, Resource, or Task.',
    vivaTip: 'Explain to examiners: "Most chat analyzers only count word frequencies. Our Action Item Extractor turns casual messages into an actionable to-do list with detected deadlines, demonstrating practical NLP utility for teams and project groups."',
    details: [
      'Bilingual Pattern Matching: Recognizes commitments in both English and colloquial Hinglish.',
      'Temporal / Deadline Parsing: Automatically extracts date and time references (today, tonight, tomorrow, by EOD).',
      'Urgency & Category Tagging: Flags tasks as High/Medium/Low urgency and tags Deliverables vs Meetings.',
      'Interactive Completion & Export: Users can check off tasks, copy open items, or export them to CSV.'
    ]
  },
  {
    id: 'privacy-mode',
    title: '1-Click Privacy & Anonymization Mode',
    icon: Shield,
    category: 'export',
    summary: 'Instantly masks all participant names with research aliases and redacts sensitive PII (phone numbers, emails, UPI handles).',
    howItWorks: 'Operates 100% in local browser memory. When enabled, a deterministic mapping replaces real names with "Participant 1 (P1)", "Participant 2 (P2)", and applies regex redaction to phone numbers, emails, and UPI IDs before any metrics or PDF reports are generated.',
    vivaTip: 'Tell professors: "Academic and enterprise research requires strict GDPR and ethical compliance. Our 1-Click Privacy Mode ensures no personal identifying information (PII) is exposed during demonstrations or project evaluations."',
    details: [
      'Deterministic Alias Mapping: Transforms real sender names into consistent research identifiers.',
      'PII Redaction Engine: Masks 10-digit/international phone numbers, emails, and financial UPI handles.',
      'In-Memory Sandbox: Guarantees zero byte leakage to third-party servers or external APIs.',
      'Sanitized PDF Export: Generates clean, anonymized reports ready for academic publication or submission.'
    ]
  },
  {
    id: 'pdf-report',
    title: 'Exportable Executive PDF Summary',
    icon: FileDown,
    category: 'export',
    summary: 'Compiles a complete, multi-page Academic & Project Review Summary document ready to print or hand to examiners.',
    howItWorks: 'Uses client-side jsPDF and autoTable engines to generate vector tables of KPIs, participant workload distributions, extracted action plans, discussion vocabulary, and methodology verification notes.',
    vivaTip: 'Hand the exported PDF to the examiner as a tangible project deliverable during your viva presentation to show end-to-end polish.',
    details: [
      'Executive KPI Grid: Total messages, word count, media count, and participant count.',
      'Workload Distribution Table: Breakdown of messages, words, percentage share, and peak activity.',
      'Action Items & Deliverables: Formal matrix of extracted tasks and deadlines.',
      'Examiner Methodology Appendix: Formal defense notes on multi-format parsing, Hinglish tokenization, and privacy compliance.'
    ]
  },
  {
    id: 'files-finder',
    title: 'Shared Files, Documents & PDF Finder',
    icon: FolderDown,
    category: 'nlp',
    summary: 'Indexes and retrieves academic assignments (like "DAA Assignment 3 PDF"), lecture notes, cloud drive links, and code files shared in chats.',
    howItWorks: 'Uses dual-layer extraction: (1) Regex pattern detection for WhatsApp attachment tags (`.pdf (file attached)`) and file extensions (`.pdf`, `.docx`, `.py`, `.ipynb`), plus Google Drive / GitHub URLs. (2) Semantic token-overlap search matching user queries against both filenames and surrounding conversational message context.',
    vivaTip: 'Demonstrate to the examiner: "Students constantly lose files in group chats. By typing \'daa assignment 3 pdf\', our engine instantly indexes the exact document, shows who shared it and when, and provides a direct download link."',
    details: [
      'Multi-Format Detection: Automatically captures PDFs, Word docs, code files (.py, .ipynb), and Cloud Drive URLs.',
      'Conversational Context Linking: Pairs every file with the exact original sentence spoken by the sender.',
      '1-Click Companion Download: Generates an instant downloadable copy or opens direct cloud storage links.',
      'Search Token Scoring: Prioritizes exact extension matches, subject acronyms, and sender names.'
    ]
  }
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string>('overview');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredGuides = FEATURE_GUIDES.filter(guide => {
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.vivaTip.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="help-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors"
      >
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Help & Feature Guide
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  Review 2 Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed explanations of all dashboard metrics, algorithms, and viva defense answers
              </p>
            </div>
          </div>
          <button
            id="close-help-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close guide modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features (e.g., latency, slang, heatmap, export)..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'behavior', label: 'Behavioral' },
              { id: 'nlp', label: 'Hinglish NLP' },
              { id: 'export', label: 'Export Guide' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as Category)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Content - Scrollable list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {/* Viva Presentation Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3 text-emerald-900 dark:text-emerald-200">
            <GraduationCap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Quick Viva Tip for Presentation
              </h4>
              <p className="text-xs leading-relaxed text-emerald-950 dark:text-emerald-100">
                When presenting each tab, first show the high-level chart, then explain the real-world utility, and mention the algorithm used (e.g., regex state machine, datetime deltas, slang normalization).
              </p>
            </div>
          </div>

          {filteredGuides.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              No features match your search term "{searchQuery}".
            </div>
          ) : (
            filteredGuides.map(guide => {
              const Icon = guide.icon;
              const isExpanded = expandedId === guide.id;

              return (
                <div
                  key={guide.id}
                  id={`guide-card-${guide.id}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs transition-colors"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? '' : guide.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {guide.title}
                          </h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                            {guide.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {guide.summary}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-4 text-xs">
                      {/* How It Works */}
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          How the Algorithm / Calculation Works:
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                          {guide.howItWorks}
                        </p>
                      </div>

                      {/* Feature Details */}
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">
                          Specific Metrics & Elements Included:
                        </h4>
                        <ul className="space-y-1.5 pl-5 list-disc text-slate-600 dark:text-slate-400">
                          {guide.details.map((detail, idx) => (
                            <li key={idx}>{detail}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Viva Defense Tip */}
                      <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800 dark:text-amber-300">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>What to Say to the Professor (Viva Defense):</span>
                        </div>
                        <p className="text-xs leading-relaxed text-amber-950 dark:text-amber-100">
                          "{guide.vivaTip}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>100% Client-Side Private Analysis</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Got it, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
