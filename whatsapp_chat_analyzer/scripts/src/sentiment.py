"""
sentiment.py
------------
Sentiment analysis helper functions for WhatsApp chat analyzer.
Student Minor Project - Phase 2 Review.

NOTE FOR REVIEW 2:
The machine learning pipeline (TF-IDF + Scikit-Learn classifiers) is currently
being fine-tuned for Hinglish chat data and will be integrated in Phase 3.
For Review 2, this module provides safe placeholder functions and baseline
stats to prevent runtime crashes during UI testing.
"""

import os
from collections import Counter
import pandas as pd
import plotly.express as px

DISCLAIMER = (
    "Sentiment classification is an ML-based estimate and may be inaccurate "
    "for sarcasm, context-dependent Hinglish slang, and multi-turn conversations."
)

LABEL_ORDER = ["positive", "neutral", "negative"]
LABEL_COLORS = {"positive": "#25D366", "neutral": "#9CA3AF", "negative": "#F87171"}

# Simple positive and negative keyword sets for baseline testing
POS_WORDS = {
    "good", "great", "awesome", "amazing", "happy", "love", "thanks", "thank",
    "nice", "mast", "badhiya", "accha", "khush", "best", "super", "perfect",
    "sahi", "zabardast", "congrats", "congratulations", "yay"
}

NEG_WORDS = {
    "bad", "sad", "angry", "hate", "annoying", "worst", "terrible", "horrible",
    "upset", "disappointed", "stress", "tired", "boring", "bura", "ganda",
    "ghatiya", "bakwas", "faltu", "pareshan", "tension", "gussa", "naraz"
}


def available_models():
    """
    Returns available models. For Review 2, displays the Phase 3 status.
    """
    return {
        "Phase 3 Pipeline (Under Fine-Tuning)": "__stub__",
        "Keyword Lexicon Fallback": "__lexicon__"
    }


def predict_single_with_confidence(message, model_path=None):
    """
    Predicts sentiment for a single message using simple keyword rule-matching
    as a safe fallback until ML training is finalized for Phase 3.
    """
    if not message or not isinstance(message, str):
        return "neutral", {"positive": 0.33, "neutral": 0.34, "negative": 0.33}

    text_lower = message.lower()
    words = set(text_lower.split())

    pos_count = len(words.intersection(POS_WORDS))
    neg_count = len(words.intersection(NEG_WORDS))

    if pos_count > neg_count:
        return "positive", {"positive": 0.70, "neutral": 0.20, "negative": 0.10}
    elif neg_count > pos_count:
        return "negative", {"positive": 0.10, "neutral": 0.20, "negative": 0.70}
    else:
        return "neutral", {"positive": 0.20, "neutral": 0.60, "negative": 0.20}


def predict_messages(messages, model_path=None):
    """
    Classifies a list of messages. Kept simple and safe for Review 2.
    """
    results = []
    for msg in messages:
        label, _ = predict_single_with_confidence(msg, model_path)
        results.append(label)
    return results


def overall_sentiment_stats(sentiment_labels):
    """Calculates overall percentage breakdown of sentiment labels."""
    total = len(sentiment_labels)
    if total == 0:
        return {
            "total": 0,
            "counts": {"positive": 0, "neutral": 0, "negative": 0},
            "percentages": {"positive": 0.0, "neutral": 0.0, "negative": 0.0},
            "label_order": LABEL_ORDER,
        }

    counts = Counter(sentiment_labels)
    percentages = {
        label: round((counts.get(label, 0) / total) * 100, 1)
        for label in LABEL_ORDER
    }

    return {
        "total": total,
        "counts": {label: counts.get(label, 0) for label in LABEL_ORDER},
        "percentages": percentages,
        "label_order": LABEL_ORDER,
    }


def fig_sentiment_distribution(sentiment_labels):
    """Generates a simple donut chart for sentiment distribution."""
    stats = overall_sentiment_stats(sentiment_labels)
    data = pd.DataFrame([
        {"Sentiment": label.capitalize(), "Count": stats["counts"][label]}
        for label in stats["label_order"]
    ])
    fig = px.pie(
        data,
        names="Sentiment",
        values="Count",
        title="Sentiment Polarity Breakdown",
        hole=0.4,
        color="Sentiment",
        color_discrete_map={
            "Positive": "#25D366",
            "Neutral": "#9CA3AF",
            "Negative": "#F87171",
        },
    )
    return fig


def user_sentiment_stats(df):
    """Aggregates sentiment count by user."""
    if "sentiment" not in df.columns or df.empty:
        return pd.DataFrame(columns=["user", "positive", "neutral", "negative", "total"])

    records = []
    for user, group in df.groupby("user"):
        if user == "group_notification":
            continue
        counts = Counter(group["sentiment"])
        records.append({
            "user": user,
            "positive": counts.get("positive", 0),
            "neutral": counts.get("neutral", 0),
            "negative": counts.get("negative", 0),
            "total": len(group),
        })
    return pd.DataFrame(records)


def fig_user_sentiment_comparison(df):
    """Stacked bar chart comparing participant sentiments."""
    user_df = user_sentiment_stats(df)
    if user_df.empty:
        return px.bar(title="No User Data Available")
    
    long_df = user_df.melt(
        id_vars=["user", "total"],
        value_vars=["positive", "neutral", "negative"],
        var_name="sentiment",
        value_name="count"
    )
    fig = px.bar(
        long_df,
        x="user",
        y="count",
        color="sentiment",
        title="Sentiment by Participant",
        barmode="stack",
        color_discrete_map=LABEL_COLORS
    )
    return fig


def sentiment_timeline(df):
    """Daily sentiment aggregation over time."""
    if "sentiment" not in df.columns or df.empty:
        return pd.DataFrame()
    daily = df.groupby(["only_date", "sentiment"]).size().unstack(fill_value=0).reset_index()
    return daily


def fig_sentiment_timeline(df):
    """Line chart of sentiment over time."""
    daily = sentiment_timeline(df)
    if daily.empty:
        return px.line(title="No Timeline Data Available")
    fig = px.line(
        daily,
        x="only_date",
        y=[col for col in ["positive", "neutral", "negative"] if col in daily.columns],
        title="Sentiment Polarity Over Time",
        labels={"value": "Message Count", "only_date": "Date"},
        color_discrete_map=LABEL_COLORS
    )
    return fig
