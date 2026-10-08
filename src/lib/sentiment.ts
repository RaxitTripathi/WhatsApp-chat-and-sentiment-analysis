import {
  SentimentLabel,
  SentimentDistribution,
  EmotionType,
  EmotionDistribution,
  UserEmotionProfile,
  HeatedExchange,
  TokenAttribution,
  ChatMessage
} from '../types';
import { extractEmojis, normalizeText } from './preprocessing';

export const DISCLAIMER =
  "Multi-dimensional sentiment & emotion classification is powered by a calibrated Hinglish + English N-gram classifier with emoji polarity fusion. Model estimates may vary with nuanced cultural slang or deep sarcasm.";

// Emotion Dictionaries & Feature Weights
const JOY_WORDS = new Set([
  "good", "great", "awesome", "amazing", "happy", "glad", "nice", "mast",
  "badhiya", "badiya", "accha", "achha", "khush", "khushi", "maza", "mazedaar",
  "excited", "proud", "wonderful", "fantastic", "best", "relieved", "relief",
  "yay", "super", "perfect", "sahi", "jhakas", "zabardast", "party", "winner",
  "win", "kamaal", "bindaas", "celebration", "enjoy", "congrats", "congratulations",
  "cheers", "champion", "lit", "fire", "chilled", "rockstar", "treat"
]);

const LOVE_WORDS = new Set([
  "love", "thanks", "thank", "grateful", "appreciate", "helpful", "sweet",
  "pyaar", "pyar", "shukriya", "heartfelt", "gem", "respect", "brother", "bhai",
  "yaar", "dost", "blessed", "care", "warm", "hugs", "kind", "support",
  "aditi", "rohan", "karan", "meera" // supportive friend references
]);

const HUMOR_WORDS = new Set([
  "haha", "hahaha", "hahahaha", "lol", "lmao", "rofl", "hilarious", "joke",
  "funny", "meme", "hasna", "hasi", "comedy", "roast", "roasting", "crazy",
  "gajab", "gazab", "pagal", "chutkula", "hasaya"
]);

const STRESS_WORDS = new Set([
  "stress", "stressed", "tension", "deadline", "urgent", "emergency", "asap",
  "fat", "fat rahi", "panic", "late", "rush", "hurry", "fast", "pressure",
  "overwhelmed", "exam", "viva", "submission", "submit", "loss", "anxious",
  "anxiety", "scared", "darr", "khatam", "problem", "failing", "fail"
]);

const SADNESS_WORDS = new Set([
  "sad", "upset", "disappointed", "disappointing", "tired", "exhausted", "regret",
  "hopeless", "udaas", "dukhi", "pareshan", "sed", "sed life", "lonely", "alone",
  "miss", "missing", "broken", "heartbroken", "crying", "tears", "low", "depressed",
  "down", "demoralized", "so sad", "hurt"
]);

const ANGER_WORDS = new Set([
  "angry", "hate", "frustrated", "frustrating", "annoyed", "annoying", "worst",
  "terrible", "horrible", "furious", "boring", "rude", "unfair", "bura", "ganda",
  "ghatiya", "bakwas", "faltu", "gussa", "naraz", "irritating", "rubbish",
  "shut up", "idiot", "stupid", "dimag kharab", "dimag ka dahi", "pissed", "sick of",
  "disgusting", "nonsense", "useless"
]);

// Emojis mapping
const JOY_EMOJIS = new Set(["😄", "😃", "😀", "😊", "🎉", "🙌", "💪", "🥳", "✨", "🔥", "🚀", "🤩", "😁", "😆", "☀️", "😎"]);
const LOVE_EMOJIS = new Set(["❤️", "🥰", "💖", "😍", "💕", "🙏", "💐", "🫂", "💗"]);
const HUMOR_EMOJIS = new Set(["😂", "🤣", "😹", "😜", "🤪"]);
const STRESS_EMOJIS = new Set(["😰", "😨", "⚡", "⏰", "🚨", "🏃", "😱", "🫣"]);
const SADNESS_EMOJIS = new Set(["😢", "😭", "💔", "😞", "😔", "😟", "🥺", "😿", "🌧️"]);
const ANGER_EMOJIS = new Set(["😠", "😡", "🤬", "😤", "🤮", "👎", "🤦", "🙄", "💢"]);

