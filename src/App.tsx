import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewTab } from './components/OverviewTab';
import { ActionItemsTab } from './components/ActionItemsTab';
import { UserAnalyticsTab } from './components/UserAnalyticsTab';
import { ActivityTab } from './components/ActivityTab';
import { LatencyTab } from './components/LatencyTab';
import { SentimentTab } from './components/SentimentTab';
import { EmojiTab } from './components/EmojiTab';
import { WordsTab } from './components/WordsTab';
import { SearchTab } from './components/SearchTab';
import { FilesTab } from './components/FilesTab';
import { HelpModal } from './components/HelpModal';

import { parseWhatsAppChat } from './lib/parser';
import { SAMPLE_CHAT_TEXT } from './lib/sampleChat';
import { getOverviewStats, getUserStats, getTopWords } from './lib/analytics';
import { extractActionItems } from './lib/actionItems';
import { extractFilesAndResources } from './lib/fileFinder';
import { anonymizeChatData } from './lib/anonymizer';
import { generateExecutivePdfReport } from './lib/pdfReport';
import { SavedAnalysisRecord } from './types';
import {
  Home,
  CheckSquare,
  Users,
  Activity,
  Clock,
  Sparkles,
  Smile,
  MessageCircle,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileDown,
  FolderDown
} from 'lucide-react';

