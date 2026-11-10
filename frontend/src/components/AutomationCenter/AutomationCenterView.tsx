import React, { useState, useEffect } from 'react';
import {
  SendHorizontal,
  Users,
  FileCode,
  Sliders,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  KeyRound,
  RotateCcw,
  Sparkles,
  Globe,
  Radio,
  Clock,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';
import { Recipient, MessageTemplate, UnicodeInspectResult } from '../../types';

export const AutomationCenterView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'recipients' | 'composer' | 'create-job'>('recipients');

  // Recipients State
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newPhone, setNewPhone] = useState('+8801712345678');
  const [newName, setNewName] = useState('');
  const [newLang, setNewLang] = useState('bn');
  const [newNotes, setNewNotes] = useState('');
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  const [verifyingRecipient, setVerifyingRecipient] = useState<Recipient | null>(null);
  const [otpCode, setOtpCode] = useState('749201');

  // Composer & Templates State
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [composerText, setComposerText] = useState(
    'আপনার এসএমএস শিল্ড ওটিপি (OTP) কোড হল ৭৪৯২০১। নিরাপত্তা নিশ্চিত করতে এই কোড কাউকে জানাবেন না।'
  );
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('BENGALI_NOTICE');
  const [unicodeInfo, setUnicodeInfo] = useState<UnicodeInspectResult>({
    char_count: 87,
    encoding: 'UCS-2 (Unicode)',
    is_unicode: true,
    is_bengali: true,
    segment_count: 2,
    max_per_segment: 67,
    remaining_in_segment: 47
  });

  // Job Creator State
  const [jobName, setJobName] = useState('Security Telemetry Broadcast 1');
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | ''>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [testQuantity, setTestQuantity] = useState<number>(3);
  const [intervalSec, setIntervalSec] = useState<number>(10);
  const [executionMode, setExecutionMode] = useState<string>('MOCK_GATEWAY');
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [jobFeedback, setJobFeedback] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [rList, tList] = await Promise.all([
        api.getRecipients(),
        api.getTemplates()
      ]);
      setRecipients(rList);
      setTemplates(tList);
      if (rList.length > 0 && selectedRecipientId === '') {
        const eligible = rList.find((r) => r.consent_status === 'OPTED_IN') || rList[0];
        setSelectedRecipientId(eligible.id);
      }
      if (tList.length > 0 && selectedTemplateId === '') {
        setSelectedTemplateId(tList[0].id);
      }
    } catch (err) {
      console.error('Failed to load automation data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update Unicode inspection on text change
  useEffect(() => {
    let active = true;
    async function checkText() {
      try {
        const info = await api.inspectUnicode(composerText);
        if (active) setUnicodeInfo(info);
      } catch (err) {
        // Fallback
      }
    }
    checkText();
    return () => {
      active = false;
    };
  }, [composerText]);

  // Recipient Handlers
  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addRecipient(newPhone, newName, newLang, newNotes);
      setNewPhone('');
      setNewName('');
      setNewNotes('');
      setIsAddingRecipient(false);
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingRecipient) return;
    try {
      await api.verifyRecipient(verifyingRecipient.id, otpCode);
      setVerifyingRecipient(null);
      loadData();
    } catch (err: any) {
      alert(`Verification error: ${err.message}`);
    }
  };

  const handleToggleConsent = async (rec: Recipient) => {
    const nextStatus = rec.consent_status === 'OPTED_IN' ? 'REVOKED' : 'OPTED_IN';
    try {
      await api.updateConsent(rec.id, nextStatus);
      loadData();
    } catch (err: any) {
      alert(`Consent update error: ${err.message}`);
    }
  };

  const handleDeleteRecipient = async (id: number) => {
    if (!confirm('Remove recipient?')) return;
    try {
      await api.deleteRecipient(id);
      loadData();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  // Template Handlers
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !composerText.trim()) return;
    try {
      await api.createTemplate(templateName, composerText, templateCategory);
      setTemplateName('');
      loadData();
      alert('Template saved to catalog!');
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    }
  };

  const handleApplyTemplate = (tmpl: MessageTemplate) => {
    setComposerText(tmpl.content);
    setTemplateName(tmpl.name);
    setTemplateCategory(tmpl.category);
  };

  // Job Creator Handler
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipientId) {
      alert('Please select an authorized recipient.');
      return;
    }
    setIsSubmittingJob(true);
    setJobFeedback(null);
    try {
      await api.createAutomationJob({
        name: jobName,
        recipient_id: Number(selectedRecipientId),
        template_id: selectedTemplateId ? Number(selectedTemplateId) : undefined,
        custom_message: composerText,
        target_count: testQuantity,
        interval_seconds: intervalSec,
        execution_mode: executionMode
      });
      setJobFeedback('Automation job created successfully! View in Automation Scheduler.');
      loadData();
    } catch (err: any) {
      alert(`Failed to create job: ${err.message}`);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('recipients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'recipients'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Recipient Consent Management</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-navy-950 text-cyan-400 border border-cyan-800/40">
            {recipients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('composer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'composer'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Bengali & Unicode Message Composer</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-navy-950 text-cyan-400 border border-cyan-800/40">
            {templates.length} Templates
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('create-job')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'create-job'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configure Automation Job</span>
        </button>
      </div>

      {/* SUB-TAB 1: RECIPIENT MANAGEMENT */}
      {activeSubTab === 'recipients' && (
        <div className="space-y-5">
          <div className="bg-navy-900 border border-slate-800 rounded-xl p-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Authorized Recipient & Consent Registry
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                SMS Shield PRO strictly mandates verified phone ownership and explicit consent (opt-in) before permitting any automated dispatch.
              </p>
            </div>
            <button
              onClick={() => setIsAddingRecipient(!isAddingRecipient)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-glow-cyan transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Recipient</span>
            </button>
          </div>

          {/* Add Recipient Form */}
          {isAddingRecipient && (
            <form onSubmit={handleAddRecipient} className="p-4 rounded-xl bg-navy-900 border border-cyan-500/30 shadow-card space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Register New Verified Recipient</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Phone Number (E.164 International Format)
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+8801712345678"
                    required
                    className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">e.g. +880 for Bangladesh, +1 for USA</span>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Full Name / Display Identity</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Mahbub Alam"
                    required
                    className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Language Preference</label>
                  <select
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="bn">Bengali (বাংলা)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRecipient(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                >
                  Save & Request Verification
                </button>
              </div>
            </form>
          )}

          {/* Recipients Table */}
          <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/60 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Phone Number</th>
                  <th className="py-2.5 px-3">Recipient Name</th>
                  <th className="py-2.5 px-3 text-center">Verification</th>
                  <th className="py-2.5 px-3 text-center">Consent Status</th>
                  <th className="py-2.5 px-3 text-center">Language</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {recipients.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-cyan-300">{rec.phone_number}</td>
                    <td className="py-3 px-3 font-medium text-white">{rec.name}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          rec.verification_status === 'verified'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {rec.verification_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          rec.consent_status === 'OPTED_IN'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : rec.consent_status === 'REVOKED'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {rec.consent_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center uppercase font-mono text-slate-300">
                      {rec.preferred_language}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rec.verification_status !== 'verified' && (
                          <button
                            onClick={() => setVerifyingRecipient(rec)}
                            className="px-2 py-1 rounded text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/60 transition-colors"
                          >
                            Verify OTP
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleConsent(rec)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                            rec.consent_status === 'OPTED_IN'
                              ? 'bg-slate-800 text-rose-400 hover:bg-rose-950'
                              : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900'
                          }`}
                        >
                          {rec.consent_status === 'OPTED_IN' ? 'Revoke Consent' : 'Grant Opt-In'}
                        </button>
                        <button
                          onClick={() => handleDeleteRecipient(rec.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* OTP Verification Modal */}
          {verifyingRecipient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
              <div className="relative w-full max-w-sm rounded-2xl bg-navy-900 border border-slate-700 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Authorized Phone Verification</h3>
                  </div>
                  <button onClick={() => setVerifyingRecipient(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <p className="text-xs text-slate-400">
                  Enter the 6-digit confirmation token issued to <strong className="text-white font-mono">{verifyingRecipient.phone_number}</strong>:
                </p>
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="749201"
                    maxLength={6}
                    required
                    className="w-full text-center text-xl font-mono tracking-widest bg-navy-950 border border-slate-800 rounded-lg py-2.5 text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-glow-cyan"
                  >
                    Confirm & Grant Consent
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: COMPOSER & BENGALI UNICODE */}
      {activeSubTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Editor (7 cols) */}
          <div className="lg:col-span-7 rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">Unicode & Bengali SMS Composer</h3>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${unicodeInfo.is_bengali ? 'bg-purple-950 text-purple-300 border border-purple-800/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-800/40'}`}>
                {unicodeInfo.is_bengali ? 'বাংলা BENGALI SMS' : unicodeInfo.encoding}
              </span>
            </div>

            {/* Quick Bengali Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Standard Quick Inserts:
              </span>
              <div className="flex flex-wrap gap-2">
                {templates.slice(0, 4).map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-navy-950 text-slate-300 border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Message Payload</label>
              <textarea
                rows={5}
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="বাংলায় লিখুন অথবা ইংরেজিতে বার্তা লিখুন..."
                className="w-full bg-navy-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans resize-none leading-relaxed"
              />
            </div>

            {/* Character & Segment Telemetry Bar */}
            <div className="p-3.5 rounded-lg bg-navy-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Encoding Standard:</span>
                <span className="font-mono text-cyan-300 font-bold">{unicodeInfo.encoding}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Characters:</span>
                <span className="font-mono text-white font-bold">{unicodeInfo.char_count} chars</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Segment Count (Telco Tariff):</span>
                <span className="font-mono text-amber-300 font-bold">
                  {unicodeInfo.segment_count} Segment{unicodeInfo.segment_count > 1 ? 's' : ''} ({unicodeInfo.max_per_segment} chars/part)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-2">
                <span className="text-slate-400">Remaining in Current Segment:</span>
                <span className="font-mono text-emerald-400 font-bold">{unicodeInfo.remaining_in_segment} chars</span>
              </div>
            </div>

            {/* Save Template Form */}
            <form onSubmit={handleSaveTemplate} className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Save Message as Catalog Template</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template Name e.g. Bengali Security Notice"
                  required
                  className="bg-navy-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="bg-navy-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="BENGALI_NOTICE">Bengali Notice (বাংলা)</option>
                  <option value="OTP">2FA / OTP Code</option>
                  <option value="SECURITY_ALERT">Security Alert</option>
                  <option value="TRANSACTIONAL">Transactional</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
              >
                Save to Template Catalog
              </button>
            </form>
          </div>

          {/* Right Live Device Preview (5 cols) */}
          <div className="lg:col-span-5 rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Smartphone Display Preview</h3>
              <p className="text-xs text-slate-400">Simulated mobile viewport rendering</p>
            </div>

            {/* Mock Phone Frame */}
            <div className="max-w-[280px] mx-auto w-full rounded-3xl bg-navy-950 border-4 border-slate-700 p-4 shadow-2xl space-y-4">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>SMS SHIELD</span>
                <span>LTE</span>
              </div>
              <div className="py-2 text-center">
                <span className="text-[10px] text-slate-500">Today • Authorized Sender</span>
              </div>
              {/* Message Bubble */}
              <div className="p-3 rounded-2xl bg-cyan-900/40 border border-cyan-500/30 text-white text-xs leading-relaxed font-sans shadow-sm">
                {composerText || 'Type a message to preview...'}
              </div>
              <div className="text-[10px] text-slate-500 text-right">Delivered via SMSC</div>
            </div>

            <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">Telco Standard Note:</span>
              <p>
                Bengali characters utilize UCS-2 16-bit encoding (70 chars single / 67 multi-part). GSM 7-bit is used for English ASCII (160 single / 153 multi-part).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CREATE AUTOMATION JOB */}
      {activeSubTab === 'create-job' && (
        <div className="max-w-3xl mx-auto rounded-xl bg-navy-900 border border-slate-800 p-6 shadow-card space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Configure Authorized Automation Job</h3>
              <p className="text-xs text-slate-400">Strictly regulated automated testing with quota enforcement</p>
            </div>
          </div>

          {jobFeedback && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{jobFeedback}</span>
            </div>
          )}

          <form onSubmit={handleCreateJob} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Automation Job Title</label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                required
                className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Approved Target Recipient</label>
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(Number(e.target.value))}
                  required
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="">-- Choose Consented Recipient --</option>
                  {recipients
                    .filter((r) => r.consent_status === 'OPTED_IN')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.phone_number} ({r.name})
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Only recipients with OPTED_IN status appear</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Catalog Template (Optional)</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedTemplateId(id);
                    const found = templates.find((t) => t.id === id);
                    if (found) setComposerText(found.content);
                  }}
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="">-- Use Custom Message Payload --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Message Content to Transmit</label>
              <textarea
                rows={3}
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                required
                className="w-full bg-navy-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Permitted Test Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={testQuantity}
                  onChange={(e) => setTestQuantity(Number(e.target.value))}
                  required
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">Max limit: 20 SMS (Anti-abuse)</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Pacing Interval (Seconds)</label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={intervalSec}
                  onChange={(e) => setIntervalSec(Number(e.target.value))}
                  required
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">Min 5s between transmissions</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gateway Execution Mode</label>
                <select
                  value={executionMode}
                  onChange={(e) => setExecutionMode(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="MOCK_GATEWAY">Mock Gateway (Simulation)</option>
                  <option value="PROVIDER_SANDBOX">Provider Sandbox (Twilio Test)</option>
                  <option value="AUTHORIZED_LIVE">Authorized Live Adapter</option>
                </select>
              </div>
            </div>

            {/* Estimated Quota & Cost Box */}
            <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">Estimated Tariff & Resource Cost:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {executionMode === 'MOCK_GATEWAY' ? '$0.00 (Simulated Virtual)' : `$${(testQuantity * 0.0075).toFixed(4)} USD`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Total Dispatches:</span>
                <span className="font-mono text-white font-bold">{testQuantity} SMS</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingJob}
              className="w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-glow-cyan flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmittingJob ? (
                <span>Registering Job...</span>
              ) : (
                <>
                  <SendHorizontal className="w-4 h-4" />
                  <span>Create Automation Job</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