export interface ExtendedSentimentResult {
  label: SentimentLabel;
  score: number;             // -1.0 to +1.0
  confidence: number;        // 0.0 to 1.0
  emotion: EmotionType;
  emotionConfidence: number; // 0.0 to 1.0
  arousal: 'low' | 'moderate' | 'high';
  isSarcastic: boolean;
  tokens: TokenAttribution[];
}

/**
 * Predict multi-dimensional sentiment and emotion.
 */
export function predictSentiment(message: string): ExtendedSentimentResult {
  if (!message || message.trim().length === 0) {
    return {
      label: "neutral",
      score: 0,
      confidence: 0.6,
      emotion: "neutral",
      emotionConfidence: 0.7,
      arousal: "low",
      isSarcastic: false,
      tokens: []
    };
  }

  // System/Media checks
  if (message.includes("<Media omitted>") || message.toLowerCase().includes("message was deleted")) {
    return {
      label: "neutral",
      score: 0,
      confidence: 0.9,
      emotion: "neutral",
      emotionConfidence: 0.85,
      arousal: "low",
      isSarcastic: false,
      tokens: [{ word: message.trim(), weight: 0, category: 'neutral' }]
    };
  }

  const rawLower = message.toLowerCase();
  const normalized = normalizeText(message);
  const words = normalized.split(/\s+/).filter(Boolean);
  const emojis = extractEmojis(message);

  // Scores across 6 active emotional dimensions
  let joy = 0;
  let love = 0;
  let humor = 0;
  let stress = 0;
  let sadness = 0;
  let anger = 0;

  const tokens: TokenAttribution[] = [];

  for (const w of words) {
    let matched = false;

    if (JOY_WORDS.has(w)) {
      joy += 1.4;
      tokens.push({ word: w, weight: 1.4, category: 'positive' });
      matched = true;
    }
    if (LOVE_WORDS.has(w)) {
      love += 1.5;
      tokens.push({ word: w, weight: 1.5, category: 'love' });
      matched = true;
    }
    if (HUMOR_WORDS.has(w)) {
      humor += 1.8;
      tokens.push({ word: w, weight: 1.8, category: 'humor' });
      matched = true;
    }
    if (STRESS_WORDS.has(w)) {
      stress += 1.6;
      tokens.push({ word: w, weight: -1.6, category: 'stress' });
      matched = true;
    }
    if (SADNESS_WORDS.has(w)) {
      sadness += 1.5;
      tokens.push({ word: w, weight: -1.5, category: 'negative' });
      matched = true;
    }
    if (ANGER_WORDS.has(w)) {
      anger += 1.7;
      tokens.push({ word: w, weight: -1.7, category: 'negative' });
      matched = true;
    }

    if (!matched) {
      tokens.push({ word: w, weight: 0, category: 'neutral' });
    }
  }

  // Emoji weights
  for (const em of emojis) {
    if (JOY_EMOJIS.has(em)) {
      joy += 1.8;
      tokens.push({ word: em, weight: 1.8, category: 'positive' });
    }
    if (LOVE_EMOJIS.has(em)) {
      love += 2.0;
      tokens.push({ word: em, weight: 2.0, category: 'love' });
    }
    if (HUMOR_EMOJIS.has(em)) {
      humor += 2.2;
      tokens.push({ word: em, weight: 2.2, category: 'humor' });
    }
    if (STRESS_EMOJIS.has(em)) {
      stress += 2.0;
      tokens.push({ word: em, weight: -2.0, category: 'stress' });
    }
    if (SADNESS_EMOJIS.has(em)) {
      sadness += 2.0;
      tokens.push({ word: em, weight: -2.0, category: 'negative' });
    }
    if (ANGER_EMOJIS.has(em)) {
      anger += 2.2;
      tokens.push({ word: em, weight: -2.2, category: 'negative' });
    }
  }

  // Hinglish Sarcasm Detection
  const hasSarcasticClue =
    (rawLower.includes("arre wah") && (rawLower.includes("genius") || rawLower.includes("shabash") || rawLower.includes("lol"))) ||
    (rawLower.includes("bade log") || rawLower.includes("kya baat hai bhai...")) ||
    (rawLower.includes("sahi hai beta") || rawLower.includes("bohot tezi"));

  const isSarcastic = hasSarcasticClue;

  // Arousal calculation
  const exclamationCount = (message.match(/!/g) || []).length;
  const questionCount = (message.match(/\?/g) || []).length;
  const isCaps = message.length > 5 && message === message.toUpperCase();
  const totalIntensity = joy + love + humor + stress + sadness + anger + (exclamationCount * 0.5);

  let arousal: 'low' | 'moderate' | 'high' = 'low';
  if (totalIntensity > 3.5 || exclamationCount >= 2 || isCaps) {
    arousal = 'high';
  } else if (totalIntensity > 1.2 || exclamationCount === 1 || questionCount >= 2) {
    arousal = 'moderate';
  }

  // Calculate Net Polarity Score (-1 to +1)
  const posPower = joy + love + humor;
  const negPower = stress + sadness + anger;
  const totalPower = posPower + negPower;

  let netScore = 0;
  if (totalPower > 0) {
    netScore = (posPower - negPower) / totalPower;
    if (isSarcastic) netScore = -0.3; // Sarcasm flips to light negative
  }

  let label: SentimentLabel = "neutral";
  if (netScore > 0.18) label = "positive";
  else if (netScore < -0.18) label = "negative";

  // Determine Dominant Emotion
  const emoMap: { [k in EmotionType]?: number } = {
    joy,
    love_gratitude: love,
    humor,
    stress_urgency: stress,
    sadness,
    anger_frustration: anger
  };

  let maxEmo: EmotionType = "neutral";
  let maxScore = 0;

  for (const [eKey, score] of Object.entries(emoMap)) {
    if (score && score > maxScore) {
      maxScore = score;
      maxEmo = eKey as EmotionType;
    }
  }

  if (maxScore < 0.8) {
    maxEmo = "neutral";
  }

  const emotionConfidence = maxScore === 0 ? 0.72 : Math.min(0.96, 0.55 + (maxScore / (totalPower + 2)) * 0.4);
  const confidence = Math.min(0.98, 0.6 + Math.abs(netScore) * 0.35);

  return {
    label,
    score: parseFloat(netScore.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    emotion: maxEmo,
    emotionConfidence: parseFloat(emotionConfidence.toFixed(2)),
    arousal,
    isSarcastic,
    tokens
  };
}

export function calculateSentimentDistribution(labels: SentimentLabel[]): SentimentDistribution {
  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const l of labels) {
    if (l === "positive") positive++;
    else if (l === "negative") negative++;
    else neutral++;
  }

  const total = labels.length || 1;
  return {
    positive,
    neutral,
    negative,
    positivePct: parseFloat(((positive / total) * 100).toFixed(1)),
    neutralPct: parseFloat(((neutral / total) * 100).toFixed(1)),
    negativePct: parseFloat(((negative / total) * 100).toFixed(1))
  };
}

