import { ChatMessage, OverviewStats, UserStats, WordFrequency } from '../types';
import { cleanText, tokenizeText } from './preprocessing';

export function getOverviewStats(messages: ChatMessage[], selectedUser: string = "Overall"): OverviewStats {
  const filtered = selectedUser === "Overall"
    ? messages.filter(m => m.user !== "group_notification")
    : messages.filter(m => m.user === selectedUser);

  if (filtered.length === 0) {
    return {
      totalMessages: 0,
      totalWords: 0,
      totalMedia: 0,
      totalLinks: 0,
      totalUsers: 0,
      avgMessageLength: 0,
      mostActiveUser: "—",
      busiestDay: "—",
      busiestMonth: "—",
      dateRange: { start: "—", end: "—" }
    };
  }

  const totalMessages = filtered.length;
  const totalWords = filtered.reduce((acc, m) => acc + m.wordCount, 0);
  const totalMedia = filtered.filter(m => m.hasMedia).length;
  const totalLinks = filtered.filter(m => m.hasLinks).length;

  const userCounts: Record<string, number> = {};
  const dayCounts: Record<string, number> = {};
  const monthCounts: Record<string, number> = {};

  for (const m of filtered) {
    userCounts[m.user] = (userCounts[m.user] || 0) + 1;
    dayCounts[m.dayName] = (dayCounts[m.dayName] || 0) + 1;
    monthCounts[m.month] = (monthCounts[m.month] || 0) + 1;
  }

  const allUsers = Object.keys(userCounts);
  let mostActiveUser = allUsers[0] || "—";
  let maxCount = 0;
  for (const [u, count] of Object.entries(userCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostActiveUser = u;
    }
  }

  let busiestDay = "—";
  let maxDayCount = 0;
  for (const [d, count] of Object.entries(dayCounts)) {
    if (count > maxDayCount) {
      maxDayCount = count;
      busiestDay = d;
    }
  }

  let busiestMonth = "—";
  let maxMonthCount = 0;
  for (const [m, count] of Object.entries(monthCounts)) {
    if (count > maxMonthCount) {
      maxMonthCount = count;
      busiestMonth = m;
    }
  }

  // Find min and max date
  const sortedDates = [...filtered].sort((a, b) => a.date.getTime() - b.date.getTime());
  const startDate = sortedDates[0]?.dateStr || "—";
  const endDate = sortedDates[sortedDates.length - 1]?.dateStr || "—";

  return {
    totalMessages,
    totalWords,
    totalMedia,
    totalLinks,
    totalUsers: allUsers.length,
    avgMessageLength: parseFloat((totalWords / (totalMessages || 1)).toFixed(1)),
    mostActiveUser,
    busiestDay,
    busiestMonth,
    dateRange: { start: startDate, end: endDate }
  };
}

export function getUserStats(messages: ChatMessage[]): UserStats[] {
  const realMessages = messages.filter(m => m.user !== "group_notification");
  if (realMessages.length === 0) return [];

  const userGroups: Record<string, ChatMessage[]> = {};
  for (const m of realMessages) {
    if (!userGroups[m.user]) userGroups[m.user] = [];
    userGroups[m.user].push(m);
  }

  const totalOverall = realMessages.length;
  const result: UserStats[] = [];

  for (const [user, uMessages] of Object.entries(userGroups)) {
    const msgCount = uMessages.length;
    const words = uMessages.reduce((acc, m) => acc + m.wordCount, 0);
    const media = uMessages.filter(m => m.hasMedia).length;
    const links = uMessages.filter(m => m.hasLinks).length;

    // Most active hour
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<string, number> = {};
    for (const m of uMessages) {
      hourCounts[m.hour] = (hourCounts[m.hour] || 0) + 1;
      dayCounts[m.dayName] = (dayCounts[m.dayName] || 0) + 1;
    }

    let topHour = 12;
    let topHourCount = -1;
    for (const [h, count] of Object.entries(hourCounts)) {
      const numH = Number(h);
      if (count > topHourCount) {
        topHourCount = count;
        topHour = numH;
      }
    }

    let topDay = "Monday";
    let topDayCount = -1;
    for (const [d, count] of Object.entries(dayCounts)) {
      if (count > topDayCount) {
        topDayCount = count;
        topDay = d;
      }
    }

    result.push({
      user,
      messages: msgCount,
      words,
      media,
      links,
      avgLength: parseFloat((words / (msgCount || 1)).toFixed(1)),
      percentage: parseFloat(((msgCount / totalOverall) * 100).toFixed(1)),
      mostActiveHour: topHour,
      mostActiveDay: topDay
    });
  }

  // Sort descending by message count
  return result.sort((a, b) => b.messages - a.messages);
}

export function getMessagesByDate(messages: ChatMessage[]): Array<{ date: string; count: number }> {
  const dateMap: Record<string, number> = {};
  for (const m of messages) {
    dateMap[m.dateStr] = (dateMap[m.dateStr] || 0) + 1;
  }

  const sortedDates = Object.keys(dateMap).sort();
  return sortedDates.map(date => ({
    date,
    count: dateMap[date]
  }));
}

export function getMessagesByDayOfWeek(messages: ChatMessage[]): Array<{ day: string; count: number }> {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayMap: Record<string, number> = {};
  for (const d of days) dayMap[d] = 0;

  for (const m of messages) {
    if (dayMap[m.dayName] !== undefined) {
      dayMap[m.dayName]++;
    }
  }

  return days.map(day => ({
    day,
    count: dayMap[day]
  }));
}

export function getHourlyActivity(messages: ChatMessage[]): Array<{ hour: string; count: number }> {
  const hourMap: Record<number, number> = {};
  for (let i = 0; i < 24; i++) hourMap[i] = 0;

  for (const m of messages) {
    hourMap[m.hour] = (hourMap[m.hour] || 0) + 1;
  }

  return Object.keys(hourMap).map(h => {
    const hr = Number(h);
    const label = hr === 0 ? "12 AM" : hr < 12 ? `${hr} AM` : hr === 12 ? "12 PM" : `${hr - 12} PM`;
    return {
      hour: label,
      count: hourMap[hr]
    };
  });
}

export function getTopWords(messages: ChatMessage[], limit: number = 20): WordFrequency[] {
  const wordCounts: Record<string, number> = {};

  for (const m of messages) {
    if (m.messageType === "media" || m.messageType === "deleted") continue;
    const tokens = tokenizeText(m.message);
    for (const t of tokens) {
      wordCounts[t] = (wordCounts[t] || 0) + 1;
    }
  }

  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

export function getTopNgrams(messages: ChatMessage[], n: number = 2, limit: number = 15): WordFrequency[] {
  const ngramCounts: Record<string, number> = {};

  for (const m of messages) {
    if (m.messageType === "media" || m.messageType === "deleted") continue;
    const tokens = tokenizeText(m.message);
    if (tokens.length < n) continue;

    for (let i = 0; i <= tokens.length - n; i++) {
      const phrase = tokens.slice(i, i + n).join(" ");
      ngramCounts[phrase] = (ngramCounts[phrase] || 0) + 1;
    }
  }

  return Object.entries(ngramCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}
