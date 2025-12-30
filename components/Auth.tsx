
import React, { useState } from 'react';
import { UserCircle2, Mail, Lock, Phone, ArrowLeft, ShieldCheck } from 'lucide-react';

interface AuthProps {
  onLogin: (email: string, password?: string) => void;
  onResetPassword: (email: string, phone: string, newPassword: string) => boolean;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onResetPassword }) => {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Recovery states
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
          setRecoveryEmail('');
          setRecoveryPhone('');
          setNewPassword('');
          setConfirmPassword('');
        }, 2000);
      } else {
        alert("Verification failed. Please check your email and phone number.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            {mode === 'login' ? <UserCircle2 size={40} /> : <ShieldCheck size={40} />}
          </div>
          <h2 className="text-3xl font-bold text-slate-900">AttendEase</h2>
          <p className="text-slate-500 mt-2">
            {mode === 'login' ? 'Sign in to your account' : 'Recover your account'}
          </p>
        </div>

        {resetSuccess ? (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center space-y-3 animate-in zoom-in">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-emerald-800 font-bold">Password Reset!</h3>
            <p className="text-emerald-600 text-sm">Returning to login screen...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'login' ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-xl text-[11px] text-blue-600 leading-relaxed">
                    Verify your identity by providing your registered email and phone number.
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Verification Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail size={16} /></div>
                      <input required type="email" className="block w-full pl-10 py-3 border border-slate-200 rounded-xl outline-none" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Registered Phone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Phone size={16} /></div>
                      <input required type="text" className="block w-full pl-10 py-3 border border-slate-200 rounded-xl outline-none" placeholder="+1..." value={recoveryPhone} onChange={e => setRecoveryPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="space-y-1 mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">New Password</label>
                      <input required type="password" underline="none" className="block w-full px-4 py-3 border border-slate-200 rounded-xl outline-none" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Confirm New Password</label>
                      <input required type="password" underline="none" className="block w-full px-4 py-3 border border-slate-200 rounded-xl outline-none" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
            >
              {mode === 'login' ? 'Sign In' : 'Reset My Password'}
            </button>

            {mode === 'forgot' && (
              <button 
                type="button" 
                onClick={() => setMode('login')}
                className="w-full flex items-center justify-center gap-2 text-slate-400 text-sm font-medium hover:text-slate-600 pt-2"
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            )}
          </form>
        )}

        {mode === 'login' && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-center text-xs text-slate-400 font-medium mb-3 uppercase tracking-widest">Demo Accounts</p>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => { setEmail('admin@test.com'); setPassword('password123'); }}
                className="py-2 px-4 text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left"
              >
                Admin: admin@test.com
              </button>
              <button 
                onClick={() => { setEmail('trainer@test.com'); setPassword('password123'); }}
                className="py-2 px-4 text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left"
              >
                Trainer: trainer@test.com
              </button>
              <button 
                onClick={() => { setEmail('trainee@test.com'); setPassword('password123'); }}
                className="py-2 px-4 text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left"
              >
                Trainee: trainee@test.com
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
