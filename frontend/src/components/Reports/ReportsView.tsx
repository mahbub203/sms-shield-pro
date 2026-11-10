import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  Cpu,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';

const REPORTS = [
  {
    id: 'daily',
    title: 'Daily Security & Threat Telemetry Report',
    description: '24-hour summary of ingested traffic, phishing campaigns intercepted, blocked numbers, and latency.',
    type: 'PDF & CSV',
    frequency: 'Daily',
    badge: 'EXECUTIVE BRIEF',
    icon: Calendar
  },
  {
    id: 'weekly',
    title: 'Weekly SMS Spam & Phishing Classification Report',
    description: 'Comprehensive 7-day retrospective on threat vectors, volume spikes, and carrier reputation trends.',
    type: 'PDF & CSV',
    frequency: 'Weekly',
    badge: 'OPERATIONS',
    icon: Layers
  },
  {
    id: 'classification',
    title: 'Multi-Layer Detection Threat Audit Report',
    description: 'In-depth analysis of rule heuristics, velocity indicators, and ML confidence distributions.',
    type: 'PDF & CSV',
    frequency: 'On-Demand',
    badge: 'AUDIT',
    icon: ShieldCheck
  },
  {
    id: 'performance',
    title: 'Engine Accuracy & Latency Performance Report',
    description: 'Model evaluation matrices, precision-recall curve benchmarks, and processing throughput metrics.',
    type: 'PDF & CSV',
    frequency: 'Bi-Weekly',
    badge: 'ML BENCHMARK',
    icon: Cpu
  }
];

export const ReportsView: React.FC = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = (reportId: string) => {
    setDownloadingId(`pdf-${reportId}`);
    const url = api.getPdfReportUrl(reportId);
    window.open(url, '_blank');
    setTimeout(() => setDownloadingId(null), 1500);
  };

  const handleDownloadCsv = (dataType: string) => {
    setDownloadingId(`csv-${dataType}`);
    const url = api.getCsvExportUrl(dataType);
    window.open(url, '_blank');
    setTimeout(() => setDownloadingId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-navy-900 border border-slate-800 rounded-xl p-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Compliance & Security Reporting Center
            </h3>
            <p className="text-xs text-slate-400">
              Generate formatted executive PDF summaries or export raw structured CSV telemetry datasets.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadCsv('messages')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Messages CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCsv('threats')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-rose-400" />
            <span>Export Threats CSV</span>
          </button>
        </div>
      </div>

      {/* Reports Grid (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          const isPdfDownloading = downloadingId === `pdf-${report.id}`;

          return (
            <div
              key={report.id}
              className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-navy-950 text-cyan-400 border border-slate-800">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {report.badge}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">{report.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{report.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">Format: PDF (ReportLab)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPdf(report.id)}
                    disabled={isPdfDownloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/50 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 ${isPdfDownloading ? 'animate-bounce' : ''}`} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw Data Export Panel */}
      <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Raw Tabular Data Exports (Data Science & Auditing)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleDownloadCsv('messages')}
            className="p-3 rounded-lg bg-navy-950 border border-slate-800 hover:border-slate-700 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-white">Full Messages Ingest Archive</p>
              <p className="text-[10px] text-slate-400">Timestamps, Senders, Risk Scores, Status</p>
            </div>
            <Download className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={() => handleDownloadCsv('threats')}
            className="p-3 rounded-lg bg-navy-950 border border-slate-800 hover:border-slate-700 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-white">Security Incident Event Log</p>
              <p className="text-[10px] text-slate-400">Phishing vectors, Rate limits, Critical alerts</p>
            </div>
            <Download className="w-4 h-4 text-rose-400" />
          </button>

          <button
            onClick={() => handleDownloadCsv('senders')}
            className="p-3 rounded-lg bg-navy-950 border border-slate-800 hover:border-slate-700 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-white">Sender Reputation Directory</p>
              <p className="text-[10px] text-slate-400">Reputation scores, Totals, Spam ratios</p>
            </div>
            <Download className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
