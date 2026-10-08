import React, { useState } from 'react';
import {
  MessageSquare,
  Shield,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Lock,
  Sun,
  Moon,
  HelpCircle,
  FileDown
} from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenHelp: () => void;
  isAnonymized: boolean;
  onToggleAnonymize: () => void;
  onGeneratePdf: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenHelp,
  isAnonymized,
  onToggleAnonymize,
  onGeneratePdf
}) => {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                WhatsApp Chat Analytics Dashboard
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded-full">
                Review 2
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-format parsing, Hinglish NLP preprocessing, and behavioral analytics
            </p>
          </div>
        </div>

        {/* Action Controls: Anonymize Toggle, Export PDF, Help Guide, Theme Toggle */}
        <div className="flex items-center flex-wrap gap-2 self-start md:self-auto">
          {/* 1-Click Privacy / Anonymization Mode Toggle */}
          <button
            id="privacy-anonymize-btn"
            type="button"
            onClick={onToggleAnonymize}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs border ${
              isAnonymized
                ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
            title="Toggle 1-Click PII Masking and Participant Anonymization"
          >
            {isAnonymized ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>Privacy Mode: ON</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Privacy Mode: OFF</span>
              </>
            )}
          </button>

          {/* Export PDF Button */}
          <button
            id="export-pdf-header-btn"
            type="button"
            onClick={onGeneratePdf}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
            title="Download formatted multi-page Academic Summary PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Help & Feature Guide Button */}
          <button
            id="open-help-guide-btn"
            type="button"
            onClick={onOpenHelp}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800/80 cursor-pointer shadow-2xs"
            title="Open comprehensive feature documentation & viva guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Guide</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Privacy Dropdown Button */}
          <button
            id="privacy-toggle-btn"
            type="button"
            onClick={() => setShowPrivacy(!showPrivacy)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {showPrivacy ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {showPrivacy && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/60 border-t border-emerald-100 dark:border-emerald-900/60 px-4 sm:px-6 py-3.5 text-xs text-slate-700 dark:text-slate-300">
          <div className="max-w-7xl mx-auto flex items-start gap-3">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                100% In-Browser & Local Processing (GDPR & Research Ethics Compliant)
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                All chat parsing, NLP tokenization, slang expansion, and behavioral metrics execute strictly inside your local browser memory.
                With <strong>Privacy Mode</strong> toggled ON, real participant names are replaced by research aliases (<em>Participant 1, Participant 2</em>) and all phone numbers, email addresses, and UPI handles are automatically masked before analysis and PDF generation.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