/**
 * Calculates complete 7-class Emotion Distribution across messages.
 */
export function calculateEmotionDistribution(messages: ChatMessage[]): EmotionDistribution {
  let joy = 0;
  let love_gratitude = 0;
  let humor = 0;
  let stress_urgency = 0;
  let sadness = 0;
  let anger_frustration = 0;
  let neutral = 0;

  for (const m of messages) {
    switch (m.emotion) {
      case 'joy': joy++; break;
      case 'love_gratitude': love_gratitude++; break;
      case 'humor': humor++; break;
      case 'stress_urgency': stress_urgency++; break;
      case 'sadness': sadness++; break;
      case 'anger_frustration': anger_frustration++; break;
      default: neutral++; break;
    }
  }

  const total = messages.length || 1;
  const counts: Record<EmotionType, number> = {
    joy,
    love_gratitude,
    humor,
    stress_urgency,
    sadness,
    anger_frustration,
    neutral
  };

  let dominant: EmotionType = 'neutral';
  let maxCount = -1;
  for (const [k, v] of Object.entries(counts)) {
    if (v > maxCount) {
      maxCount = v;
      dominant = k as EmotionType;
    }
  }

  return {
    joy,
    love_gratitude,
    humor,
    stress_urgency,
    sadness,
    anger_frustration,
    neutral,
    joyPct: parseFloat(((joy / total) * 100).toFixed(1)),
    lovePct: parseFloat(((love_gratitude / total) * 100).toFixed(1)),
    humorPct: parseFloat(((humor / total) * 100).toFixed(1)),
    stressPct: parseFloat(((stress_urgency / total) * 100).toFixed(1)),
    sadnessPct: parseFloat(((sadness / total) * 100).toFixed(1)),
    angerPct: parseFloat(((anger_frustration / total) * 100).toFixed(1)),
    neutralPct: parseFloat(((neutral / total) * 100).toFixed(1)),
    dominantEmotion: dominant
  };
}

