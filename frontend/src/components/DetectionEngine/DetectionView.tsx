import React, { useState, useEffect } from 'react';
import {
  Scan,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Send,
  Zap,
  Cpu,
  Layers,
  BarChart,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { DetectionResult, MLMetrics } from '../../types';
import { RiskBadge } from '../Common/RiskBadge';

const PRESETS = [
  {
    label: 'Chase Phishing',
    sender: '+18884920192',
    content: 'URGENT: Chase Fraud Alert. A suspicious charge of $1,250.00 was attempted. If unauthorized, verify here: http://chase-security-verify.xyz'
  },
  {
    label: 'USPS Redelivery Scam',
    sender: '+12025550189',
    content: 'USPS: Your package 9400100000000000000000 is detained at depot due to incorrect address. Resolve details: http://bit.ly/usps-package-resolve'
  },
  {
    label: 'Urgent Crypto Bail',
    sender: '+12025550177',
    content: 'EMERGENCY: Your grandson was involved in an accident and needs immediate $2,500 bail wire via Bitcoin. Send funds immediately.'
  },
  {
    label: 'Legitimate GitHub 2FA',
    sender: '+18005550100',
    content: 'Your GitHub verification authentication code is 492104. Valid for 10 minutes. Never share this code with anyone.'
  },
  {
    label: 'Routine Family Text',
    sender: '+12025550111',
    content: 'Hey Alex, are we still meeting for lunch at 12:30 PM today near the park?'
  }
];

export const DetectionView: React.FC = () => {
  const [sender, setSender] = useState<string>('+18884920192');
  const [content, setContent] = useState<string>(
    'URGENT: Chase Fraud Alert. A suspicious charge of $1,250.00 was attempted. If unauthorized, verify here: http://chase-security-verify.xyz'
  );
  const [recipient, setRecipient] = useState<string>('+10000000000');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [mlMetrics, setMlMetrics] = useState<MLMetrics | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const metrics = await api.getMLMetrics();
        setMlMetrics(metrics);
      } catch (err) {
        console.error('Failed to load ML metrics:', err);
      }
    }
    loadMetrics();
  }, []);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || !sender.trim()) return;

    setIsAnalyzing(true);
    try {
      const res = await api.analyzeMessage(sender, content, recipient);
      setResult(res);
    } catch (err: any) {
      alert(`Analysis failed: ${err.message || 'Error executing inspection'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyPreset = (p: typeof PRESETS[0]) => {
    setSender(p.sender);
    setContent(p.content);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Inspector Form and Live Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">Live SMS Payload Inspector</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Triple-Layer Defense Active</span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Test Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-navy-950 text-slate-300 border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Originating Sender</label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="+18885550199"
                  required
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Recipient Destination</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="+10000000000"
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">SMS Payload Body</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter SMS message text here..."
                required
                className="w-full bg-navy-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono resize-none"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>{content.length} characters</span>
                <span>{Math.ceil(content.length / 160)} SMS segments</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Defense Layers...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Analyze SMS Payload</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Scorecard & Verdict (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white tracking-wide">Detection Verdict</h3>
              {result && (
                <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {result.processing_time_ms} ms
                </span>
              )}
            </div>

            {!result ? (
              <div className="py-16 text-center space-y-2">
                <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Ready to inspect. Input a message or choose a preset and click 'Analyze SMS Payload'.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {/* Composite Risk Score Meter */}
                <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 text-center space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Composite Risk Score
                  </span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span
                      className={`text-4xl font-extrabold font-mono ${
                        result.composite_score >= 80
                          ? 'text-rose-400'
                          : result.composite_score >= 60
                          ? 'text-orange-400'
                          : result.composite_score >= 35
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {Math.round(result.composite_score)}
                    </span>
                    <span className="text-sm text-slate-500 font-mono">/ 100</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        result.composite_score >= 80
                          ? 'bg-rose-500'
                          : result.composite_score >= 60
                          ? 'bg-orange-500'
                          : result.composite_score >= 35
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, result.composite_score))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <RiskBadge level={result.risk_level} size="md" />
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                        result.recommended_action === 'BLOCK'
                          ? 'bg-rose-950 text-rose-300 border border-rose-600/40'
                          : result.recommended_action === 'QUARANTINE'
                          ? 'bg-orange-950 text-orange-300 border border-orange-600/40'
                          : result.recommended_action === 'FLAG'
                          ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                      }`}
                    >
                      ACTION: {result.recommended_action}
                    </span>
                  </div>
                </div>

                {/* Layer Breakdown Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-navy-950 border border-slate-800/80 text-xs">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Layer 1 (Rule Heuristics)
                    </span>
                    <span className="font-mono font-bold text-cyan-300">{result.layer1_score} / 100</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-navy-950 border border-slate-800/80 text-xs">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Layer 2 (Statistical & Velocity)
                    </span>
                    <span className="font-mono font-bold text-blue-300">{result.layer2_score} / 100</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-navy-950 border border-slate-800/80 text-xs">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      Layer 3 (Machine Learning)
                    </span>
                    <span className="font-mono font-bold text-purple-300">{result.layer3_score} / 100</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {result && result.matched_rules && result.matched_rules.length > 0 && (
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Triggered Heuristics & Findings:
              </span>
              <ul className="space-y-1 text-xs text-rose-300/90 font-mono">
                {result.matched_rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-500 mt-0.5">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Scikit-Learn Model Evaluation & Confusion Matrix */}
      {mlMetrics && (
        <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Machine Learning Evaluation & Model Validation
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Dataset: {mlMetrics.dataset_size} SMS corpus samples
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 text-center">
              <p className="text-[10px] uppercase text-slate-400">Accuracy</p>
              <p className="text-xl font-bold font-mono text-cyan-400">{(mlMetrics.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 text-center">
              <p className="text-[10px] uppercase text-slate-400">Precision</p>
              <p className="text-xl font-bold font-mono text-blue-400">{(mlMetrics.precision * 100).toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 text-center">
              <p className="text-[10px] uppercase text-slate-400">Recall</p>
              <p className="text-xl font-bold font-mono text-emerald-400">{(mlMetrics.recall * 100).toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 text-center">
              <p className="text-[10px] uppercase text-slate-400">F1-Score</p>
              <p className="text-xl font-bold font-mono text-amber-400">{mlMetrics.f1_score.toFixed(4)}</p>
            </div>
          </div>

          {/* Confusion Matrix Table */}
          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Held-Out Test Confusion Matrix (25% Stratified Validation)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Model: {mlMetrics.model_name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-center font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">True Negatives (Ham)</span>
                <span className="text-lg font-bold text-emerald-400">
                  {mlMetrics.confusion_matrix[0]?.[0] || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">False Positives (Spam)</span>
                <span className="text-lg font-bold text-amber-400">
                  {mlMetrics.confusion_matrix[0]?.[1] || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">False Negatives (Missed)</span>
                <span className="text-lg font-bold text-rose-400">
                  {mlMetrics.confusion_matrix[1]?.[0] || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">True Positives (Phish Caught)</span>
                <span className="text-lg font-bold text-cyan-400">
                  {mlMetrics.confusion_matrix[1]?.[1] || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
