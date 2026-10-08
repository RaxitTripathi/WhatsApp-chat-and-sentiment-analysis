import { ChatMessage } from '../types';

export interface AnonymizationResult {
  messages: ChatMessage[];
  userMap: Record<string, string>; // original -> alias
  stats: {
    usersAnonymized: number;
    phonesRedacted: number;
    emailsRedacted: number;
    upiRedacted: number;
  };
}

const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}|\b[6-9]\d{9}\b/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const UPI_REGEX = /\b[a-zA-Z0-9.\-_]{2,30}@(okhdfcbank|okaxis|oksbi|paytm|ybl|upi|ibl|axisbank|icici|postbank)\b/gi;

export function anonymizeChatData(messages: ChatMessage[]): AnonymizationResult {
  // 1. Build deterministic alias mapping
  const uniqueUsers: string[] = [];
  for (const m of messages) {
    if (m.user !== 'group_notification' && !uniqueUsers.includes(m.user)) {
      uniqueUsers.push(m.user);
    }
  }

  const userMap: Record<string, string> = {};
  uniqueUsers.forEach((u, index) => {
    // If name is already a phone number, redact it clearly
    if (/^\+?\d[\d\s-]{7,}$/.test(u)) {
      userMap[u] = `Participant ${index + 1} (Masked Phone)`;
    } else {
      userMap[u] = `Participant ${index + 1} (P${index + 1})`;
    }
  });

  let phonesRedacted = 0;
  let emailsRedacted = 0;
  let upiRedacted = 0;

  // 2. Clone and redact messages
  const anonymizedMessages: ChatMessage[] = messages.map(m => {
    if (m.user === 'group_notification') {
      return { ...m };
    }

    const newSender = userMap[m.user] || m.user;
    let newText = m.message;

    // Mask Phone numbers
    newText = newText.replace(PHONE_REGEX, (match) => {
      // Don't redact simple 3-4 digit counts or timestamps
      if (match.replace(/\D/g, '').length >= 7) {
        phonesRedacted++;
        return '[PHONE_REDACTED]';
      }
      return match;
    });

    // Mask Emails
    newText = newText.replace(EMAIL_REGEX, () => {
      emailsRedacted++;
      return '[EMAIL_REDACTED]';
    });

    // Mask UPI handles
    newText = newText.replace(UPI_REGEX, () => {
      upiRedacted++;
      return '[UPI_REDACTED]';
    });

    // Replace mentioned participant names in the text
    for (const [origName, alias] of Object.entries(userMap)) {
      if (origName.length > 2) {
        const nameRegex = new RegExp(`\\b${origName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        newText = newText.replace(nameRegex, alias);
      }
    }

    return {
      ...m,
      user: newSender,
      message: newText,
      // Recalculate word/char count
      wordCount: newText.trim().split(/\s+/).filter(Boolean).length,
      charCount: newText.length
    };
  });

  return {
    messages: anonymizedMessages,
    userMap,
    stats: {
      usersAnonymized: uniqueUsers.length,
      phonesRedacted,
      emailsRedacted,
      upiRedacted
    }
  };
}
