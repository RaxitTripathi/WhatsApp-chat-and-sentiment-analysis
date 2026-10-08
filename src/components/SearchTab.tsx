import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadAsCsv } from '../lib/exportCsv';

interface SearchTabProps {
  messages: ChatMessage[];
  allUsers: string[];
}

export const SearchTab: React.FC<SearchTabProps> = ({ messages, allUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [senderFilter, setSenderFilter] = useState('All');
  const [sentimentFilter, setSentimentFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredMessages = messages.filter(m => {
    // Exclude notifications unless explicitly searched
    if (m.user === 'group_notification' && senderFilter !== 'group_notification') {
      return false;
    }

    if (senderFilter !== 'All' && m.user !== senderFilter) {
      return false;
    }

    if (sentimentFilter !== 'All' && m.sentiment !== sentimentFilter) {
      return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return m.message.toLowerCase().includes(q) || m.user.toLowerCase().includes(q);
    }

    return true;
  });

  const totalPages = Math.ceil(filteredMessages.length / pageSize) || 1;
  const paginated = filteredMessages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDownload = () => {
    const data = filteredMessages.map(m => ({
      date: m.dateStr,
      time: m.timeStr,
      user: m.user,
      message: m.message,
      sentiment: m.sentiment,
      score: m.sentimentScore
    }));
    downloadAsCsv(data, 'chat_search_results.csv');
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/80 text-yellow-900 dark:text-yellow-100 rounded-xs px-0.5 font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search chat messages, words, or participant names..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={senderFilter}
              onChange={(e) => {
                setSenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="All">All Senders</option>
              {allUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            <select
              value={sentimentFilter}
              onChange={(e) => {
                setSentimentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="All">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>

            <button
              onClick={handleDownload}
              title="Download results as CSV"
              className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">CSV</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>Found <strong>{filteredMessages.length.toLocaleString()}</strong> matching messages</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-2">
        {paginated.length > 0 ? (
          paginated.map(m => (
            <div
              key={m.id}
              className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{m.user}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {m.dateStr} at {m.timeStr}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    m.sentiment === 'positive' ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300' :
                    m.sentiment === 'negative' ? 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {m.sentiment}
                  </span>
                  {m.messageType !== 'text' && (
                    <span className="bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                      {m.messageType}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words font-sans">
                {highlightMatch(m.message, searchTerm)}
              </p>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
            No messages matched your query or filters. Try adjusting your search term.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium px-3">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
};