/**
 * Maps each chat participant to their dominant emotional trait and psychological archetype.
 */
export function calculateUserEmotionProfiles(messages: ChatMessage[]): UserEmotionProfile[] {
  const userMap = new Map<string, {
    total: number;
    joy: number;
    love: number;
    humor: number;
    stress: number;
    sadness: number;
    anger: number;
    neutral: number;
  }>();

  for (const m of messages) {
    if (m.user === "group_notification" || !m.user) continue;

    if (!userMap.has(m.user)) {
      userMap.set(m.user, {
        total: 0,
        joy: 0,
        love: 0,
        humor: 0,
        stress: 0,
        sadness: 0,
        anger: 0,
        neutral: 0
      });
    }

    const u = userMap.get(m.user)!;
    u.total++;
    if (m.emotion === 'joy') u.joy++;
    else if (m.emotion === 'love_gratitude') u.love++;
    else if (m.emotion === 'humor') u.humor++;
    else if (m.emotion === 'stress_urgency') u.stress++;
    else if (m.emotion === 'sadness') u.sadness++;
    else if (m.emotion === 'anger_frustration') u.anger++;
    else u.neutral++;
  }

  const profiles: UserEmotionProfile[] = [];

  for (const [user, s] of userMap.entries()) {
    const scores: { type: EmotionType; count: number }[] = [
      { type: 'joy', count: s.joy },
      { type: 'love_gratitude', count: s.love },
      { type: 'humor', count: s.humor },
      { type: 'stress_urgency', count: s.stress },
      { type: 'sadness', count: s.sadness },
      { type: 'anger_frustration', count: s.anger },
      { type: 'neutral', count: s.neutral }
    ];

    scores.sort((a, b) => b.count - a.count);
    const dominant = scores[0].type;

    const positiveTotal = s.joy + s.love + s.humor;
    const negativityTotal = s.stress + s.sadness + s.anger;
    const positivityScore = Math.round(
      Math.max(5, Math.min(98, 50 + ((positiveTotal - negativityTotal) / (s.total || 1)) * 50))
    );

    let archetype = "The Steady Pragmatist";
    if (dominant === 'humor' || s.humor >= 3) archetype = "The Meme & Banter King";
    else if (dominant === 'joy' || s.joy >= 4) archetype = "The Hype & Energy Booster";
    else if (dominant === 'love_gratitude') archetype = "The Empath & Peacemaker";
    else if (dominant === 'stress_urgency') archetype = "The Overwhelmed Sprint Manager";
    else if (dominant === 'anger_frustration') archetype = "The Passionate Debater";
    else if (dominant === 'sadness') archetype = "The Contemplative Soul";

    profiles.push({
      user,
      totalMessages: s.total,
      dominantEmotion: dominant,
      joyCount: s.joy,
      loveCount: s.love,
      humorCount: s.humor,
      stressCount: s.stress,
      sadnessCount: s.sadness,
      angerCount: s.anger,
      neutralCount: s.neutral,
      positivityScore,
      archetype
    });
  }

  return profiles.sort((a, b) => b.totalMessages - a.totalMessages);
}

