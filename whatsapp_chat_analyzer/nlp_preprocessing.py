"""
nlp_preprocessing.py
--------------------
Hinglish text cleaning helper for WhatsApp chat analysis.
Created for 3rd Year B.Tech Minor Project.

This module handles:
1. Converting text to lowercase
2. Removing URLs, mentions, and special symbols
3. Expanding common Hinglish chat abbreviations (e.g., 'plz' -> 'please', 'kr' -> 'kar')
4. Removing common stopwords so we get clean words for analysis
"""

import re

# Common chat slang mapping used in college WhatsApp groups
SLANG_MAP = {
    "kr": "kar",
    "kro": "karo",
    "rha": "raha",
    "rhi": "rahi",
    "h": "hai",
    "b": "bhi",
    "plz": "please",
    "pls": "please",
    "ty": "thank you",
    "thx": "thanks",
    "tc": "take care",
    "gm": "good morning",
    "gn": "good night",
    "btw": "by the way",
    "idk": "i don't know",
    "tbh": "to be honest",
    "bhai": "bhai",
    "yaar": "yaar",
    "mast": "mast",
    "badhiya": "badhiya",
    "accha": "accha",
    "sahi": "sahi",
}

# Stopwords list: standard English words + frequent Hindi filler words in Roman script
STOPWORDS = {
    # English fillers
    "a", "about", "above", "after", "again", "all", "am", "an", "and", "any", "are",
    "as", "at", "be", "because", "been", "before", "being", "below", "between",
    "both", "but", "by", "can", "did", "do", "does", "doing", "down", "during",
    "each", "few", "for", "from", "further", "had", "has", "have", "having", "he",
    "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if",
    "in", "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my",
    "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or",
    "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
    "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
    "themselves", "then", "there", "these", "they", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
    "where", "which", "while", "who", "whom", "why", "with", "you", "your", "yours",
    # Hinglish fillers
    "hai", "h", "kya", "ko", "se", "me", "mein", "bhi", "tha", "thi", "the", "ka",
    "ki", "ke", "aur", "to", "toh", "ha", "haan", "na", "ab", "yeh", "woh", "kar",
    "raha", "rahe", "rahi", "ho", "gaya", "gayi", "hoga", "wali", "wale", "kuch",
}


def clean_text(text):
    """
    Takes a raw chat message and returns a normalized, clean string.
    Useful for generating word clouds and word frequency counts.
    """
    if not isinstance(text, str):
        return ""

    # Step 1: Lowercase everything for uniform matching
    cleaned = text.lower()

    # Step 2: Remove URLs (links don't add semantic value to chat content)
    cleaned = re.sub(r"https?://\S+|www\.\S+", "", cleaned)

    # Step 3: Remove WhatsApp group mentions (e.g., @919876543210)
    cleaned = re.sub(r"@\w+", "", cleaned)

    # Step 4: Squeeze elongated characters (e.g., "sooooo" -> "so", "pleaaase" -> "please")
    cleaned = re.sub(r"(.)\1{2,}", r"\1\1", cleaned)

    # Step 5: Remove punctuation and special characters, keep letters and spaces
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)

    # Step 6: Tokenize by whitespace, normalize slang words, and filter stopwords
    words = cleaned.split()
    final_tokens = []
    for word in words:
        # Check if word is known slang
        normalized_word = SLANG_MAP.get(word, word)
        # Filter out stopwords and single-character stray letters
        if normalized_word not in STOPWORDS and len(normalized_word) > 1:
            final_tokens.append(normalized_word)

    return " ".join(final_tokens)


def tokenize_text(text):
    """Returns a list of clean tokens for frequency analysis."""
    return clean_text(text).split()


# Compatibility class so existing imports in helper scripts don't break
class HinglishTextPreprocessor:
    def __init__(self, **kwargs):
        pass

    def clean(self, text):
        return clean_text(text)

    def normalize(self, text):
        return clean_text(text)

    def tokenize(self, text):
        return tokenize_text(text)
