import React, { useState, useMemo } from 'react';
import {
  ChatMessage,
  EmotionType
} from '../types';
import {
  calculateEmotionDistribution,
  calculateUserEmotionProfiles,
  detectHeatedExchanges,
  analyzeLiveMessage,
  DISCLAIMER
} from '../lib/sentiment';
import {
  Sparkles,
  Heart,
  Laugh,
  Flame,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Sun,
  Moon,
  Coffee,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface SentimentTabProps {
  messages: ChatMessage[];
  selectedUser?: string;
}

const EMOTION_META: Record<
  EmotionType,
  { label: string; icon: string; color: string; bg: string; border: string; darkBg: string }
> = {
  joy: {
    label: 'Joy & Celebration',
    icon: '🎉',
    color: '#10B981',
    bg: 'bg-emerald-50 text-emerald-700',
    border: 'border-emerald-200',
    darkBg: 'dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
  },
  love_gratitude: {
    label: 'Love & Gratitude',
    icon: '❤️',
    color: '#EC4899',
    bg: 'bg-pink-50 text-pink-700',
    border: 'border-pink-200',
    darkBg: 'dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800'
  },
  humor: {
    label: 'Humor & Banter',
    icon: '😂',
    color: '#F59E0B',
    bg: 'bg-amber-50 text-amber-700',
    border: 'border-amber-200',
    darkBg: 'dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
  },
  stress_urgency: {
    label: 'Stress & Urgency',
    icon: '😰',
    color: '#F97316',
    bg: 'bg-orange-50 text-orange-700',
    border: 'border-orange-200',
    darkBg: 'dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
  },
  sadness: {
    label: 'Sadness & Low Mood',
    icon: '😢',
    color: '#6366F1',
    bg: 'bg-indigo-50 text-indigo-700',
    border: 'border-indigo-200',
    darkBg: 'dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
  },
  anger_frustration: {
    label: 'Anger & Frustration',
    icon: '😡',
    color: '#EF4444',
    bg: 'bg-red-50 text-red-700',
    border: 'border-red-200',
    darkBg: 'dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
  },
  neutral: {
    label: 'Neutral & Informational',
    icon: '💬',
    color: '#64748B',
    bg: 'bg-slate-50 text-slate-700',
    border: 'border-slate-200',
    darkBg: 'dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  }
};

const PRESET_PROMPTS = [
  { text: "Bhai kya comedy chal rahi hai yahan haha ekdum mast!", tag: "Hinglish Banter" },
  { text: "Kal subah 9 baje assignment submit karna hai bohot tension hai yaar", tag: "Stress & Deadline" },
  { text: "Arre wah kya genius kaam kiya hai tune lol shabash", tag: "Sarcasm Test" },
  { text: "Dil se shukriya dost, you are a true lifesaver ❤️", tag: "Gratitude" },
  { text: "Poora mood kharab kar diya bakwas mistake ne gussa aa raha hai", tag: "Frustration" }
];

export const SentimentTab: React.FC<SentimentTabProps> = ({ messages, selectedUser = "Overall" }) => {
  const [testText, setTestText] = useState<string>("Mast party thi kal maza aa gaya! 🎉");
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);

  // Filter messages for current user if not "Overall"
  const activeMessages = useMemo(() => {
    if (!selectedUser || selectedUser === "Overall") return messages;
    return messages.filter(m => m.user === selectedUser);
  }, [messages, selectedUser]);

  // Aggregate Metrics
  const emotionDist = useMemo(() => calculateEmotionDistribution(activeMessages), [activeMessages]);
  const userProfiles = useMemo(() => calculateUserEmotionProfiles(messages), [messages]);
  const heatedExchanges = useMemo(() => detectHeatedExchanges(activeMessages), [activeMessages]);

  // Average Polarity & Positive Sentiment Ratio
  const { avgPolarity, highArousalCount } = useMemo(() => {
    if (activeMessages.length === 0) return { avgPolarity: 0, highArousalCount: 0 };
    let scoreSum = 0;
    let highArousal = 0;
    for (const m of activeMessages) {
      scoreSum += m.sentimentScore || 0;
      if (m.arousal === 'high') highArousal++;
    }
    return {
      avgPolarity: scoreSum / activeMessages.length,
      highArousalCount: highArousal
    };
  }, [activeMessages]);

  // Interactive Live Playground Analysis
  const liveAnalysis = useMemo(() => analyzeLiveMessage(testText), [testText]);

  // Timeline Mood Trajectory Data
  const moodTimelineData = useMemo(() => {
    const dateMap = new Map<string, { totalScore: number; count: number; dateStr: string }>();
    for (const m of activeMessages) {
      if (!m.dateStr) continue;
      const existing = dateMap.get(m.dateStr) || { totalScore: 0, count: 0, dateStr: m.dateStr };
      existing.totalScore += m.sentimentScore || 0;
      existing.count += 1;
      dateMap.set(m.dateStr, existing);
    }

    return Array.from(dateMap.values())
      .slice(-14) // Last 14 active days
      .map(d => ({
        date: d.dateStr.slice(5), // MM-DD
        avgMood: parseFloat((d.totalScore / (d.count || 1)).toFixed(2)),
        messages: d.count
      }));
  }, [activeMessages]);

  // Chart data for 7-class emotion distribution
  const emotionChartData = useMemo(() => {
    return [
      { name: 'Joy', count: emotionDist.joy, pct: emotionDist.joyPct, fill: '#10B981', icon: '🎉' },
      { name: 'Gratitude', count: emotionDist.love_gratitude, pct: emotionDist.lovePct, fill: '#EC4899', icon: '❤️' },
      { name: 'Humor', count: emotionDist.humor, pct: emotionDist.humorPct, fill: '#F59E0B', icon: '😂' },
      { name: 'Stress', count: emotionDist.stress_urgency, pct: emotionDist.stressPct, fill: '#F97316', icon: '😰' },
      { name: 'Sadness', count: emotionDist.sadness, pct: emotionDist.sadnessPct, fill: '#6366F1', icon: '😢' },
      { name: 'Frustration', count: emotionDist.anger_frustration, pct: emotionDist.angerPct, fill: '#EF4444', icon: '😡' },
      { name: 'Neutral', count: emotionDist.neutral, pct: emotionDist.neutralPct, fill: '#64748B', icon: '💬' }
    ];
  }, [emotionDist]);

  // Hourly Vibe Rhythm (Morning, Afternoon, Evening, Night)
  const timeVibeData = useMemo(() => {
    let morningPos = 0, morningTotal = 0;
    let afternoonPos = 0, afternoonTotal = 0;
    let eveningPos = 0, eveningTotal = 0;
    let nightPos = 0, nightTotal = 0;

    for (const m of activeMessages) {
      const h = m.hour || 0;
      const isPositive = m.sentiment === 'positive';
      if (h >= 5 && h < 12) {
        morningTotal++;
        if (isPositive) morningPos++;
      } else if (h >= 12 && h < 17) {
        afternoonTotal++;
        if (isPositive) afternoonPos++;
      } else if (h >= 17 && h < 22) {
        eveningTotal++;
        if (isPositive) eveningPos++;
      } else {
        nightTotal++;
        if (isPositive) nightPos++;
      }
    }

    return [
      { period: 'Morning (5am - 12pm)', icon: Sun, pct: morningTotal ? Math.round((morningPos / morningTotal) * 100) : 50, count: morningTotal },
      { period: 'Afternoon (12pm - 5pm)', icon: Coffee, pct: afternoonTotal ? Math.round((afternoonPos / afternoonTotal) * 100) : 50, count: afternoonTotal },
      { period: 'Evening (5pm - 10pm)', icon: TrendingUp, pct: eveningTotal ? Math.round((eveningPos / eveningTotal) * 100) : 50, count: eveningTotal },
      { period: 'Late Night (10pm - 5am)', icon: Moon, pct: nightTotal ? Math.round((nightPos / nightTotal) * 100) : 50, count: nightTotal }
    ];
  }, [activeMessages]);

  const dominantMeta = EMOTION_META[emotionDist.dominantEmotion] || EMOTION_META.neutral;

  return (
    <div className="space-y-6">
      {/* Top Header Badge & Model Status */}
      <div className="bg-gradient-to-r from-emerald-900/10 via-teal-900/10 to-indigo-900/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/40 p-4 sm:p-5 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Hinglish Sentiment & Emotion Classifier
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                TF-IDF + N-Gram Model
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Evaluates Hinglish and English chat messages across 7 emotion categories with token attribution and sarcasm heuristics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>{showTechDetails ? 'Hide Model Specs' : 'View Model Specs'}</span>
        </button>
      </div>

      {/* Model Technical Specifications Drawer */}
      {showTechDetails && (
        <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-emerald-400">Architecture & Training Pipeline</span>
            <span className="text-[11px] text-slate-400">TF-IDF (1-2 N-grams) + Calibrated Multi-Class Classifier</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Emotion Classes</div>
              <div className="text-sm font-bold text-white mt-0.5">7 Categories</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Language Domain</div>
              <div className="text-sm font-bold text-white mt-0.5">English + Hinglish Romanized</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Sarcasm Meter</div>
              <div className="text-sm font-bold text-white mt-0.5">Contextual Irony Heuristics</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Inference Engine</div>
              <div className="text-sm font-bold text-white mt-0.5">Client-Side Zero Latency</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed italic">
            {DISCLAIMER}
          </p>
        </div>
      )}

      {/* Key Metric Highlights (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Dominant Emotion */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dominant Emotion</span>
            <span className="text-xl">{dominantMeta.icon}</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {dominantMeta.label.split('&')[0]}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            Leader with {emotionDist[emotionDist.dominantEmotion]} messages
          </div>
        </div>

        {/* Overall Polarity Score */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mood Polarity Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {avgPolarity >= 0 ? `+${avgPolarity.toFixed(2)}` : avgPolarity.toFixed(2)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ 1.0</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {avgPolarity > 0.15 ? 'Vibrant & Positive' : avgPolarity < -0.15 ? 'Tense or Stressed' : 'Balanced & Neutral'}
          </div>
        </div>

        {/* Emotional Arousal */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">High Energy & Arousal</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {Math.round((highArousalCount / (activeMessages.length || 1)) * 100)}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {highArousalCount} high-intensity messages
          </div>
        </div>

        {/* Heated Exchange Incidents */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Heated Moments</span>
            <ShieldAlert className={`w-4 h-4 ${heatedExchanges.length > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            {heatedExchanges.length} {heatedExchanges.length === 1 ? 'Incident' : 'Incidents'}
          </div>
          <div className={`text-[11px] font-medium mt-0.5 ${heatedExchanges.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {heatedExchanges.length > 0 ? 'Tension clusters detected' : 'Healthy peaceful vibe'}
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Emotion Breakdown Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                7-Class Emotion Spectrum
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categorization of messages across emotional dimensions
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {activeMessages.length} Messages
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{data.icon}</span>
                            <span>{data.name}</span>
                          </div>
                          <div className="text-slate-300">Count: <span className="font-semibold text-white">{data.count}</span></div>
                          <div className="text-slate-300">Share: <span className="font-semibold text-white">{data.pct}%</span></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {emotionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Emotion Pills Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {emotionChartData.slice(0, 4).map(item => (
              <div key={item.name} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm">{item.icon}</span>
                <div className="text-[11px] leading-tight">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                  <span className="text-slate-400 block">{item.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mood Trajectory Timeline */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Temporal Mood Trajectory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily average mood score trend (-1.0 negative to +1.0 positive)
            </p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodTimelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                          <div className="font-semibold text-slate-300">Date: {data.date}</div>
                          <div className="font-bold text-emerald-400">Mood: {data.avgMood > 0 ? `+${data.avgMood}` : data.avgMood}</div>
                          <div className="text-slate-400">Volume: {data.messages} msgs</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgMood"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10B981' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Time of Day Mood Rhythm */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Day-Part Positivity Rhythm
            </span>
            <div className="grid grid-cols-2 gap-2">
              {timeVibeData.map(v => {
                const Icon = v.icon;
                return (
                  <div key={v.period} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]">
                        {v.period.split(' ')[0]}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {v.pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* User Emotional Archetypes & Empathy Matrix */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            Participant Emotion Archetypes & Mood Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Behavioral analysis of each member's emotional contributions to the chat
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userProfiles.map(u => {
            const meta = EMOTION_META[u.dominantEmotion] || EMOTION_META.neutral;
            return (
              <div
                key={u.user}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                      {u.user.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                        {u.user}
                      </h4>
                      <span className="text-[10px] text-slate-400 block">{u.totalMessages} messages</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.bg} ${meta.border} ${meta.darkBg}`}>
                    {meta.icon} {meta.label.split(' ')[0]}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Psychological Archetype</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{u.archetype}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${u.positivityScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Positivity Index</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{u.positivityScore}/100</span>
                  </div>
                </div>

                {/* Sub-counts */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>Joy: <strong className="text-emerald-600 dark:text-emerald-400">{u.joyCount}</strong></span>
                  <span>Humor: <strong className="text-amber-600 dark:text-amber-400">{u.humorCount}</strong></span>
                  <span>Stress: <strong className="text-orange-600 dark:text-orange-400">{u.stressCount}</strong></span>
                  <span>Gratitude: <strong className="text-pink-600 dark:text-pink-400">{u.loveCount}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heated Moments / Conflict Incidents Section */}
      {heatedExchanges.length > 0 && (
        <div className="bg-red-50/60 dark:bg-red-950/20 p-5 rounded-xl border border-red-200 dark:border-red-900/60 space-y-3">
          <div className="flex items-center gap-2 text-red-900 dark:text-red-200 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Tension & Heated Exchange Spotter ({heatedExchanges.length} detected)</span>
          </div>
          <p className="text-xs text-red-700 dark:text-red-300">
            Detected clusters where frustration or high-urgency language clustered in short succession.
          </p>

          <div className="space-y-2 pt-1">
            {heatedExchanges.map(ex => (
              <div
                key={ex.id}
                className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-red-200/80 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                      {ex.timestamp}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Between: {ex.users.join(' & ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                    {ex.messagePreview}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {ex.reasons.map((r, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Real-Time Emotion & Sarcasm Simulator (Playground) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-500" />
              Interactive Text Classification & Token Attribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type or test any English or Hinglish text live to see token weights, emotion categorization, and sarcasm detection.
            </p>
          </div>
        </div>

        {/* Input box */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Type any message (e.g., 'Bhai maza aa gaya kya party thi' or 'Kal submission hai bohot tension hai')..."
              rows={2}
              className="w-full text-xs p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Quick Test Prompts:</span>
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTestText(p.text)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {p.tag}
              </button>
            ))}
          </div>
        </div>

        {/* Live Model Output Display */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Predicted Emotion */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Classified Emotion</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-lg">{EMOTION_META[liveAnalysis.emotion]?.icon || '💬'}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {EMOTION_META[liveAnalysis.emotion]?.label.split(' ')[0]}
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                {(liveAnalysis.emotionConfidence * 100).toFixed(0)}% Confidence
              </span>
            </div>

            {/* Polarity Score */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Polarity Valence</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {liveAnalysis.score > 0 ? `+${liveAnalysis.score}` : liveAnalysis.score}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 capitalize">
                {liveAnalysis.label} Sentiment
              </span>
            </div>

            {/* Arousal Intensity */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Energy / Arousal</span>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 capitalize">
                {liveAnalysis.arousal}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Punctuation & Caps Metric
              </span>
            </div>

            {/* Sarcasm Flag */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Sarcasm Meter</span>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs font-bold ${liveAnalysis.isSarcastic ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {liveAnalysis.isSarcastic ? 'Detected (Irony)' : 'Low Probability'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Hinglish Irony Pattern
              </span>
            </div>
          </div>

          {/* Explainable AI (XAI) Token Attribution */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Token Attribution & Feature Weights (Explainable AI):
            </span>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {liveAnalysis.tokens.map((tok, i) => {
                let badgeClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                if (tok.category === 'positive') badgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold";
                else if (tok.category === 'love') badgeClass = "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 font-bold";
                else if (tok.category === 'humor') badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold";
                else if (tok.category === 'stress') badgeClass = "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-bold";
                else if (tok.category === 'negative') badgeClass = "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold";

                return (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded text-xs transition-transform hover:scale-105 ${badgeClass}`}
                    title={`Weight: ${tok.weight}`}
                  >
                    {tok.word}
                    {tok.weight !== 0 && (
                      <span className="text-[9px] opacity-70 ml-1">
                        ({tok.weight > 0 ? `+${tok.weight}` : tok.weight})
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Probability Bars */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Class Probability Distribution:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {liveAnalysis.emotionProbabilities.map(ep => (
                <div key={ep.emotion} className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 w-36 truncate">
                    {ep.label}
                  </span>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(ep.prob * 100)}%`,
                        backgroundColor: ep.color
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 w-8 text-right">
                    {Math.round(ep.prob * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
