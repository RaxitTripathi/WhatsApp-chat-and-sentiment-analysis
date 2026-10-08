import React from 'react';
import {
  MessageSquare,
  FileText,
  Image,
  Link2,
  Users,
  Calendar,
  Sparkles,
  Download,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { ChatMessage, OverviewStats, UserStats } from '../types';
import { getMessagesByDate } from '../lib/analytics';
import { downloadAsCsv } from '../lib/exportCsv';
import { FileDown } from 'lucide-react';

interface OverviewTabProps {
  stats: OverviewStats;
  userStats: UserStats[];
  messages: ChatMessage[];
  selectedUser: string;
  onGeneratePdf?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  userStats,
  messages,
  selectedUser,
  onGeneratePdf
}) => {
  const timelineData = getMessagesByDate(messages);

  const handleDownloadChat = () => {
    const exportData = messages.map(m => ({
      date: m.dateStr,
      time: m.timeStr,
      user: m.user,
      message: m.message,
      type: m.messageType,
      sentiment: m.sentiment
    }));
    downloadAsCsv(exportData, `whatsapp_chat_filtered_${selectedUser.toLowerCase()}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Top statistics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Messages</span>
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalMessages.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Across date window</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Words</span>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalWords.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Excluding attachments</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Media Shared</span>
            <Image className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalMedia.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Images, audio, docs</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Links Shared</span>
            <Link2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalLinks.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Web addresses</span>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Participants</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg. Message Length</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.avgMessageLength} words</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Most Active Contributor</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{stats.mostActiveUser}</p>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Messages by date timeline */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Message Volume Timeline</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily chat frequency across the filtered period</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b833" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Messages"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Messages by user */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contribution By User</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Volume breakdown among participants</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userStats.slice(0, 8)}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b833" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="user" type="category" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}
                />
                <Bar dataKey="messages" name="Messages" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Busiest day and month glance */}
      <div className="bg-slate-100/70 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase">Busiest Day</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{stats.busiestDay}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase">Busiest Month</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{stats.busiestMonth}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onGeneratePdf && (
            <button
              onClick={onGeneratePdf}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Generate PDF Report</span>
            </button>
          )}

          <button
            onClick={handleDownloadChat}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Chat (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
