export type MessageType = 'text' | 'media' | 'deleted' | 'system';
export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export type EmotionType =
  | 'joy'
  | 'love_gratitude'
  | 'humor'
  | 'stress_urgency'
  | 'sadness'
  | 'anger_frustration'
  | 'neutral';

export interface ChatMessage {
  id: number;
  date: Date;
  dateStr: string;         // YYYY-MM-DD
  timeStr: string;         // HH:MM
  year: number;
  month: string;           // e.g. "May"
  monthNum: number;        // 1-12
  day: number;
  dayName: string;         // e.g. "Monday"
  hour: number;
  minute: number;
  user: string;            // Sender name or 'group_notification'
  message: string;
  messageType: MessageType;
  wordCount: number;
  charCount: number;
  hasMedia: boolean;
  hasLinks: boolean;
  urls: string[];
  emojis: string[];
  sentiment: SentimentLabel;
  sentimentScore: number;  // -1 to 1
  emotion: EmotionType;
  emotionConfidence: number; // 0 to 1
  arousal: 'low' | 'moderate' | 'high';
  isSarcastic?: boolean;
}

export interface OverviewStats {
  totalMessages: number;
  totalWords: number;
  totalMedia: number;
  totalLinks: number;
  totalUsers: number;
  avgMessageLength: number;
  mostActiveUser: string;
  busiestDay: string;
  busiestMonth: string;
  dateRange: { start: string; end: string };
}

export interface UserStats {
  user: string;
  messages: number;
  words: number;
  media: number;
  links: number;
  avgLength: number;
  percentage: number;
  mostActiveHour: number;
  mostActiveDay: string;
}

export interface ResponseLatency {
  medianMinutes: number;
  meanMinutes: number;
  fastestMinutes: number;
  slowestMinutes: number;
  sampleCount: number;
}

export interface UserLatencyStats {
  user: string;
  medianMinutes: number;
  meanMinutes: number;
  sampleCount: number;
}

export interface NightOwlStats {
  user: string;
  totalNightMessages: number;
  nightPercentage: number;
}

export interface ActivityStreak {
  user: string;
  currentStreak: number;
  longestStreak: number;
  longestStreakStart: string;
  longestStreakEnd: string;
}

export interface InteractionPair {
  userA: string;
  userB: string;
  repliesFromAToB: number;
  repliesFromBToA: number;
  totalInteractions: number;
}

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
}

export interface EmotionDistribution {
  joy: number;
  love_gratitude: number;
  humor: number;
  stress_urgency: number;
  sadness: number;
  anger_frustration: number;
  neutral: number;
  joyPct: number;
  lovePct: number;
  humorPct: number;
  stressPct: number;
  sadnessPct: number;
  angerPct: number;
  neutralPct: number;
  dominantEmotion: EmotionType;
}

export interface UserEmotionProfile {
  user: string;
  totalMessages: number;
  dominantEmotion: EmotionType;
  joyCount: number;
  loveCount: number;
  humorCount: number;
  stressCount: number;
  sadnessCount: number;
  angerCount: number;
  neutralCount: number;
  positivityScore: number; // 0 to 100
  archetype: string;
}

export interface HeatedExchange {
  id: string;
  timestamp: string;
  users: string[];
  triggerUser: string;
  messagePreview: string;
  severity: 'moderate' | 'high';
  reasons: string[];
}

export interface TokenAttribution {
  word: string;
  weight: number;
  category: 'positive' | 'negative' | 'stress' | 'humor' | 'love' | 'neutral';
}

export interface UserSentiment {
  user: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  positiveRatio: number;
}

export interface EmojiCount {
  emoji: string;
  count: number;
  percentage: number;
}

export interface WordFrequency {
  word: string;
  count: number;
}

export interface ModelComparisonData {
  dataset: {
    sources: Record<string, number>;
    total_rows: number;
    label_counts: Record<string, number>;
    disclaimer: string;
  };
  settings: {
    max_features: number;
    min_df: number;
    ngram_range: number[];
    test_size: number;
    random_state: number;
  };
  models: {
    [key: string]: {
      accuracy: number;
      precision_macro: number;
      recall_macro: number;
      f1_macro: number;
      confusion_matrix: number[][];
      labels: string[];
      classification_report: Record<string, any>;
      n_train: number;
      n_test: number;
    };
  };
  best_model: string;
}

export interface SavedAnalysisRecord {
  id: string;
  name: string;
  timestamp: string;
  messageCount: number;
  participants: string[];
  rawText: string;
}

export type ActionItemUrgency = 'High' | 'Medium' | 'Low';
export type ActionItemCategory = 'Deliverable' | 'Meeting' | 'Review' | 'Resource' | 'Task';
export type TaskTimelineCategory = 'pending' | 'upcoming' | 'past';

export interface ActionItem {
  id: string;
  messageId: number;
  speaker: string;
  assignee: string;
  taskText: string;
  originalMessage: string;
  detectedDeadline?: string;
  deadlineDateStr?: string;
  timelineCategory: TaskTimelineCategory;
  isDateDerived: boolean;
  urgency: ActionItemUrgency;
  category: ActionItemCategory;
  dateStr: string;
  timeStr: string;
  isCompleted: boolean;
  confidence: number;
  triggerPhrase: string;
}

export type FileCategory = 'pdf' | 'document' | 'presentation' | 'spreadsheet' | 'code' | 'cloud_drive' | 'media' | 'archive' | 'other';

export interface FileItem {
  id: string;
  messageId: number;
  fileName: string;
  fileExtension: string;
  category: FileCategory;
  sender: string;
  dateStr: string;
  timeStr: string;
  originalMessage: string;
  contextNote?: string;
  directUrl?: string;
  sizeEstimate?: string;
  matchScore?: number;
}

