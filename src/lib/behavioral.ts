import {
  ChatMessage,
  ResponseLatency,
  UserLatencyStats,
  NightOwlStats,
  ActivityStreak,
  InteractionPair
} from '../types';

export const DEFAULT_MAX_RESPONSE_MINUTES = 180;
export const DEFAULT_SESSION_GAP_MINUTES = 60;
export const NIGHT_HOURS = new Set([23, 0, 1, 2, 3, 4, 5]); // 11 PM to 5 AM

export interface ResponseEvent {
  replier: string;
  previousSender: string;
  latencyMinutes: number;
  timestamp: Date;
}

export function computeResponseEvents(
  messages: ChatMessage[],
  maxResponseMinutes: number = DEFAULT_MAX_RESPONSE_MINUTES
): ResponseEvent[] {
  const realMessages = messages
    .filter(m => m.user !== "group_notification")
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const events: ResponseEvent[] = [];

  for (let i = 1; i < realMessages.length; i++) {
    const prev = realMessages[i - 1];
    const curr = realMessages[i];

    if (prev.user === curr.user) continue;

    const diffMs = curr.date.getTime() - prev.date.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes > 0 && diffMinutes <= maxResponseMinutes) {
      events.push({
        replier: curr.user,
        previousSender: prev.user,
        latencyMinutes: parseFloat(diffMinutes.toFixed(1)),
        timestamp: curr.date
      });
    }
  }

  return events;
}

export function calculateLatencyStats(events: ResponseEvent[]): ResponseLatency {
  if (events.length === 0) {
    return {
      medianMinutes: 0,
      meanMinutes: 0,
      fastestMinutes: 0,
      slowestMinutes: 0,
      sampleCount: 0
    };
  }

  const values = events.map(e => e.latencyMinutes).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    medianMinutes: parseFloat(median.toFixed(1)),
    meanMinutes: parseFloat((sum / values.length).toFixed(1)),
    fastestMinutes: parseFloat(values[0].toFixed(1)),
    slowestMinutes: parseFloat(values[values.length - 1].toFixed(1)),
    sampleCount: values.length
  };
}

export function calculateUserLatencyStats(events: ResponseEvent[]): UserLatencyStats[] {
  const userGroups: Record<string, number[]> = {};

  for (const e of events) {
    if (!userGroups[e.replier]) userGroups[e.replier] = [];
    userGroups[e.replier].push(e.latencyMinutes);
  }

  const result: UserLatencyStats[] = [];

  for (const [user, values] of Object.entries(userGroups)) {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
    const sum = values.reduce((a, b) => a + b, 0);

    result.push({
      user,
      medianMinutes: parseFloat(median.toFixed(1)),
      meanMinutes: parseFloat((sum / values.length).toFixed(1)),
      sampleCount: values.length
    });
  }

  return result.sort((a, b) => a.medianMinutes - b.medianMinutes);
}

export function calculateNightOwlStats(messages: ChatMessage[]): NightOwlStats[] {
  const realMessages = messages.filter(m => m.user !== "group_notification");
  const userTotals: Record<string, number> = {};
  const userNight: Record<string, number> = {};

  for (const m of realMessages) {
    userTotals[m.user] = (userTotals[m.user] || 0) + 1;
    if (NIGHT_HOURS.has(m.hour)) {
      userNight[m.user] = (userNight[m.user] || 0) + 1;
    }
  }

  return Object.keys(userTotals).map(user => {
    const total = userTotals[user] || 1;
    const night = userNight[user] || 0;
    return {
      user,
      totalNightMessages: night,
      nightPercentage: parseFloat(((night / total) * 100).toFixed(1))
    };
  }).sort((a, b) => b.nightPercentage - a.nightPercentage);
}

export function calculateConversationStarters(
  messages: ChatMessage[],
  sessionGapMinutes: number = DEFAULT_SESSION_GAP_MINUTES
): Array<{ user: string; sessionsStarted: number; percentage: number }> {
  const realMessages = messages
    .filter(m => m.user !== "group_notification")
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (realMessages.length === 0) return [];

  const starters: Record<string, number> = {};
  // First message always starts session 1
  starters[realMessages[0].user] = 1;
  let totalSessions = 1;

  for (let i = 1; i < realMessages.length; i++) {
    const prev = realMessages[i - 1];
    const curr = realMessages[i];
    const diffMinutes = (curr.date.getTime() - prev.date.getTime()) / (1000 * 60);

    if (diffMinutes >= sessionGapMinutes) {
      starters[curr.user] = (starters[curr.user] || 0) + 1;
      totalSessions++;
    }
  }

  return Object.entries(starters)
    .map(([user, count]) => ({
      user,
      sessionsStarted: count,
      percentage: parseFloat(((count / totalSessions) * 100).toFixed(1))
    }))
    .sort((a, b) => b.sessionsStarted - a.sessionsStarted);
}

export function calculateActivityStreaks(messages: ChatMessage[]): ActivityStreak[] {
  const realMessages = messages.filter(m => m.user !== "group_notification");
  const users = Array.from(new Set(realMessages.map(m => m.user)));

  const streaks: ActivityStreak[] = [];

  for (const user of users) {
    const userDates = Array.from(new Set(
      realMessages.filter(m => m.user === user).map(m => m.dateStr)
    )).sort();

    if (userDates.length === 0) continue;

    let longest = 1;
    let current = 1;
    let longestStart = userDates[0];
    let longestEnd = userDates[0];
    let tempStart = userDates[0];

    for (let i = 1; i < userDates.length; i++) {
      const d1 = new Date(userDates[i - 1]);
      const d2 = new Date(userDates[i]);
      const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        current++;
        if (current > longest) {
          longest = current;
          longestStart = tempStart;
          longestEnd = userDates[i];
        }
      } else {
        current = 1;
        tempStart = userDates[i];
      }
    }

    streaks.push({
      user,
      currentStreak: current,
      longestStreak: longest,
      longestStreakStart: longestStart,
      longestStreakEnd: longestEnd
    });
  }

  return streaks.sort((a, b) => b.longestStreak - a.longestStreak);
}

export function calculateInteractionPairs(
  messages: ChatMessage[],
  maxResponseMinutes: number = DEFAULT_MAX_RESPONSE_MINUTES
): InteractionPair[] {
  const events = computeResponseEvents(messages, maxResponseMinutes);
  const pairMap: Record<string, { repliesAtoB: number; repliesBtoA: number }> = {};

  for (const e of events) {
    const sortedKey = [e.previousSender, e.replier].sort().join(" <-> ");
    if (!pairMap[sortedKey]) {
      pairMap[sortedKey] = { repliesAtoB: 0, repliesBtoA: 0 };
    }

    const [userA] = sortedKey.split(" <-> ");
    if (e.replier === userA) {
      pairMap[sortedKey].repliesAtoB++;
    } else {
      pairMap[sortedKey].repliesBtoA++;
    }
  }

  return Object.entries(pairMap).map(([key, counts]) => {
    const [userA, userB] = key.split(" <-> ");
    return {
      userA,
      userB,
      repliesFromAToB: counts.repliesAtoB,
      repliesFromBToA: counts.repliesBtoA,
      totalInteractions: counts.repliesAtoB + counts.repliesBtoA
    };
  }).sort((a, b) => b.totalInteractions - a.totalInteractions);
}
