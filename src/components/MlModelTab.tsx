import React, { useState } from 'react';
import { MODEL_COMPARISON_REPORT } from '../lib/modelReportData';
import { Cpu, CheckCircle2, AlertTriangle, Layers, BarChart2 } from 'lucide-react';

export const MlModelTab: React.FC = () => {
  const [selectedModelKey, setSelectedModelKey] = useState<string>("random_forest");
  const report = MODEL_COMPARISON_REPORT;
  const currentModel = report.models[selectedModelKey];

  const modelDisplayNames: Record<string, string> = {
    random_forest: "Random Forest (Best Performing)",
    logistic_regression: "Logistic Regression",
    multinomial_nb: "Multinomial Naive Bayes"
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Machine Learning Model Evaluation & Benchmark</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Performance metrics across candidate Hinglish + English sentiment classifiers evaluated on an 80/20 train-test split.
        </p>
      </div>

      {/* Models Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Model Performance Summary</h3>
          <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
            Selected: {modelDisplayNames[selectedModelKey]}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Classifier Architecture</th>
                <th className="py-3 px-4 text-right">Accuracy</th>
                <th className="py-3 px-4 text-right">Precision (Macro)</th>
                <th className="py-3 px-4 text-right">Recall (Macro)</th>
                <th className="py-3 px-4 text-right">F1-Score (Macro)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(report.models).map(([key, m]) => {
                const isSelected = selectedModelKey === key;
                const isBest = key === report.best_model;

                return (
                  <tr
                    key={key}
                    onClick={() => setSelectedModelKey(key)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/70 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <span>{modelDisplayNames[key]}</span>
                      {isBest && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                          BEST
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {(m.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {(m.precision_macro * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {(m.recall_macro * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {(m.f1_macro * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isSelected ? 'Viewing' : 'Inspect'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Inspection of Selected Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Confusion Matrix */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Confusion Matrix</h3>
            <span className="text-xs text-slate-400">Evaluated on {currentModel.n_test} test samples</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400 text-center mb-2">
              Predicted Label →
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center">
              <div />
              {currentModel.labels.map(l => (
                <div key={l} className="font-bold text-slate-700 uppercase text-[11px] truncate">
                  {l}
                </div>
              ))}

              {currentModel.labels.map((rowLabel, rIdx) => (
                <React.Fragment key={rowLabel}>
                  <div className="font-bold text-slate-700 uppercase text-[11px] flex items-center justify-end pr-2">
                    {rowLabel}
                  </div>
                  {currentModel.confusion_matrix[rIdx].map((val, cIdx) => {
                    const isDiagonal = rIdx === cIdx;
                    return (
                      <div
                        key={cIdx}
                        className={`py-3 rounded-lg font-bold text-sm flex items-center justify-center ${
                          isDiagonal ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {val}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            <div className="text-[10px] uppercase font-bold text-slate-400 text-left mt-2">
              ↑ Actual True Label
            </div>
          </div>
        </div>

        {/* Per-Class Classification Report */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Per-Class Metrics Breakdown</h3>

          <div className="space-y-3">
            {currentModel.labels.map(label => {
              const metrics = currentModel.classification_report[label];
              return (
                <div key={label} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase text-slate-800 tracking-wider">
                      {label} Class
                    </span>
                    <span className="text-[11px] text-slate-400">Support: {metrics.support} instances</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Precision</span>
                      <span className="font-mono font-bold text-slate-800">
                        {(metrics.precision * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Recall</span>
                      <span className="font-mono font-bold text-slate-800">
                        {(metrics.recall * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">F1-Score</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {(metrics['f1-score'] * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dataset Provenance */}
      <div className="bg-slate-100/80 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Layers className="w-4 h-4 text-slate-600" />
          <span>Dataset & Training Configuration</span>
        </div>
        <p className="leading-relaxed">
          {report.dataset.disclaimer} Total {report.dataset.total_rows} labeled samples
          ({report.dataset.label_counts.positive} positive, {report.dataset.label_counts.neutral} neutral, {report.dataset.label_counts.negative} negative)
          sourced from <code>sentiment_train.csv</code> and <code>hinglish_sentiment_demo.csv</code>.
        </p>
      </div>
    </div>
  );
};