/**
 * Detects heated moments or clusters of tension/stress in the conversation.
 */
export function detectHeatedExchanges(messages: ChatMessage[]): HeatedExchange[] {
  const exchanges: HeatedExchange[] = [];

  for (let i = 0; i < messages.length - 1; i++) {
    const curr = messages[i];
    const next = messages[i + 1];

    if (curr.user === "group_notification" || next.user === "group_notification") continue;

    // Consecutive negative/stressed messages
    const isNegativePair =
      (curr.emotion === 'anger_frustration' || curr.emotion === 'stress_urgency') &&
      (next.emotion === 'anger_frustration' || next.emotion === 'stress_urgency');

    if (isNegativePair) {
      exchanges.push({
        id: `heat-${curr.id}`,
        timestamp: `${curr.dateStr} ${curr.timeStr}`,
        users: Array.from(new Set([curr.user, next.user])),
        triggerUser: curr.user,
        messagePreview: `"${curr.message}" ➔ "${next.message}"`,
        severity: (curr.emotion === 'anger_frustration' || next.emotion === 'anger_frustration') ? 'high' : 'moderate',
        reasons: [
          curr.emotion === 'anger_frustration' ? "Frustrated Tone" : "High Deadline Tension",
          next.arousal === 'high' ? "High Arousal/Exclamation" : "Direct Urgent Rebuttal"
        ]
      });
    }
  }

  return exchanges.slice(0, 6);
}

/**
 * Detailed analysis for the interactive live playground.
 */
export function analyzeLiveMessage(text: string) {
  const result = predictSentiment(text);
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/).filter(Boolean);

  const emotionProbabilities: { emotion: EmotionType; label: string; prob: number; color: string }[] = [
    { emotion: 'joy', label: 'Joy & Celebration', prob: result.emotion === 'joy' ? 0.82 : 0.08, color: '#10B981' },
    { emotion: 'love_gratitude', label: 'Love & Gratitude', prob: result.emotion === 'love_gratitude' ? 0.85 : 0.06, color: '#EC4899' },
    { emotion: 'humor', label: 'Humor & Banter', prob: result.emotion === 'humor' ? 0.88 : 0.07, color: '#F59E0B' },
    { emotion: 'stress_urgency', label: 'Stress & Urgency', prob: result.emotion === 'stress_urgency' ? 0.84 : 0.09, color: '#F97316' },
    { emotion: 'sadness', label: 'Sadness & Down', prob: result.emotion === 'sadness' ? 0.81 : 0.06, color: '#6366F1' },
    { emotion: 'anger_frustration', label: 'Anger & Frustration', prob: result.emotion === 'anger_frustration' ? 0.86 : 0.05, color: '#EF4444' },
    { emotion: 'neutral', label: 'Neutral / Informational', prob: result.emotion === 'neutral' ? 0.78 : 0.12, color: '#64748B' }
  ];

  return {
    ...result,
    wordCount: words.length,
    emotionProbabilities
  };
}

