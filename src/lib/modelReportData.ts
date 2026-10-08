import { ModelComparisonData } from '../types';

export const MODEL_COMPARISON_REPORT: ModelComparisonData = {
  dataset: {
    sources: {
      "sentiment_train.csv": 152,
      "hinglish_sentiment_demo.csv": 90
    },
    total_rows: 242,
    label_counts: {
      positive: 81,
      neutral: 81,
      negative: 80
    },
    disclaimer: "Demonstration-scale combined dataset. Not a scientifically representative corpus."
  },
  settings: {
    max_features: 3000,
    min_df: 2,
    ngram_range: [1, 2],
    test_size: 0.2,
    random_state: 42
  },
  models: {
    random_forest: {
      accuracy: 0.6938775510204082,
      precision_macro: 0.7454906204906204,
      recall_macro: 0.6960784313725491,
      f1_macro: 0.6992063492063493,
      confusion_matrix: [
        [11, 1, 4],
        [0, 10, 7],
        [3, 0, 13]
      ],
      labels: ["negative", "neutral", "positive"],
      classification_report: {
        negative: { precision: 0.786, recall: 0.688, "f1-score": 0.733, support: 16 },
        neutral: { precision: 0.909, recall: 0.588, "f1-score": 0.714, support: 17 },
        positive: { precision: 0.542, recall: 0.812, "f1-score": 0.650, support: 16 }
      },
      n_train: 193,
      n_test: 49
    },
    logistic_regression: {
      accuracy: 0.6530612244897959,
      precision_macro: 0.7196969696969697,
      recall_macro: 0.6544117647058824,
      f1_macro: 0.6587301587301587,
      confusion_matrix: [
        [9, 1, 6],
        [0, 10, 7],
        [3, 0, 13]
      ],
      labels: ["negative", "neutral", "positive"],
      classification_report: {
        negative: { precision: 0.750, recall: 0.562, "f1-score": 0.643, support: 16 },
        neutral: { precision: 0.909, recall: 0.588, "f1-score": 0.714, support: 17 },
        positive: { precision: 0.500, recall: 0.812, "f1-score": 0.619, support: 16 }
      },
      n_train: 193,
      n_test: 49
    },
    multinomial_nb: {
      accuracy: 0.6122448979591837,
      precision_macro: 0.6677536231884057,
      recall_macro: 0.613970588235294,
      f1_macro: 0.6185897435897435,
      confusion_matrix: [
        [10, 1, 5],
        [1, 9, 7],
        [5, 0, 11]
      ],
      labels: ["negative", "neutral", "positive"],
      classification_report: {
        negative: { precision: 0.625, recall: 0.625, "f1-score": 0.625, support: 16 },
        neutral: { precision: 0.900, recall: 0.529, "f1-score": 0.667, support: 17 },
        positive: { precision: 0.478, recall: 0.688, "f1-score": 0.564, support: 16 }
      },
      n_train: 193,
      n_test: 49
    }
  },
  best_model: "random_forest"
};
