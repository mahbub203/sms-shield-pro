import React, { useState } from 'react';
import { X, ShieldAlert, KeyRound, Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@smsshield.io');
  const [password, setPassword] = useState('Admin@Shield2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setCredentials = (role: 'admin' | 'analyst') => {
    if (role === 'admin') {
      setEmail('admin@smsshield.io');
      setPassword('Admin@Shield2026!');
    } else {
      setEmail('analyst@smsshield.io');
      setPassword('Analyst@Shield2026!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-navy-900 border border-slate-700 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SecOps Authentication</h3>
              <p className="text-xs text-slate-400">Sign in to access advanced policy controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fast Fill Buttons */}
        <div className="mt-4 p-3 rounded-lg bg-navy-950/80 border border-slate-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            One-Click Demo Credentials:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCredentials('admin')}
              className="px-2.5 py-1.5 rounded-md text-xs font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 hover:bg-cyan-900/60 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Admin Role</span>
            </button>
            <button
              type="button"
              onClick={() => setCredentials('analyst')}
              className="px-2.5 py-1.5 rounded-md text-xs font-mono bg-blue-950/80 text-blue-300 border border-blue-700/50 hover:bg-blue-900/60 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Analyst Role</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-navy-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-navy-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm transition-all shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Authenticate Session</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
