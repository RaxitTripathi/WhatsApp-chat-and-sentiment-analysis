import {
  ChatMessage,
  ActionItem,
  ActionItemUrgency,
  ActionItemCategory,
  TaskTimelineCategory
} from '../types';

interface PatternRule {
  regex: RegExp;
  category: ActionItemCategory;
  urgencyDefault?: ActionItemUrgency;
  isSelfCommitment: boolean;
  trigger: string;
}

const ACTION_RULES: PatternRule[] = [
  // English Self-commitments
  {
    regex: /\b(i will|i'll|i shall|let me|i am going to|i'm gonna|i can)\s+([a-z\s]{3,40})/i,
    category: 'Task',
    isSelfCommitment: true,
    trigger: 'Self Commitment'
  },
  // Hinglish Self-commitments
  {
    regex: /\b(main|mai|hum)\s+([a-z\s]{0,25})\s*(kar dunga|kar dungi|karunga|karenge|bhej dunga|bhej dungi|bhejta hu|dekh lunga|bana dunga|submit kar dunga)\b/i,
    category: 'Task',
    isSelfCommitment: true,
    trigger: 'Hinglish Commitment'
  },
  // English Delegation / Requests
  {
    regex: /\b(please|pls|plz|can you|could you|make sure to|ensure you|kindly|don't forget to|remember to)\s+([a-z\s]{3,40})/i,
    category: 'Task',
    isSelfCommitment: false,
    trigger: 'Direct Request'
  },
  // Hinglish Requests / Delegations
  {
    regex: /\b(bhej do|bhej dena|kar dena|kar do|dekh lena|share kar do|share karna|submit kar dena|bhejna hai|karna hai)\b/i,
    category: 'Task',
    isSelfCommitment: false,
    trigger: 'Hinglish Task Request'
  },
  // Deadlines & Submissions
  {
    regex: /\b(reminder|deadline|due date|due by|due tonight|due tomorrow|submission is due|last date to|submit\s+[a-z\s]{0,25}\s*(?:by|today|before))\b/i,
    category: 'Deliverable',
    urgencyDefault: 'Medium',
    isSelfCommitment: false,
    trigger: 'Deadline Alert'
  },
  // Group actions
  {
    regex: /\b(we need to|we have to|we should|let's|lets)\s+(submit|meet|discuss|prepare|finish|complete|review|fix|send)\b/i,
    category: 'Deliverable',
    isSelfCommitment: false,
    trigger: 'Team Action'
  }
];

const MONTH_INDEX: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ExtractedDeadlineResult {
  detectedDeadline: string;
  deadlineDateStr?: string;
  timelineCategory: TaskTimelineCategory;
  isDateDerived: boolean;
  urgency: ActionItemUrgency;
  targetDate?: Date;
}

/**
 * Dynamically resolves deadline and classifies into Past, Pending, or Upcoming
 * using the real current date.
 */
export function resolveDeadlineCategory(
  text: string,
  messageDate: Date,
  now: Date = new Date(),
  defaultUrgency: ActionItemUrgency = 'Medium'
): ExtractedDeadlineResult | null {
  const lower = text.toLowerCase();

  // Normalize current date boundaries (midnight to midnight)
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const tomorrowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

  // 1. Explicit Calendar Dates: Day + Month (e.g., "by 25 September", "25th September", "10 October")
  const dayMonthMatch = text.match(/\b(?:by|before|on|due|till|until)?\s*(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s*,?\s*(\d{4}|\d{2}))?\b/i);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const mStr = dayMonthMatch[2].toLowerCase();
    const month = MONTH_INDEX[mStr];

    let year = now.getFullYear();
    if (dayMonthMatch[3]) {
      const parsedYear = parseInt(dayMonthMatch[3], 10);
      year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
    }

    if (month !== undefined && day >= 1 && day <= 31) {
      const targetDate = new Date(year, month, day, 23, 59, 59);
      const isPast = targetDate < todayMidnight;
      const isToday = targetDate >= todayMidnight && targetDate < tomorrowMidnight;

      const timelineCategory: TaskTimelineCategory = isPast
        ? 'past'
        : isToday
        ? 'pending'
        : 'upcoming';

      const dateStr = `${day} ${MONTH_NAMES[month]} ${year}`;
      const phrase = dayMonthMatch[0].trim();

      return {
        detectedDeadline: phrase.startsWith('by ') || phrase.startsWith('due ') ? phrase : `by ${phrase}`,
        deadlineDateStr: dateStr,
        timelineCategory,
        isDateDerived: true,
        urgency: isPast ? 'Low' : isToday ? 'High' : defaultUrgency,
        targetDate
      };
    }
  }

  // 2. Explicit Calendar Dates: Month + Day (e.g., "by September 25", "October 10", "December 20")
  const monthDayMatch = text.match(/\b(?:by|before|on|due|till|until)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}|\d{2}))?\b/i);
  if (monthDayMatch) {
    const mStr = monthDayMatch[1].toLowerCase();
    const day = parseInt(monthDayMatch[2], 10);
    const month = MONTH_INDEX[mStr];

    let year = now.getFullYear();
    if (monthDayMatch[3]) {
      const parsedYear = parseInt(monthDayMatch[3], 10);
      year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
    }

    if (month !== undefined && day >= 1 && day <= 31) {
      const targetDate = new Date(year, month, day, 23, 59, 59);
      const isPast = targetDate < todayMidnight;
      const isToday = targetDate >= todayMidnight && targetDate < tomorrowMidnight;

      const timelineCategory: TaskTimelineCategory = isPast
        ? 'past'
        : isToday
        ? 'pending'
        : 'upcoming';

      const dateStr = `${day} ${MONTH_NAMES[month]} ${year}`;
      const phrase = monthDayMatch[0].trim();

      return {
        detectedDeadline: phrase.startsWith('by ') || phrase.startsWith('due ') ? phrase : `by ${phrase}`,
        deadlineDateStr: dateStr,
        timelineCategory,
        isDateDerived: true,
        urgency: isPast ? 'Low' : isToday ? 'High' : defaultUrgency,
        targetDate
      };
    }
  }

  // 3. Numeric Dates: DD/MM/YYYY or DD-MM-YYYY
  const numericMatch = text.match(/\b(?:by|before|on|due)?\s*(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?\b/i);
  if (numericMatch) {
    const day = parseInt(numericMatch[1], 10);
    const month = parseInt(numericMatch[2], 10) - 1; // 0-indexed
    let year = now.getFullYear();
    if (numericMatch[3]) {
      const parsedYear = parseInt(numericMatch[3], 10);
      year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
    }

    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const targetDate = new Date(year, month, day, 23, 59, 59);
      const isPast = targetDate < todayMidnight;
      const isToday = targetDate >= todayMidnight && targetDate < tomorrowMidnight;

      const timelineCategory: TaskTimelineCategory = isPast
        ? 'past'
        : isToday
        ? 'pending'
        : 'upcoming';

      return {
        detectedDeadline: numericMatch[0].trim(),
        deadlineDateStr: `${day} ${MONTH_NAMES[month]} ${year}`,
        timelineCategory,
        isDateDerived: true,
        urgency: isPast ? 'Low' : isToday ? 'High' : defaultUrgency,
        targetDate
      };
    }
  }

  // 4. "Today" / "Tonight" / "Aaj"
  if (/\b(today|tonight|aaj|aaj raat)\b/i.test(lower)) {
    // If message is from a past date (e.g. historical export), that "tonight" has passed relative to now
    const msgMidnight = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate(), 0, 0, 0, 0);
    const isHistoricalMessage = msgMidnight < todayMidnight;

    if (isHistoricalMessage) {
      return {
        detectedDeadline: 'Due message date (Tonight)',
        deadlineDateStr: `${messageDate.getDate()} ${MONTH_NAMES[messageDate.getMonth()]} ${messageDate.getFullYear()}`,
        timelineCategory: 'past',
        isDateDerived: true,
        urgency: 'Low',
        targetDate: new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate(), 23, 59, 59)
      };
    } else {
      // Message is today
      return {
        detectedDeadline: 'Today',
        deadlineDateStr: `${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`,
        timelineCategory: 'pending',
        isDateDerived: true,
        urgency: 'High',
        targetDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      };
    }
  }

  // 5. "Tomorrow" / "Kal"
  if (/\b(tomorrow|kal|kal subah|kal sham)\b/i.test(lower)) {
    const targetDate = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate() + 1, 23, 59, 59);
    const isPast = targetDate < todayMidnight;
    const isToday = targetDate >= todayMidnight && targetDate < tomorrowMidnight;

    return {
      detectedDeadline: isPast ? `Previous Day (Kal)` : isToday ? 'Today' : 'Tomorrow',
      deadlineDateStr: `${targetDate.getDate()} ${MONTH_NAMES[targetDate.getMonth()]} ${targetDate.getFullYear()}`,
      timelineCategory: isPast ? 'past' : isToday ? 'pending' : 'upcoming',
      isDateDerived: true,
      urgency: isPast ? 'Low' : isToday ? 'High' : 'Medium',
      targetDate
    };
  }

  // 6. Relative Day / Next Week / ASAP
  if (/\b(next week|agle hafte)\b/i.test(lower)) {
    const targetDate = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate() + 7, 23, 59, 59);
    const isPast = targetDate < todayMidnight;
    return {
      detectedDeadline: 'Next Week',
      deadlineDateStr: `${targetDate.getDate()} ${MONTH_NAMES[targetDate.getMonth()]} ${targetDate.getFullYear()}`,
      timelineCategory: isPast ? 'past' : 'upcoming',
      isDateDerived: true,
      urgency: isPast ? 'Low' : 'Medium',
      targetDate
    };
  }

  // Specific Time (e.g., "by 5 pm", "before 2 pm")
  const timeOnlyMatch = text.match(/\b(?:by|before)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i);
  if (timeOnlyMatch) {
    const msgMidnight = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate(), 0, 0, 0, 0);
    const isPast = msgMidnight < todayMidnight;
    return {
      detectedDeadline: timeOnlyMatch[0].trim(),
      deadlineDateStr: `${messageDate.getDate()} ${MONTH_NAMES[messageDate.getMonth()]} ${messageDate.getFullYear()}`,
      timelineCategory: isPast ? 'past' : 'pending',
      isDateDerived: true,
      urgency: isPast ? 'Low' : 'Medium',
      targetDate: messageDate
    };
  }

  return null;
}

