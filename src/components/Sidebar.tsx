import React, { useRef } from 'react';
import { Upload, FileText, Trash2, Sliders, Calendar, Users, Clock, History, Shield, ShieldCheck, FileDown } from 'lucide-react';
import { SavedAnalysisRecord } from '../types';

interface SidebarProps {
  onFileUpload: (text: string, filename: string) => void;
  onUseSample: () => void;
  allUsers: string[];
  selectedUsers: string[];
  setSelectedUsers: (users: string[]) => void;
  focusUser: string;
  setFocusUser: (user: string) => void;
  minDate: string;
  maxDate: string;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  maxResponseMinutes: number;
  setMaxResponseMinutes: (m: number) => void;
  sessionGapMinutes: number;
  setSessionGapMinutes: (m: number) => void;
  saveHistory: boolean;
  setSaveHistory: (s: boolean) => void;
  savedRecords: SavedAnalysisRecord[];
  onLoadSavedRecord: (record: SavedAnalysisRecord) => void;
  onClearHistory: () => void;
  currentFileName: string;
  isAnonymized: boolean;
  onToggleAnonymize: () => void;
  onGeneratePdf: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onFileUpload,
  onUseSample,
  allUsers,
  selectedUsers,
  setSelectedUsers,
  focusUser,
  setFocusUser,
  minDate,
  maxDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  maxResponseMinutes,
  setMaxResponseMinutes,
  sessionGapMinutes,
  setSessionGapMinutes,
  saveHistory,
  setSaveHistory,
  savedRecords,
  onLoadSavedRecord,
  onClearHistory,
  currentFileName,
  isAnonymized,
  onToggleAnonymize,
  onGeneratePdf
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onFileUpload(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleToggleUser = (user: string) => {
    if (selectedUsers.includes(user)) {
      if (selectedUsers.length > 1) {
        setSelectedUsers(selectedUsers.filter(u => u !== user));
      }
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSelectAllUsers = () => {
    setSelectedUsers([...allUsers]);
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 sm:p-5 gap-6 text-sm text-slate-700 dark:text-slate-300 transition-colors">
      {/* 1. Data Source Upload */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Chat Data Source</span>
          </div>
          {currentFileName && (
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-mono truncate max-w-[120px] border border-emerald-100 dark:border-emerald-800">
              {currentFileName}
            </span>
          )}
        </div>

        <input
          type="file"
          accept=".txt"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Chat (.txt)</span>
        </button>

        <button
          onClick={onUseSample}
          className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <span>Try Bundled Sample Chat</span>
        </button>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
          Export from WhatsApp: Chat → More → Export chat → Without Media.
        </p>
      </section>

      {/* 2. Filters */}
      {allUsers.length > 0 && (
        <section className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Filters</span>
          </div>

          {/* Date Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date Range</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Start</span>
                <input
                  type="date"
                  value={startDate}
                  min={minDate}
                  max={endDate || maxDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">End</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || minDate}
                  max={maxDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Focus User Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Focus On</span>
            </label>
            <select
              value={focusUser}
              onChange={(e) => setFocusUser(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="Overall">Overall (All Participants)</option>
              {selectedUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          {/* User Multiselect Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Include Users ({selectedUsers.length}/{allUsers.length})
              </span>
              <button
                onClick={handleSelectAllUsers}
                className="text-emerald-700 dark:text-emerald-400 hover:underline text-[11px] font-medium cursor-pointer"
              >
                Select All
              </button>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 dark:border-slate-800 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/40">
              {allUsers.map(user => (
                <label
                  key={user}
                  className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user)}
                    onChange={() => handleToggleUser(user)}
                    className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 dark:bg-slate-700"
                  />
                  <span className="truncate">{user}</span>
                </label>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Behavioral Thresholds */}
      <section className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Behavioral Cadence</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Max reply window:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{maxResponseMinutes} min</span>
          </div>
          <input
            type="range"
            min="10"
            max="360"
            step="10"
            value={maxResponseMinutes}
            onChange={(e) => setMaxResponseMinutes(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Replies after this duration count as new topics rather than fast turns.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Session silence gap:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{sessionGapMinutes} min</span>
          </div>
          <input
            type="range"
            min="15"
            max="240"
            step="15"
            value={sessionGapMinutes}
            onChange={(e) => setSessionGapMinutes(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Gaps longer than this mark the start of a distinct conversation session.
          </p>
        </div>
      </section>

      {/* 4. Research Ethics & Report Export */}
      <section className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-xs">
          <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Research Ethics & Export</span>
        </div>

        {/* 1-Click Privacy Toggle */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              1-Click Privacy Mode
            </span>
            <button
              type="button"
              onClick={onToggleAnonymize}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isAnonymized ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              role="switch"
              aria-checked={isAnonymized}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isAnonymized ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            {isAnonymized
              ? 'Active: Real names replaced by P1, P2... and phone/email/UPI are masked.'
              : 'Disabled: Real participant names and phone numbers are visible.'}
          </p>
        </div>

        {/* Generate PDF Report Button */}
        <button
          type="button"
          onClick={onGeneratePdf}
          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          <span>Export Summary PDF</span>
        </button>
      </section>

      {/* 5. Local History Persistence */}
      <section className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white text-xs">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Local Session History</span>
          </div>
          {savedRecords.length > 0 && (
            <button
              onClick={onClearHistory}
              title="Clear saved local history"
              className="text-slate-400 hover:text-red-600 text-xs p-1 rounded cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={saveHistory}
            onChange={(e) => setSaveHistory(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 dark:bg-slate-700"
          />
          <span>Auto-save uploads locally</span>
        </label>

        {savedRecords.length > 0 && (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {savedRecords.map(rec => (
              <button
                key={rec.id}
                onClick={() => onLoadSavedRecord(rec)}
                className="w-full text-left p-2 rounded-md bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 text-xs transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="font-medium truncate max-w-[140px] text-slate-800 dark:text-slate-200">{rec.name}</span>
                <span className="text-[10px] text-slate-400">{rec.messageCount} msgs</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
};
