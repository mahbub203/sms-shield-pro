import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Check,
  Shield,
  Sliders,
  Bell,
  Lock,
  Cpu,
  KeyRound
} from 'lucide-react';
import { api } from '../../services/api';
import { SystemSetting } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const SettingsView: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [settingsList, setSettingsList] = useState<SystemSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettingsList(data);
      const values: Record<string, string> = {};
      data.forEach((s) => {
        values[s.key] = s.value;
      });
      setEditedValues(values);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (key: string) => {
    setIsSaving(key);
    try {
      await api.updateSetting(key, editedValues[key]);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
      loadSettings();
    } catch (err: any) {
      alert(`Failed to update setting: ${err.message}`);
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-navy-900 border border-slate-800 rounded-xl p-5 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              System Configuration & Defense Thresholds
            </h3>
            <p className="text-xs text-slate-400">
              Tune heuristic sensitivities, sliding velocity limits, and automated policy responses.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Role: {user?.role || 'Guest / Observer'}
          </span>
        </div>
      </div>

      {/* Main Settings Table Card */}
      <div className="rounded-xl bg-navy-900 border border-slate-800 p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h4 className="text-sm font-bold text-white tracking-wide">Operational Parameters</h4>
          <span className="text-xs text-slate-500 font-mono">Changes take effect immediately</span>
        </div>

        <div className="space-y-4">
          {settingsList.map((st) => {
            const isModified = editedValues[st.key] !== st.value;
            const isSavingThis = isSaving === st.key;
            const isJustSaved = savedKey === st.key;

            return (
              <div
                key={st.key}
                className="p-4 rounded-xl bg-navy-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-300">{st.key}</span>
                  </div>
                  <p className="text-xs text-slate-400">{st.description || 'System setting parameter'}</p>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  {st.key === 'emergency_lockdown_mode' || st.key === 'auto_block_critical' ? (
                    <select
                      value={editedValues[st.key] || 'false'}
                      onChange={(e) => handleChange(st.key, e.target.value)}
                      className="bg-navy-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editedValues[st.key] ?? st.value}
                      onChange={(e) => handleChange(st.key, e.target.value)}
                      className="w-32 bg-navy-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono text-right"
                    />
                  )}

                  <button
                    onClick={() => handleSave(st.key)}
                    disabled={isSavingThis || !isModified}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isJustSaved
                        ? 'bg-emerald-600 text-white'
                        : isModified
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-glow-cyan'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isJustSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </>
                    ) : isSavingThis ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Apply</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
