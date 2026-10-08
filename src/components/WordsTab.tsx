import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { getTopWords, getTopNgrams } from '../lib/analytics';
import { AlignLeft, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface WordsTabProps {
  messages: ChatMessage[];
}

export const WordsTab: React.FC<WordsTabProps> = ({ messages }) => {
  const [ngramMode, setNgramMode] = useState<2 | 3>(2);

  const topWords = getTopWords(messages, 15);
  const ngrams = getTopNgrams(messages, ngramMode, 15);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Word & Phrase Frequency Analysis</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Identifies the most prominent conversational topics, phrases, and vocabulary after filtering stopwords.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Most Frequent Words Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <AlignLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3>Most Frequent Clean Words</h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topWords} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b833" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="word" type="category" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} width={70} />
                <Tooltip
                  formatter={(val: number) => [`${val} occurrences`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Phrases / N-Grams */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3>Common Multi-Word Phrases</h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setNgramMode(2)}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  ngramMode === 2
                    ? 'bg-white dark:bg-slate-700 shadow-2xs text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Bigrams (2)
              </button>
              <button
                onClick={() => setNgramMode(3)}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  ngramMode === 3
                    ? 'bg-white dark:bg-slate-700 shadow-2xs text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Trigrams (3)
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {ngrams.length > 0 ? (
              ngrams.map((item, idx) => (
                <div key={item.word} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] w-4">{idx + 1}.</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{item.word}</span>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{item.count} uses</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center">No recurring phrases found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
