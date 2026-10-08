import React from 'react';
import { ChatMessage } from '../types';
import { getEmojiFrequency, getEmojiStatsByUser } from '../lib/emojiAnalysis';
import { Smile, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface EmojiTabProps {
  messages: ChatMessage[];
}

export const EmojiTab: React.FC<EmojiTabProps> = ({ messages }) => {
  const emojiFreq = getEmojiFrequency(messages, 15);
  const userEmojiStats = getEmojiStatsByUser(messages);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Emoji Frequency & Usage Patterns</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Analysis of visual emoticons used across the conversation</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Distinct Emojis</span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{emojiFreq.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Emojis Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Smile className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3>Most Frequent Emojis</h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emojiFreq} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b833" />
                <XAxis dataKey="emoji" tick={{ fontSize: 16 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(val: number) => [`${val} times`, 'Frequency']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emoji Table Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3>Top Emoji Share</h3>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {emojiFreq.map((item, idx) => (
              <div key={item.emoji} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] w-4">{idx + 1}.</span>
                  <span className="text-xl leading-none">{item.emoji}</span>
                </div>
                <div className="flex items-center gap-3 font-medium">
                  <span className="text-slate-800 dark:text-slate-200">{item.count} uses</span>
                  <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per User Emoji Usage */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden space-y-2 p-4 transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emoji Usage by Participant</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-750">
              <tr>
                <th className="py-2.5 px-3">Participant</th>
                <th className="py-2.5 px-3 text-right">Total Emojis</th>
                <th className="py-2.5 px-3 text-right">Msgs with Emoji</th>
                <th className="py-2.5 px-3 text-right">Emoji Message %</th>
                <th className="py-2.5 px-3 text-center">Favorite Emoji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {userEmojiStats.map(u => (
                <tr key={u.user} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{u.user}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-800 dark:text-slate-200">{u.totalEmojis}</td>
                  <td className="py-2.5 px-3 text-right">{u.messagesWithEmoji}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{u.emojiPercentage}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-lg">{u.favoriteEmoji}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
