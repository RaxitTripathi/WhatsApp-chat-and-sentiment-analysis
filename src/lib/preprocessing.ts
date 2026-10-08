/**
 * Hinglish & English NLP Preprocessing module.
 * Implements lightweight, dictionary- and regex-based normalization,
 * slang expansion, emoji extraction, stopword filtering, and tokenization.
 */

export const DEFAULT_SLANG_DICT: Record<string, string> = {
  kr: "kar",
  kro: "karo",
  kya: "kya",
  rha: "raha",
  rhi: "rahi",
  rhe: "rahe",
  h: "hai",
  hn: "haan",
  ha: "haan",
  b: "bhi",
  yr: "yaar",
  pls: "please",
  plz: "please",
  thx: "thanks",
  thnx: "thanks",
  ty: "thank you",
  np: "no problem",
  ngl: "not gonna lie",
  tbh: "to be honest",
  imo: "in my opinion",
  bc: "because",
  bcz: "because",
  n: "and",
  u: "you",
  ur: "your",
  r: "are",
  msg: "message",
  pic: "picture",
  bro: "brother",
  bhai: "brother",
  mast: "mast",
  badhiya: "badhiya",
  achha: "accha"
};

export const DEFAULT_HINGLISH_STOPWORDS = new Set([
  // English common stopwords
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down",
  "during", "each", "few", "for", "from", "further", "had", "has", "have",
  "having", "he", "her", "here", "hers", "herself", "him", "himself", "his",
  "how", "i", "if", "in", "into", "is", "it", "its", "itself", "me", "more",
  "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only",
  "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "she", "should", "so", "some", "such", "than", "that", "the", "their",
  "theirs", "them", "themselves", "then", "there", "these", "they", "this",
  "those", "through", "to", "too", "under", "until", "up", "very", "was", "we",
  "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with",
  "would", "you", "your", "yours", "yourself", "yourselves",
  // Common Hinglish stopwords / particles
  "hai", "hain", "ko", "ki", "ka", "ke", "se", "ne", "me", "mein", "par",
  "bhi", "aur", "ya", "toh", "to", "ye", "yeh", "wo", "woh", "kya", "kyu",
  "kyun", "kaha", "kahan", "kab", "kaise", "kisko", "kiska", "kuch", "sab",
  "apna", "apne", "apni", "mera", "meri", "mere", "tera", "teri", "tere",
  "hum", "hume", "humne", "unka", "unki", "unke", "unhe", "unhone", "is",
  "isi", "usi", "jab", "tab", "ab", "phir", "fir", "baad", "pehle", "kar",
  "raha", "rahe", "rahi", "karo", "karna", "tha", "thi", "the", "hoga",
  "hogi", "hoge", "batao", "bolo", "dekh", "dekho", "chal", "chalo", "yaar"
]);

// URL regex
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
// Mention regex
const MENTION_REGEX = /@[\w]+/g;
// Repeated characters (3+ in a row)
const REPEATED_CHAR_REGEX = /(.)\1{2,}/g;

// Emoji regex pattern covering standard Unicode emoji blocks
const EMOJI_REGEX = /[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2B50}\u{23E9}-\u{23EC}\u{200D}\u{FE0F}]/gu;

export function extractEmojis(text: string): string[] {
  if (!text) return [];
  const matches = text.match(EMOJI_REGEX);
  return matches || [];
}

export function extractUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(URL_REGEX);
  return matches || [];
}

export function extractMentions(text: string): string[] {
  if (!text) return [];
  const matches = text.match(MENTION_REGEX);
  return matches || [];
}

/**
 * Normalizes raw text:
 * 1. Lowercase
 * 2. Strip URLs and @mentions
 * 3. Contract repeated letters (e.g. "sooooo" -> "soo")
 * 4. Expand chat slang
 * 5. Strip punctuation (preserving words & numbers)
 */
export function normalizeText(text: string, slangDict: Record<string, string> = DEFAULT_SLANG_DICT): string {
  if (!text) return "";
  let clean = text.toLowerCase();

  // Remove URLs
  clean = clean.replace(URL_REGEX, " ");
  // Remove mentions
  clean = clean.replace(MENTION_REGEX, " ");
  // Collapse repeated chars (e.g. "loool" -> "lool")
  clean = clean.replace(REPEATED_CHAR_REGEX, "$1$1");
  // Remove apostrophes
  clean = clean.replace(/['’]/g, "");

  // Remove non-word punctuation
  clean = clean.replace(/[^\w\s]/g, " ");

  // Expand slang
  const words = clean.split(/\s+/).filter(Boolean);
  const expanded = words.map(w => slangDict[w] || w);

  return expanded.join(" ");
}

/**
 * Tokenize text into words, filtering out stopwords and numbers/short tokens.
 */
export function tokenizeText(
  text: string,
  stopwords: Set<string> = DEFAULT_HINGLISH_STOPWORDS,
  slangDict: Record<string, string> = DEFAULT_SLANG_DICT
): string[] {
  const normalized = normalizeText(text, slangDict);
  if (!normalized) return [];

  return normalized
    .split(/\s+/)
    .filter(token => token.length > 1 && !stopwords.has(token) && !/^\d+$/.test(token));
}

/**
 * Clean text to a stopword-free string representation.
 */
export function cleanText(
  text: string,
  stopwords: Set<string> = DEFAULT_HINGLISH_STOPWORDS,
  slangDict: Record<string, string> = DEFAULT_SLANG_DICT
): string {
  return tokenizeText(text, stopwords, slangDict).join(" ");
}