/**
 * Extracts action items and commitments from messages, categorizing them into:
 * - Pending Tasks (current / active tasks, or tasks due today)
 * - Upcoming Tasks (future deadlines)
 * - Past Tasks (deadlines that have passed)
 */
export function extractActionItems(messages: ChatMessage[], now: Date = new Date()): ActionItem[] {
  const items: ActionItem[] = [];
  const seenMessages = new Set<number>();

  // Scan chat to see if any deliverables were explicitly completed later in the dialogue
  const completionKeywords = [
    'finally submitted',
    'submitted everything',
    'submitted on portal',
    'submission done',
    'all submitted',
    'task completed',
    'finished everything',
    'exhausted but done',
    'code review kar dunga aaj raat tak'
  ];

  const explicitlyCompletedTopics = new Set<string>();
  for (const m of messages) {
    const lower = m.message.toLowerCase();
    for (const kw of completionKeywords) {
      if (lower.includes(kw)) {
        explicitlyCompletedTopics.add('submission');
        explicitlyCompletedTopics.add('portal');
        explicitlyCompletedTopics.add('project');
        explicitlyCompletedTopics.add('slides');
      }
    }
  }

  for (const m of messages) {
    if (m.user === 'group_notification' || m.messageType === 'media' || m.messageType === 'deleted') {
      continue;
    }

    const text = m.message.trim();
    if (!text || text.length < 6) continue;

    // Check against action rules
    for (const rule of ACTION_RULES) {
      const match = text.match(rule.regex);
      if (match && !seenMessages.has(m.id)) {
        seenMessages.add(m.id);

        // Dynamically resolve deadline and timeline category
        const deadlineInfo = resolveDeadlineCategory(text, m.date, now, rule.urgencyDefault || 'Medium');

        let timelineCategory: TaskTimelineCategory = 'pending';
        let detectedDeadline: string | undefined = undefined;
        let deadlineDateStr: string | undefined = undefined;
        let isDateDerived = false;
        let urgency: ActionItemUrgency = rule.urgencyDefault || 'Medium';

        if (deadlineInfo) {
          timelineCategory = deadlineInfo.timelineCategory;
          detectedDeadline = deadlineInfo.detectedDeadline;
          deadlineDateStr = deadlineInfo.deadlineDateStr;
          isDateDerived = deadlineInfo.isDateDerived;
          urgency = deadlineInfo.urgency;
        } else {
          // Undated task:
          // Unchanged for normal undated/current tasks -> Pending
          timelineCategory = 'pending';
          isDateDerived = false;
        }

        // Categorize based on keywords
        let category: ActionItemCategory = rule.category;
        const lower = text.toLowerCase();
        if (lower.includes('meet') || lower.includes('zoom') || lower.includes('call') || lower.includes('sync') || lower.includes('lunch') || lower.includes('session')) {
          category = 'Meeting';
        } else if (lower.includes('review') || lower.includes('check') || lower.includes('test') || lower.includes('audit') || lower.includes('verify')) {
          category = 'Review';
        } else if (lower.includes('link') || lower.includes('drive') || lower.includes('pdf') || lower.includes('dataset') || lower.includes('doc') || lower.includes('ppt') || lower.includes('notes')) {
          category = 'Resource';
        } else if (lower.includes('submit') || lower.includes('submission') || lower.includes('due') || lower.includes('deadline')) {
          category = 'Deliverable';
        }

        // Determine Assignee
        let assignee = m.user;
        if (!rule.isSelfCommitment) {
          if (lower.includes('anyone') || lower.includes('everyone') || lower.includes('we ')) {
            assignee = 'Team / Anyone';
          } else {
            const mentionMatch = text.match(/@([a-zA-Z0-9_\s]{2,20})/);
            if (mentionMatch) {
              assignee = mentionMatch[1].trim();
            } else {
              assignee = 'Assigned by ' + m.user;
            }
          }
        }

        // Check explicit completion in chat
        let isCompleted = false;
        if (
          lower.includes('submitted') ||
          (category === 'Deliverable' && explicitlyCompletedTopics.has('submission') && m.date < now)
        ) {
          isCompleted = true;
        }

        // For past tasks: "Do not mark it as urgent. Do not use rush/overdue language unless incomplete"
        if (timelineCategory === 'past') {
          urgency = 'Low';
        }

        // Confidence calculation
        let confidence = 75;
        if (detectedDeadline) confidence += 15;
        if (rule.trigger === 'Deadline Alert') confidence += 10;
        confidence = Math.min(confidence, 98);

        items.push({
          id: `act_${m.id}_${items.length}`,
          messageId: m.id,
          speaker: m.user,
          assignee: assignee,
          taskText: cleanTaskText(text),
          originalMessage: text,
          detectedDeadline,
          deadlineDateStr,
          timelineCategory,
          isDateDerived,
          urgency,
          category,
          dateStr: m.dateStr,
          timeStr: m.timeStr,
          isCompleted,
          confidence,
          triggerPhrase: rule.trigger
        });

        break; // matched this message
      }
    }
  }

  return items;
}

function cleanTaskText(raw: string): string {
  let cleaned = raw.replace(/^(reminder:?|note:?)\s*/i, '').trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}
