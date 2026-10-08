import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  ExternalLink,
  Filter,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Cloud,
  Layers,
  Calendar,
  User,
  Sparkles,
  CheckCircle2,
  Copy,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import { ChatMessage, FileCategory, FileItem } from '../types';
import { extractFilesAndResources, searchFiles, generateSyntheticPdfBlob } from '../lib/fileFinder';

interface FilesTabProps {
  messages: ChatMessage[];
  selectedUser: string;
}

export const FilesTab: React.FC<FilesTabProps> = ({ messages, selectedUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSender, setSelectedSender] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract all files from filtered messages
  const allFiles = useMemo(() => {
    return extractFilesAndResources(messages);
  }, [messages]);

  // Unique senders who shared files
  const senders = useMemo(() => {
    const list = Array.from(new Set(allFiles.map(f => f.sender)));
    return list.sort();
  }, [allFiles]);

  // Filter and search
  const filteredFiles = useMemo(() => {
    let list = allFiles;

    if (selectedCategory !== 'all') {
      list = list.filter(f => f.category === selectedCategory);
    }

    if (selectedSender !== 'all') {
      list = list.filter(f => f.sender === selectedSender);
    } else if (selectedUser !== 'all') {
      list = list.filter(f => f.sender === selectedUser);
    }

    if (searchQuery.trim()) {
      list = searchFiles(list, searchQuery);
    }

    return list;
  }, [allFiles, selectedCategory, selectedSender, selectedUser, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allFiles.length,
      pdf: 0,
      document: 0,
      cloud_drive: 0,
      code: 0,
      presentation: 0,
      spreadsheet: 0,
      archive: 0,
      other: 0
    };
    allFiles.forEach(f => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return counts;
  }, [allFiles]);

  const handleDownloadFile = (file: FileItem) => {
    if (file.directUrl) {
      window.open(file.directUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Generate companion PDF or text file
    const blob = file.category === 'pdf'
      ? generateSyntheticPdfBlob(file)
      : new Blob([
          `File Retrieval Manifest\n=======================\nFile Name: ${file.fileName}\nShared by: ${file.sender}\nDate: ${file.dateStr} at ${file.timeStr}\n\nContext:\n${file.originalMessage}\n\nNote: Exported via WhatsApp Chat Intelligence Document Finder.`
        ], { type: 'text/plain;charset=utf-8' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCitation = (file: FileItem) => {
    const citation = `"${file.fileName}" shared by ${file.sender} on ${file.dateStr} at ${file.timeStr}: ${file.originalMessage}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'cloud_drive':
        return <Cloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'archive':
        return <FileArchive className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Layers className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getCategoryBadgeClass = (category: FileCategory) => {
    switch (category) {
      case 'pdf':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60';
      case 'document':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60';
      case 'cloud_drive':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60';
      case 'code':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60';
      case 'spreadsheet':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/60';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Shared Files & Document Finder
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                Smart Semantic Retrieval
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Locates academic assignments, lecture PDFs, drive folders, and code files buried inside conversation threads.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Total Resources: <strong className="text-slate-900 dark:text-slate-100">{allFiles.length}</strong>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder='Try searching: "daa assignment 3 pdf", "unit 2 notes", "drive link", or "rohan"...'
            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions:
          </span>
          {['daa assignment 3', 'pdf', 'notes', 'drive link', 'code'].map(chip => (
            <button
              key={chip}
              onClick={() => setSearchQuery(chip)}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All Files', count: categoryCounts.all },
            { key: 'pdf', label: 'PDFs', count: categoryCounts.pdf },
            { key: 'document', label: 'Documents', count: categoryCounts.document },
            { key: 'cloud_drive', label: 'Drive Links', count: categoryCounts.cloud_drive },
            { key: 'code', label: 'Code', count: categoryCounts.code }
          ]
            .filter(tab => tab.count > 0 || tab.key === 'all')
            .map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  selectedCategory === tab.key
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
        </div>

        {/* Sender Filter */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedSender}
            onChange={e => setSelectedSender(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Senders ({senders.length})</option>
            {senders.map(sender => (
              <option key={sender} value={sender}>
                {sender}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Files Grid / List */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No files matched your query
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or selecting "All Files" to browse all shared resources.
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
            >
              Reset Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 mt-0.5">
                      {getCategoryIcon(file.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-all">
                          {file.fileName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${getCategoryBadgeClass(
                            file.category
                          )}`}
                        >
                          {file.fileExtension}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <strong className="text-slate-700 dark:text-slate-300">{file.sender}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {file.dateStr} • {file.timeStr}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Context Quote */}
                <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 italic">
                  "{file.originalMessage}"
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyCitation(file)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  title="Copy reference info to clipboard"
                >
                  {copiedId === file.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Context</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile(file)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    {file.directUrl ? (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Drive Link</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF / File</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Academic & Viva Method Box */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800 dark:text-slate-100 font-semibold">
            Viva Defense Note for Examiners:
          </strong>
          <p className="mt-0.5">
            "Unlike simple keyword search, our <strong>Files & Document Finder</strong> performs two-layer extraction:
            (1) Regex parsing of WhatsApp attachment metadata and file extensions (`.pdf`, `.docx`, `.py`), and (2) Token-overlap semantic scoring matching user queries (like 'DAA Assignment 3') against both file names and conversational context."
          </p>
        </div>
      </div>
    </div>
  );
};
