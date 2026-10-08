import React, { useState } from 'react';
import {
  DEFAULT_SLANG_DICT,
  DEFAULT_HINGLISH_STOPWORDS,
  normalizeText,
  tokenizeText,
  cleanText
} from '../lib/preprocessing';
import { Sparkles, ArrowRight, BookOpen, Layers, Terminal } from 'lucide-react';

export const NlpTab: React.FC = () => {
  const [testInput, setTestInput] = useState<string>("bhai kya scene hai?? check https://example.com @9188888");
  const [slangSearch, setSlangSearch] = useState<string>("");

  const samplePhrases = [
    "bhai kya scene hai?? check https://example.com @9188888",
    "all good yaar, feeling super relieved 😅",
    "ngl this is mast bro, party time?",
    "thx for sharing, bahut useful info thi"
  ];

  const normalized = normalizeText(testInput);
  const cleaned = cleanText(testInput);
  const tokens = tokenizeText(testInput);

  const filteredSlang = Object.entries(DEFAULT_SLANG_DICT).filter(([k, v]) =>
    k.toLowerCase().includes(slangSearch.toLowerCase()) ||
    v.toLowerCase().includes(slangSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Information Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Hinglish-Aware NLP Preprocessing Pipeline</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Handles code-mixed English and Hindi (in Latin/Roman script), common Indian WhatsApp slang,
          abbreviations, elongated letters, URLs, and stopwords to prepare tokens for classification.
        </p>
      </div>

      {/* Interactive Pipeline Sandbox */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3>Live Pipeline Inspector</h3>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Try testing code-mixed Hinglish sentences</span>
        </div>

        {/* Input box */}
        <div className="space-y-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Type any WhatsApp message with slang, emojis, or Hinglish..."
            className="w-full text-sm p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-emerald-500 font-medium"
          />

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">Quick samples:</span>
            {samplePhrases.map((phrase, i) => (
              <button
                key={i}
                onClick={() => setTestInput(phrase)}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
              >
                Sample {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Stages Visualizer */}
        <div className="space-y-3 pt-2">
          {/* Stage 1: Raw */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold mb-1">
              <span>Stage 1: Raw Input</span>
              <span>Length: {testInput.length} chars</span>
            </div>
            <p className="font-mono text-slate-800 dark:text-slate-200">{testInput || <span className="text-slate-400 italic">empty</span>}</p>
          </div>

          <div className="flex justify-center text-slate-400 dark:text-slate-600">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          {/* Stage 2: Normalized & Slang Expanded */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/30 text-xs">
            <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 text-[10px] uppercase font-bold mb-1">
              <span>Stage 2: Cleaned, De-noised & Slang Expanded</span>
              <span>URLs & Mentions removed, Contractions collapsed</span>
            </div>
            <p className="font-mono text-blue-950 dark:text-blue-100 font-medium">{normalized || <span className="text-slate-400 italic">empty</span>}</p>
          </div>

          <div className="flex justify-center text-slate-400 dark:text-slate-600">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          {/* Stage 3: Stopword Filtering & Clean String */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs">
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-[10px] uppercase font-bold mb-1">
              <span>Stage 3: Hinglish + English Stopwords Removed</span>
              <span>Filler particles discarded</span>
            </div>
            <p className="font-mono text-emerald-950 dark:text-emerald-100 font-medium">{cleaned || <span className="text-slate-400 italic">all words were stopwords</span>}</p>
          </div>

          <div className="flex justify-center text-slate-400 dark:text-slate-600">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          {/* Stage 4: Extracted Tokens */}
          <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-100/30 dark:bg-emerald-950/40 text-xs">
            <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-200 text-[10px] uppercase font-bold mb-1.5">
              <span>Stage 4: Final Feature Tokens for Downstream TF-IDF / Sentiment</span>
              <span>{tokens.length} token(s)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tokens.length > 0 ? (
                tokens.map((token, i) => (
                  <span key={i} className="px-2 py-0.5 bg-emerald-600 text-white rounded font-mono font-medium text-xs">
                    {token}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic">No valid tokens</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dictionaries & Lexicon Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Slang Dictionary */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3>Chat Slang Dictionary</h3>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">{Object.keys(DEFAULT_SLANG_DICT).length} entries</span>
          </div>

          <input
            type="text"
            value={slangSearch}
            onChange={(e) => setSlangSearch(e.target.value)}
            placeholder="Search slang abbreviation..."
            className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 dark:border-slate-800 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/40">
            {filteredSlang.map(([abbr, canonical]) => (
              <div key={abbr} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-900">{abbr}</span>
                <span className="text-slate-400 dark:text-slate-500">→</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{canonical}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hinglish Stopwords */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3>Stopwords Corpus</h3>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">{DEFAULT_HINGLISH_STOPWORDS.size} words</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Common English + Hindi Romanized particles filtered out to retain content words:
          </p>

          <div className="max-h-56 overflow-y-auto p-2.5 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap gap-1.5">
            {Array.from(DEFAULT_HINGLISH_STOPWORDS).sort().map(sw => (
              <span key={sw} className="px-2 py-0.5 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono rounded">
                {sw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
