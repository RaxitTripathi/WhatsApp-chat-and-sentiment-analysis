import React from 'react';
import { ChatMessage } from '../types';
import {
  computeResponseEvents,
  calculateLatencyStats,
  calculateUserLatencyStats,
  calculateNightOwlStats,
  calculateConversationStarters,
  calculateActivityStreaks,
  calculateInteractionPairs
} from '../lib/behavioral';
import { Clock, Moon, Flame, Users, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface LatencyTabProps {
  messages: ChatMessage[];
  maxResponseMinutes: number;
  sessionGapMinutes: number;
}

export const LatencyTab: React.FC<LatencyTabProps> = ({
  messages,
  maxResponseMinutes,
  sessionGapMinutes
}) => {
  const events = computeResponseEvents(messages, maxResponseMinutes);
  const overallLatency = calculateLatencyStats(events);
  const userLatencies = calculateUserLatencyStats(events);
  const nightOwl = calculateNightOwlStats(messages);
  const starters = calculateConversationStarters(messages, sessionGapMinutes);
  const streaks = calculateActivityStreaks(messages);
  const interactions = calculateInteractionPairs(messages, maxResponseMinutes);

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 p-3.5 rounded-xl text-xs text-amber-900 dark:text-amber-200 leading-relaxed transition-colors">
        <span className="font-bold">Descriptive timing only: </span>
        Response speed and session counts reflect daily schedules, timezones, and connectivity rather than personal affinity or relationship strength.
      </div>

      {/* Latency Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Median Response</span>
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{overallLatency.medianMinutes} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">min</span></p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Typical turn speed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Average Response</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{overallLatency.meanMinutes} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">min</span></p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Mean response time</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Fastest Reply</span>
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{overallLatency.fastestMinutes} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">min</span></p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Quickest turnaround</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Turn Events</span>
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{overallLatency.sampleCount}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Replies within {maxResponseMinutes}m</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* User Latency Comparison */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Median Reply Time by User</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lower minutes indicate quicker average replies</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userLatencies} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b833" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit="m" />
                <YAxis dataKey="user" type="category" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} width={80} />
                <Tooltip
                  formatter={(val: number) => [`${val} min`, 'Median Reply']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}
                />
                <Bar dataKey="medianMinutes" name="Median Latency" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Night Owl Index */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3>Night Owl Index (11 PM - 5 AM)</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Proportion of messages sent late at night</p>

          <div className="space-y-2.5 pt-1">
            {nightOwl.map(item => (
              <div key={item.user} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200">{item.user}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.nightPercentage}% ({item.totalNightMessages} msgs)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, item.nightPercentage)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Conversation Starters */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3>Conversation Starters</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Who initiated new conversation threads after ≥{sessionGapMinutes} minutes of silence
          </p>

          <div className="space-y-2 pt-1">
            {starters.map((item, idx) => (
              <div key={item.user} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.user}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-700 dark:text-amber-400">{item.sessionsStarted} sessions</span>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px] ml-1">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Streaks */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Flame className="w-4 h-4 text-red-500" />
            <h3>Longest Chatting Streaks</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Consecutive days active in this chat group</p>

          <div className="space-y-2 pt-1">
            {streaks.map(item => (
              <div key={item.user} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">{item.user}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {item.longestStreakStart} → {item.longestStreakEnd}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-sm">
                  <Flame className="w-4 h-4 fill-red-500" />
                  <span>{item.longestStreak} days</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Interaction Pairs */}
      {interactions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Interaction Pairs</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pairs who exchange direct replies most frequently</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {interactions.slice(0, 6).map(pair => (
              <div key={`${pair.userA}-${pair.userB}`} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between font-semibold text-xs text-slate-800 dark:text-slate-200">
                  <span className="truncate">{pair.userA}</span>
                  <span className="text-slate-400 dark:text-slate-500">⇄</span>
                  <span className="truncate">{pair.userB}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Total replies:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{pair.totalInteractions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