type TabId =
  | 'overview'
  | 'actions'
  | 'files'
  | 'users'
  | 'activity'
  | 'latency'
  | 'sentiment'
  | 'emoji'
  | 'words'
  | 'search';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [rawText, setRawText] = useState<string>(SAMPLE_CHAT_TEXT);
  const [currentFileName, setCurrentFileName] = useState<string>('sample_chat.txt');

  // Dark / Light Theme state with persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('whatsapp_analyzer_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // 1-Click Privacy / Anonymization Mode state
  const [isAnonymized, setIsAnonymized] = useState<boolean>(false);

  // Completed Action Items state
  const [completedActionIds, setCompletedActionIds] = useState<Set<string>>(new Set());

  // Help & Viva Guide Modal state
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Sync theme with root document class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('whatsapp_analyzer_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleAnonymize = () => {
    setIsAnonymized(prev => !prev);
  };

  // Behavioral parameters
  const [maxResponseMinutes, setMaxResponseMinutes] = useState<number>(180);
  const [sessionGapMinutes, setSessionGapMinutes] = useState<number>(60);

  // History state
  const [saveHistory, setSaveHistory] = useState<boolean>(false);
  const [savedRecords, setSavedRecords] = useState<SavedAnalysisRecord[]>(() => {
    try {
      const saved = localStorage.getItem('whatsapp_analysis_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 1. Base parsed messages from raw WhatsApp export
  const rawParsedMessages = useMemo(() => {
    return parseWhatsAppChat(rawText);
  }, [rawText]);

  // 2. Anonymized or raw stream depending on 1-Click Privacy Mode
  const { parsedMessages, anonymizationStats } = useMemo(() => {
    if (!isAnonymized) {
      return { parsedMessages: rawParsedMessages, anonymizationStats: null };
    }
    const result = anonymizeChatData(rawParsedMessages);
    return { parsedMessages: result.messages, anonymizationStats: result.stats };
  }, [rawParsedMessages, isAnonymized]);

  // Extract all unique users
  const allUsers = useMemo(() => {
    const users = new Set<string>();
    for (const m of parsedMessages) {
      if (m.user !== 'group_notification') {
        users.add(m.user);
      }
    }
    return Array.from(users).sort();
  }, [parsedMessages]);

  // Selected users filter
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [focusUser, setFocusUser] = useState<string>('Overall');

  // Dates
  const { minDate, maxDate } = useMemo(() => {
    if (parsedMessages.length === 0) return { minDate: '', maxDate: '' };
    const dates = parsedMessages.map(m => m.dateStr).sort();
    return {
      minDate: dates[0] || '',
      maxDate: dates[dates.length - 1] || ''
    };
  }, [parsedMessages]);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Whenever parsed messages or anonymization change, initialize users & date filters
  useEffect(() => {
    setSelectedUsers(allUsers);
    setFocusUser('Overall');
    if (minDate && maxDate) {
      setStartDate(minDate);
      setEndDate(maxDate);
    }
  }, [allUsers, minDate, maxDate]);

  // Filter messages based on date range and selected users
  const filteredMessages = useMemo(() => {
    return parsedMessages.filter(m => {
      // Date filter
      if (startDate && m.dateStr < startDate) return false;
      if (endDate && m.dateStr > endDate) return false;

      // User filter
      if (m.user === 'group_notification') return true;
      if (!selectedUsers.includes(m.user)) return false;
      if (focusUser !== 'Overall' && m.user !== focusUser) return false;

      return true;
    });
  }, [parsedMessages, startDate, endDate, selectedUsers, focusUser]);

  // Overview stats & user stats
  const overviewStats = useMemo(() => {
    return getOverviewStats(filteredMessages, focusUser);
  }, [filteredMessages, focusUser]);

  const userStats = useMemo(() => {
    return getUserStats(filteredMessages);
  }, [filteredMessages]);

  // Action Items extraction with completion tracking
  const rawActionItems = useMemo(() => {
    return extractActionItems(filteredMessages);
  }, [filteredMessages]);

  const [toggledActionIds, setToggledActionIds] = useState<Map<string, boolean>>(new Map());

  const actionItems = useMemo(() => {
    return rawActionItems.map(item => ({
      ...item,
      isCompleted: toggledActionIds.has(item.id)
        ? toggledActionIds.get(item.id)!
        : item.isCompleted
    }));
  }, [rawActionItems, toggledActionIds]);

  const handleToggleActionComplete = (id: string) => {
    const item = rawActionItems.find(i => i.id === id);
    const currentCompleted = toggledActionIds.has(id)
      ? toggledActionIds.get(id)!
      : item
      ? item.isCompleted
      : false;

    setToggledActionIds(prev => {
      const next = new Map(prev);
      next.set(id, !currentCompleted);
      return next;
    });
  };

  // Generate Multi-Page PDF Report
  const handleGeneratePdf = () => {
    const topWords = getTopWords(filteredMessages, 20);
    generateExecutivePdfReport({
      overviewStats,
      userStats,
      actionItems,
      topWords,
      isAnonymized,
      fileName: currentFileName
    });
  };

  // Handlers for file upload & sample loading
  const handleFileUpload = (text: string, filename: string) => {
    setRawText(text);
    setCurrentFileName(filename);

    if (saveHistory) {
      const newRecord: SavedAnalysisRecord = {
        id: String(Date.now()),
        name: filename,
        timestamp: new Date().toISOString(),
        messageCount: parseWhatsAppChat(text).length,
        participants: Array.from(new Set(parseWhatsAppChat(text).map(m => m.user))),
        rawText: text
      };
      const updated = [newRecord, ...savedRecords.slice(0, 4)];
      setSavedRecords(updated);
      try {
        localStorage.setItem('whatsapp_analysis_history', JSON.stringify(updated));
      } catch {
        // Storage limit protection
      }
    }
  };

  const handleUseSample = () => {
    setRawText(SAMPLE_CHAT_TEXT);
    setCurrentFileName('sample_chat.txt');
  };

  const handleLoadSavedRecord = (record: SavedAnalysisRecord) => {
    setRawText(record.rawText);
    setCurrentFileName(record.name);
  };

  const handleClearHistory = () => {
    setSavedRecords([]);
    try {
      localStorage.removeItem('whatsapp_analysis_history');
    } catch {
      // ignore
    }
  };

  // Extracted files count
  const allFilesCount = useMemo(() => {
    return extractFilesAndResources(filteredMessages).length;
  }, [filteredMessages]);

  // 11 feature tabs including Action Items & Files Finder
  const tabItems: Array<{ id: TabId; label: string; icon: React.FC<{ className?: string }>; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'actions', label: 'Action Items', icon: CheckSquare, count: actionItems.length },
    { id: 'files', label: 'Files & PDFs', icon: FolderDown, count: allFilesCount },
    { id: 'users', label: 'User Analytics', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'latency', label: 'Response Latency', icon: Clock },
    { id: 'sentiment', label: 'Sentiment', icon: Smile },
    { id: 'emoji', label: 'Emoji Analysis', icon: MessageCircle },
    { id: 'words', label: 'Words & Phrases', icon: FileText },
    { id: 'search', label: 'Chat Search', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenHelp={() => setIsHelpOpen(true)}
        isAnonymized={isAnonymized}
        onToggleAnonymize={toggleAnonymize}
        onGeneratePdf={handleGeneratePdf}
      />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          onFileUpload={handleFileUpload}
          onUseSample={handleUseSample}
          allUsers={allUsers}
          selectedUsers={selectedUsers}
          setSelectedUsers={setSelectedUsers}
          focusUser={focusUser}
          setFocusUser={setFocusUser}
          minDate={minDate}
          maxDate={maxDate}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          maxResponseMinutes={maxResponseMinutes}
          setMaxResponseMinutes={setMaxResponseMinutes}
          sessionGapMinutes={sessionGapMinutes}
          setSessionGapMinutes={setSessionGapMinutes}
          saveHistory={saveHistory}
          setSaveHistory={setSaveHistory}
          savedRecords={savedRecords}
          onLoadSavedRecord={handleLoadSavedRecord}
          onClearHistory={handleClearHistory}
          currentFileName={currentFileName}
          isAnonymized={isAnonymized}
          onToggleAnonymize={toggleAnonymize}
          onGeneratePdf={handleGeneratePdf}
        />

        {/* Main Dashboard Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-5 overflow-x-hidden">
          {/* Privacy Mode Active Notification Banner */}
          {isAnonymized && anonymizationStats && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 dark:text-emerald-200 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">1-Click Privacy & PII Redaction Active:</span>{' '}
                  <span>
                    {anonymizationStats.usersAnonymized} participants mapped to aliases (<em>P1, P2...</em>),{' '}
                    {anonymizationStats.phonesRedacted} phone(s), and {anonymizationStats.emailsRedacted} email(s) masked in-memory.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleAnonymize}
                className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 cursor-pointer"
              >
                Disable Privacy Mode
              </button>
            </div>
          )}

          {/* Status Header */}
          {parsedMessages.length > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Analyzing <strong>{filteredMessages.length.toLocaleString()}</strong> messages from{' '}
                  <strong>{selectedUsers.length}</strong> user(s)
                  {focusUser !== 'Overall' ? ` (focus: ${focusUser})` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGeneratePdf}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  title="Generate multi-page PDF Report"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF Summary</span>
                </button>
                <span className="text-xs text-slate-400 dark:text-slate-500">Source: {currentFileName}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No recognizable WhatsApp messages found</p>
                <p className="mt-0.5">Please ensure you upload an unedited WhatsApp exported .txt chat file.</p>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
            {tabItems.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div>
            {activeTab === 'overview' && (
              <OverviewTab
                stats={overviewStats}
                userStats={userStats}
                messages={filteredMessages}
                selectedUser={focusUser}
                onGeneratePdf={handleGeneratePdf}
              />
            )}

            {activeTab === 'actions' && (
              <ActionItemsTab
                actionItems={actionItems}
                onToggleComplete={handleToggleActionComplete}
                onGeneratePdf={handleGeneratePdf}
                allUsers={allUsers}
              />
            )}

            {activeTab === 'files' && (
              <FilesTab
                messages={filteredMessages}
                selectedUser={focusUser}
              />
            )}

            {activeTab === 'users' && (
              <UserAnalyticsTab userStats={userStats} />
            )}

            {activeTab === 'activity' && (
              <ActivityTab messages={filteredMessages} />
            )}

            {activeTab === 'latency' && (
              <LatencyTab
                messages={filteredMessages}
                maxResponseMinutes={maxResponseMinutes}
                sessionGapMinutes={sessionGapMinutes}
              />
            )}

            {activeTab === 'sentiment' && (
              <SentimentTab messages={filteredMessages} selectedUser={focusUser} />
            )}

            {activeTab === 'emoji' && (
              <EmojiTab messages={filteredMessages} />
            )}

            {activeTab === 'words' && (
              <WordsTab messages={filteredMessages} />
            )}

            {activeTab === 'search' && (
              <SearchTab messages={filteredMessages} allUsers={allUsers} />
            )}
          </div>
        </main>
      </div>

      {/* Interactive Help & Viva Guide Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};

export default App;
