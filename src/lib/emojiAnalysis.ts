import { ChatMessage, EmojiCount } from '../types';

export function getEmojiFrequency(messages: ChatMessage[], limit: number = 20): EmojiCount[] {
  const emojiCounts: Record<string, number> = {};
  let totalEmojis = 0;

  for (const m of messages) {
    for (const e of m.emojis) {
      emojiCounts[e] = (emojiCounts[e] || 0) + 1;
      totalEmojis++;
    }
  }

  if (totalEmojis === 0) return [];

  return Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([emoji, count]) => ({
      emoji,
      count,
      percentage: parseFloat(((count / totalEmojis) * 100).toFixed(1))
    }));
}

export function getEmojiStatsByUser(messages: ChatMessage[]): Array<{
  user: string;
  totalEmojis: number;
  messagesWithEmoji: number;
  emojiPercentage: number;
  favoriteEmoji: string;
}> {
  const realMessages = messages.filter(m => m.user !== "group_notification");
  const userMap: Record<string, { totalEmojis: number; messagesWithEmoji: number; totalMsgs: number; emojis: Record<string, number> }> = {};

  for (const m of realMessages) {
    if (!userMap[m.user]) {
      userMap[m.user] = { totalEmojis: 0, messagesWithEmoji: 0, totalMsgs: 0, emojis: {} };
    }
    userMap[m.user].totalMsgs++;
    if (m.emojis.length > 0) {
      userMap[m.user].messagesWithEmoji++;
      userMap[m.user].totalEmojis += m.emojis.length;
      for (const e of m.emojis) {
        userMap[m.user].emojis[e] = (userMap[m.user].emojis[e] || 0) + 1;
      }
    }
  }

  return Object.entries(userMap).map(([user, data]) => {
    let topEmoji = "—";
    let topCount = 0;
    for (const [e, count] of Object.entries(data.emojis)) {
      if (count > topCount) {
        topCount = count;
        topEmoji = e;
      }
    }

    return {
      user,
      totalEmojis: data.totalEmojis,
      messagesWithEmoji: data.messagesWithEmoji,
      emojiPercentage: parseFloat(((data.messagesWithEmoji / (data.totalMsgs || 1)) * 100).toFixed(1)),
      favoriteEmoji: topEmoji
    };
  }).sort((a, b) => b.totalEmojis - a.totalEmojis);
}
