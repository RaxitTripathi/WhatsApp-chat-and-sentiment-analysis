import React, { useState } from 'react';
import { UserStats } from '../types';
import { Download, ArrowUpDown, Award, AlignLeft } from 'lucide-react';
import { downloadAsCsv } from '../lib/exportCsv';

interface UserAnalyticsTabProps {
  userStats: UserStats[];
}

export const UserAnalyticsTab: React.FC<UserAnalyticsTabProps> = ({ userStats }) => {
  const [sortField, setSortField] = useState<keyof UserStats>('messages');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedStats = [...userStats].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
  });

  const handleSort = (field: keyof UserStats) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleDownload = () => {
    downloadAsCsv(userStats, 'whatsapp_user_statistics.csv');
  };

  const rankByMessages = [...userStats].sort((a, b) => b.messages - a.messages);
  const rankByLength = [...userStats].sort((a, b) => b.avgLength - a.avgLength);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Per-User Statistics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Message/word counts, average message length, conversation share, and peak activity patterns
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Export User Stats (CSV)</span>
        </button>
      </div>

      {/* Main interactive user table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-750 select-none">
              <tr>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('user')}>
                  <div className="flex items-center gap-1">
                    <span>Participant</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer text-right" onClick={() => handleSort('messages')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Messages</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer text-right" onClick={() => handleSort('percentage')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Share %</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer text-right" onClick={() => handleSort('words')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Words</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer text-right" onClick={() => handleSort('avgLength')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Avg Length</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Peak Hour</th>
                <th className="py-3 px-4 text-center">Peak Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedStats.map((u) => (
                <tr key={u.user} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{u.user}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800 dark:text-slate-200">{u.messages.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${u.percentage}%` }} />
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{u.percentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">{u.words.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{u.avgLength} words</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700">
                      {u.mostActiveHour}:00
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200 dark:border-emerald-800">
                      {u.mostActiveDay}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rankings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Award className="w-4 h-4 text-amber-500" />
            <h3>Most Messages Sent</h3>
          </div>
          <div className="space-y-2">
            {rankByMessages.slice(0, 5).map((u, i) => (
              <div key={u.user} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{u.user}</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{u.messages} msgs ({u.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <AlignLeft className="w-4 h-4 text-blue-500" />
            <h3>Longest Average Messages</h3>
          </div>
          <div className="space-y-2">
            {rankByLength.slice(0, 5).map((u, i) => (
              <div key={u.user} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{u.user}</span>
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400">{u.avgLength} words/msg</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
