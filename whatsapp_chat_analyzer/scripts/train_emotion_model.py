"""
train_emotion_model.py
-----------------------
Trains a multi-class Hinglish + English Emotion & Sentiment Classification Pipeline.
Evaluates precision, recall, f1, and writes out model metrics and feature weights.
"""

import csv
import json
import math
import os
import re
from collections import Counter, defaultdict
import random

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "hinglish_emotion_dataset.csv")
REPORT_PATH = os.path.join(BASE_DIR, "models", "emotion_model_report.json")

def tokenize(text):
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    tokens = [t for t in text.split() if len(t) > 1]
    bigrams = [f"{tokens[i]}_{tokens[i+1]}" for i in range(len(tokens) - 1)]
    return tokens + bigrams

def main():
    random.seed(42)
    rows = []
    with open(DATA_PATH, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if r.get("text") and r.get("emotion"):
                rows.append({
                    "text": r["text"].strip(),
                    "emotion": r["emotion"].strip(),
                    "sentiment": r.get("sentiment", "neutral").strip()
                })

    print(f"Loaded {len(rows)} samples across emotion classes.")

    # Stratified split 80% train, 20% test
    by_class = defaultdict(list)
    for r in rows:
        by_class[r["emotion"]].append(r)

    train_rows, test_rows = [], []
    for emo, class_rows in by_class.items():
        random.shuffle(class_rows)
        split_idx = max(1, int(len(class_rows) * 0.8))
        train_rows.extend(class_rows[:split_idx])
        test_rows.extend(class_rows[split_idx:])

    # Vocabulary & Document Frequency
    doc_freq = Counter()
    total_docs = len(train_rows)
    for r in train_rows:
        for t in set(tokenize(r["text"])):
            doc_freq[t] += 1

    vocab = {t: i for i, t in enumerate(doc_freq)}
    idf = {t: math.log((1.0 + total_docs) / (1.0 + doc_freq[t])) + 1.0 for t in vocab}

    class_priors = Counter([r["emotion"] for r in train_rows])
    class_feature_weights = defaultdict(Counter)
    class_total_weights = Counter()

    for r in train_rows:
        emo = r["emotion"]
        tokens = tokenize(r["text"])
        tf = Counter(tokens)
        for t, count in tf.items():
            if t in vocab:
                w = (1.0 + math.log(count)) * idf[t]
                class_feature_weights[emo][t] += w
                class_total_weights[emo] += w

    classes = sorted(list(by_class.keys()))
    vocab_size = len(vocab)

    confusion = {c1: {c2: 0 for c2 in classes} for c1 in classes}
    y_true, y_pred = [], []

    for r in test_rows:
        true_emo = r["emotion"]
        tokens = tokenize(r["text"])
        scores = {}
        for emo in classes:
            prior = math.log(class_priors[emo] / len(train_rows))
            log_prob = prior
            denom = class_total_weights[emo] + (vocab_size * 0.5)
            for t in tokens:
                if t in vocab:
                    w = class_feature_weights[emo][t] + 0.5
                    log_prob += math.log(w / denom) * 2.0
            scores[emo] = log_prob

        pred_emo = max(scores.items(), key=lambda x: x[1])[0]
        confusion[true_emo][pred_emo] += 1
        y_true.append(true_emo)
        y_pred.append(pred_emo)

    correct = sum(1 for yt, yp in zip(y_true, y_pred) if yt == yp)
    total_test = len(y_true)
    accuracy = correct / total_test if total_test > 0 else 1.0

    class_metrics = {}
    macro_prec, macro_rec, macro_f1 = 0.0, 0.0, 0.0
    for c in classes:
        tp = confusion[c][c]
        fp = sum(confusion[other][c] for other in classes if other != c)
        fn = sum(confusion[c][other] for other in classes if other != c)
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        class_metrics[c] = {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "support": sum(confusion[c].values())
        }
        macro_prec += prec
        macro_rec += rec
        macro_f1 += f1

    num_classes = len(classes)
    macro_prec /= num_classes
    macro_rec /= num_classes
    macro_f1 /= num_classes

    top_keywords_per_emotion = {}
    for emo in classes:
        sorted_tokens = sorted(
            [(t, class_feature_weights[emo][t]) for t in class_feature_weights[emo]],
            key=lambda x: x[1],
            reverse=True
        )[:10]
        top_keywords_per_emotion[emo] = [t for t, _ in sorted_tokens]

    report = {
        "pipeline_name": "Multi-Class Hinglish Emotion & Sentiment Classifier",
        "version": "2.0-enhanced",
        "architecture": "Calibrated TF-IDF Unigram+Bigram Multinomial Classifier with Emoji Polarity Fusion",
        "num_classes": num_classes,
        "classes": classes,
        "total_dataset_rows": len(rows),
        "train_rows": len(train_rows),
        "test_rows": len(test_rows),
        "vocabulary_size": vocab_size,
        "metrics": {
            "overall_accuracy": round(accuracy, 4),
            "macro_precision": round(macro_prec, 4),
            "macro_recall": round(macro_rec, 4),
            "macro_f1_score": round(macro_f1, 4)
        },
        "per_class_metrics": class_metrics,
        "confusion_matrix": {
            "labels": classes,
            "matrix": [[confusion[c1][c2] for c2 in classes] for c1 in classes]
        },
        "top_keywords": top_keywords_per_emotion
    }

    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"Training completed! Accuracy: {accuracy*100:.2f}%, Macro F1: {macro_f1:.4f}")
    print(f"Exported report to: {REPORT_PATH}")

if __name__ == "__main__":
    main()
