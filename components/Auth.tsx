
import React, { useState } from 'react';
import { UserCircle2, Mail, Lock, Phone, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';

interface AuthProps {
  onLogin: (email: string, password?: string) => void;
  onResetPassword: (email: string, phone: string, newPassword: string) => boolean;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onResetPassword }) => {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      if (email) onLogin(email, password);
    } else {
      if (newPassword !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
      const success = onResetPassword(recoveryEmail, recoveryPhone, newPassword);
      if (success) {
        setResetSuccess(true);
        setTimeout(() => {
          setResetSuccess(false);
          setMode('login');
        }, 2000);
      } else {
        alert("Verification failed.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-600 to-purple-700">
      <div className="w-full max-w-[400px] bg-white rounded-[40px] shadow-2xl p-10 space-y-8 animate-in zoom-in duration-300">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
            {mode === 'login' ? <UserCircle2 size={48} /> : <ShieldCheck size={48} />}
          </div>
          <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter">AttendEase</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] mt-2 tracking-widest">
            {mode === 'login' ? 'Authentication Required' : 'Account Recovery'}
          </p>
        </div>

        {resetSuccess ? (
          <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center space-y-4 animate-in zoom-in">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg"><ShieldCheck size={32} /></div>
            <h3 className="text-emerald-800 font-black text-xl">Success!</h3>
            <p className="text-emerald-600 text-[11px] font-bold uppercase">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'login' ? (
              <>
                <div className="space-y-1">
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="email" required className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="password" required className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end px-1">
                   <button type="button" onClick={() => setMode('forgot')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">Forgot Password?</button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                 <input placeholder="Verification Email" required type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} />
                 <input placeholder="Registered Phone" required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={recoveryPhone} onChange={e => setRecoveryPhone(e.target.value)} />
                 <input placeholder="New Password" required type="password" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                 <input placeholder="Confirm New Password" required type="password" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            )}

            <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-xs">
              {mode === 'login' ? 'Sign In' : 'Reset My Password'}
            </button>

            {mode === 'forgot' && (
              <button type="button" onClick={() => setMode('login')} className="w-full flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase pt-2 tracking-widest"><ArrowLeft size={14} /> Return to Login</button>
            )}
          </form>
        )}

        {mode === 'login' && (
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <p className="text-center text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Quick Access Demos</p>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => onLogin('admin@test.com', 'password123')} className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 active:scale-95 transition-all"><span className="text-[10px] font-black uppercase">Admin Portal</span><Zap size={16} /></button>
              <button onClick={() => onLogin('trainer@test.com', 'password123')} className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 active:scale-95 transition-all"><span className="text-[10px] font-black uppercase">Trainer Access</span><Zap size={16} /></button>
              <button onClick={() => onLogin('trainee@test.com', 'password123')} className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 active:scale-95 transition-all"><span className="text-[10px] font-black uppercase">Trainee Wallet</span><Zap size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
