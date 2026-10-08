import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { ChatMessage } from '../types';
import { getMessagesByDayOfWeek, getHourlyActivity, getUserStats } from '../lib/analytics';
import { Clock, Calendar, Users, Award, Percent, Filter, Activity as ActivityIcon } from 'lucide-react';

interface ActivityTabProps {
  messages: ChatMessage[];
}

const COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b'  // slate
];

export const ActivityTab: React.FC<ActivityTabProps> = ({ messages }) => {
  const [selectedPerson, setSelectedPerson] = useState<string>('all');

  // Compute overall user contributions
  const userStats = useMemo(() => getUserStats(messages), [messages]);

  // Filter messages if a specific person is selected
  const activeMessages = useMemo(() => {
    if (selectedPerson === 'all') return messages;
    return messages.filter(m => m.user === selectedPerson);
  }, [messages, selectedPerson]);

  const dayOfWeekData = useMemo(() => getMessagesByDayOfWeek(activeMessages), [activeMessages]);
  const hourlyData = useMemo(() => getHourlyActivity(activeMessages), [activeMessages]);

  // Calculate 7x24 heatmap matrix for active messages
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const matrix: Record<string, Record<number, number>> = {};
  let maxCell = 0;

  for (const d of fullDays) {
    matrix[d] = {};
    for (let h = 0; h < 24; h++) matrix[d][h] = 0;
  }

  for (const m of activeMessages) {
    if (matrix[m.dayName]) {
      matrix[m.dayName][m.hour]++;
      if (matrix[m.dayName][m.hour] > maxCell) {
        maxCell = matrix[m.dayName][m.hour];
      }
    }
  }

  // Prepare contribution pie chart data
  const contributionPieData = useMemo(() => {
    const totalMsgs = messages.filter(m => m.messageType !== 'system').length;
    if (totalMsgs === 0) return [];

    return userStats.slice(0, 6).map((u, idx) => ({
      name: u.user,
      value: u.messages,
      percentage: ((u.messages / totalMsgs) * 100).toFixed(1),
      color: COLORS[idx % COLORS.length]
    }));
  }, [messages, userStats]);

  // Selected person stats summary
  const selectedPersonStats = useMemo(() => {
    if (selectedPerson === 'all') return null;
    return userStats.find(u => u.user === selectedPerson) || null;
  }, [userStats, selectedPerson]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Participant Filter */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Activity & Member Contribution Dashboard
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
              Interactive
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyze overall group timing rhythms or drill down to see any individual member's specific contribution and active hours.
          </p>
        </div>

        {/* Member Selector Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400 ml-1.5" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Member:</span>
          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-2.5 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Entire Group (Combined)</option>
            {userStats.map((u) => (
              <option key={u.user} value={u.user}>
                {u.user} ({u.percentage}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Contribution Breakdown (Leaderboard Cards) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Group Contribution Share (% of Total Chat)
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {userStats.length} active participants
          </span>
        </div>

        {/* Progress Bars for Top Contributors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {userStats.map((u, idx) => {
            const isSelected = selectedPerson === u.user;
            return (
              <button
                key={u.user}
                onClick={() => setSelectedPerson(isSelected ? 'all' : u.user)}
                className={`p-3.5 rounded-lg text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {u.user}
                    </span>
                    {idx === 0 && (
                      <span title="Most active contributor">
                        <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                    {u.percentage}%
                  </span>
                </div>

                {/* Progress fill */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, u.percentage)}%`,
                      backgroundColor: COLORS[idx % COLORS.length]
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  <span>{u.messages.toLocaleString()} msgs</span>
                  <span>Peak: {u.mostActiveHour}:00 ({u.mostActiveDay.slice(0, 3)})</span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedPerson !== 'all' && selectedPersonStats && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <ActivityIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Filtering timing charts for <strong>{selectedPerson}</strong> ({selectedPersonStats.messages} messages, {selectedPersonStats.words} words).
              </span>
            </div>
            <button
              onClick={() => setSelectedPerson('all')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
            >
              Reset to entire group
            </button>
          </div>
        )}
      </div>

      {/* Day of Week & Hour of Day Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Day of Week Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3>Activity by Day of Week</h3>
            </div>
            <span className="text-xs text-slate-400">
              {selectedPerson === 'all' ? 'All Members' : selectedPerson}
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b833" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}
                />
                <Bar dataKey="count" name="Messages" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3>Activity by Hour of Day (24h)</h3>
            </div>
            <span className="text-xs text-slate-400">
              {selectedPerson === 'all' ? 'All Members' : selectedPerson}
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b833" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}
                />
                <Bar dataKey="count" name="Messages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 24x7 Activity Heatmap Grid */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Weekly Activity Heatmap ({selectedPerson === 'all' ? 'Group Total' : selectedPerson})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Shows when this member (or group) is most active throughout the week
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            Peak: {maxCell} msgs/hr
          </span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono mb-1">
              <span />
              {Array.from({ length: 24 }).map((_, h) => (
                <span key={h} className="text-center">{h}</span>
              ))}
            </div>

            <div className="space-y-1">
              {fullDays.map((dayName, idx) => (
                <div key={dayName} className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 items-center">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{days[idx]}</span>
                  {Array.from({ length: 24 }).map((_, h) => {
                    const count = matrix[dayName]?.[h] || 0;
                    const intensity = maxCell > 0 ? count / maxCell : 0;
                    let bgColor = 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500';
                    if (intensity > 0.75) bgColor = 'bg-emerald-700 dark:bg-emerald-600 text-white';
                    else if (intensity > 0.5) bgColor = 'bg-emerald-500 text-white';
                    else if (intensity > 0.25) bgColor = 'bg-emerald-300 dark:bg-emerald-800/70 text-slate-900 dark:text-emerald-100';
                    else if (intensity > 0) bgColor = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200';

                    return (
                      <div
                        key={h}
                        title={`${dayName} at ${h}:00 - ${count} messages`}
                        className={`h-7 rounded-sm flex items-center justify-center text-[10px] font-mono transition-colors ${bgColor}`}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
