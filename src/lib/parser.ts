import { ChatMessage, MessageType } from '../types';
import { extractEmojis, extractUrls } from './preprocessing';
import { predictSentiment } from './sentiment';

// Matches start of WhatsApp message line (iOS or Android format, 12h or 24h)
// Android: 12/05/23, 9:15 pm - User: Message
// iOS: [12/05/23, 9:15:00 PM] User: Message
const HEADER_REGEX = /^\[?(\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}|[A-Za-z]{3,9}\.?\s\d{1,2},?\s\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:[APap]\.?[Mm]\.?)?)\]?\s*[-–—]?\s*(.*)$/;

const MEDIA_REGEX = /(<Media omitted>|image omitted|video omitted|audio omitted|sticker omitted|gif omitted|document omitted|contact card omitted)/i;
const DELETED_REGEX = /(this message was deleted|you deleted this message)/i;

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Normalizes Unicode spaces (e.g. narrow no-break space \u202f or \xa0)
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/[\u202f\xa0\u2000-\u200b]/g, " ");
}

/**
 * Parses date string like '12/05/23' or '2023-05-12' or 'May 12, 2023'
 * Prioritizes DD/MM/YYYY or DD/MM/YY (standard for WhatsApp outside US), with MM/DD fallback
 */
function parseDateParts(dateStr: string, timeStr: string): Date | null {
  try {
    const cleanDate = dateStr.trim();
    const cleanTime = timeStr.trim().toLowerCase();

    // Time parsing (12h or 24h)
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    const isPM = cleanTime.includes('pm') || cleanTime.includes('p.m');
    const isAM = cleanTime.includes('am') || cleanTime.includes('a.m');
    const timeDigits = cleanTime.replace(/[^\d:]/g, '').split(':');

    if (timeDigits.length >= 2) {
      hours = parseInt(timeDigits[0], 10);
      minutes = parseInt(timeDigits[1], 10);
      if (timeDigits[2]) seconds = parseInt(timeDigits[2], 10);

      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }

    // Try parsing date numbers
    const parts = cleanDate.split(/[/\-.]/).map(p => p.trim());
    if (parts.length === 3) {
      let day = 1;
      let month = 1;
      let year = 2023;

      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        // DD/MM/YY or MM/DD/YY
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        let p2 = parseInt(parts[2], 10);
        if (p2 < 100) p2 += 2000;

        // If p0 > 12, it must be DD/MM/YYYY
        if (p0 > 12) {
          day = p0;
          month = p1;
          year = p2;
        } else if (p1 > 12) {
          // MM/DD/YYYY
          month = p0;
          day = p1;
          year = p2;
        } else {
          // Default WhatsApp international format is day first (DD/MM/YYYY)
          day = p0;
          month = p1;
          year = p2;
        }
      }

      const d = new Date(year, month - 1, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }

    // Fallback: standard Date.parse
    const fallback = new Date(`${dateStr} ${timeStr}`);
    if (!isNaN(fallback.getTime())) return fallback;
  } catch {
    // Return null if parsing fails
  }

  return null;
}

export function parseWhatsAppChat(rawText: string): ChatMessage[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const rawEvents: Array<{
    dateStr: string;
    timeStr: string;
    rest: string;
  }> = [];

  for (const rawLine of lines) {
    const line = normalizeWhitespace(rawLine.trimEnd());
    if (!line) continue;

    const match = line.match(HEADER_REGEX);
    if (match) {
      rawEvents.push({
        dateStr: match[1],
        timeStr: match[2],
        rest: match[3]
      });
    } else if (rawEvents.length > 0) {
      // Continuation line of the previous message
      rawEvents[rawEvents.length - 1].rest += `\n${line}`;
    }
  }

  const messages: ChatMessage[] = [];
  let idCounter = 1;

  for (const event of rawEvents) {
    const dateObj = parseDateParts(event.dateStr, event.timeStr);
    if (!dateObj) continue;

    let user = "group_notification";
    let messageText = event.rest.trim();
    let messageType: MessageType = "system";

    // Check for "Sender: Message" pattern
    const colonIndex = messageText.indexOf(": ");
    if (colonIndex > 0 && colonIndex < 64) {
      user = messageText.substring(0, colonIndex).trim();
      messageText = messageText.substring(colonIndex + 2).trim();
      messageType = "text";
    }

    // Check for media or deleted
    if (MEDIA_REGEX.test(messageText)) {
      messageType = "media";
    } else if (DELETED_REGEX.test(messageText)) {
      messageType = "deleted";
    } else if (user === "group_notification") {
      messageType = "system";
    }

    const year = dateObj.getFullYear();
    const monthNum = dateObj.getMonth() + 1;
    const month = MONTH_NAMES[dateObj.getMonth()];
    const day = dateObj.getDate();
    const dayName = DAY_NAMES[dateObj.getDay()];
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();

    const formattedDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    const words = messageText.split(/\s+/).filter(Boolean);
    const urls = extractUrls(messageText);
    const emojis = extractEmojis(messageText);
    const sentiment = predictSentiment(messageText);

    messages.push({
      id: idCounter++,
      date: dateObj,
      dateStr: formattedDate,
      timeStr: formattedTime,
      year,
      month,
      monthNum,
      day,
      dayName,
      hour,
      minute,
      user,
      message: messageText,
      messageType,
      wordCount: words.length,
      charCount: messageText.length,
      hasMedia: messageType === "media",
      hasLinks: urls.length > 0,
      urls,
      emojis,
      sentiment: sentiment.label,
      sentimentScore: sentiment.score,
      emotion: sentiment.emotion,
      emotionConfidence: sentiment.emotionConfidence,
      arousal: sentiment.arousal,
      isSarcastic: sentiment.isSarcastic
    });
  }

  return messages;
}
