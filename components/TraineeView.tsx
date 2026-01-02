
import React, { useState, useEffect, useRef } from 'react';
import { AttendanceClass, AttendanceRecord, User, PaymentRecord, CreditPackage } from '../types';
import { QrCode, History, ShoppingBag, CheckCircle2, X, ChevronRight, CreditCard, DollarSign, Camera, Image as ImageIcon, MapPin, Calendar, Clock, User as UserIcon, Lock, AlertTriangle, Mail, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface TraineeViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  packages: CreditPackage[];
  onCheckIn: (rec: AttendanceRecord) => { success: boolean, message: string };
  onPurchase: (payment: PaymentRecord) => void;
  onUpdateUser: (user: User) => void;
}

const TraineeView: React.FC<TraineeViewProps> = ({ user, classes, attendance, payments, packages, onCheckIn, onPurchase, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'shop' | 'profile'>('scan');
  const [historySubTab, setHistorySubTab] = useState<'attendance' | 'purchases'>('attendance');
  const [isScanning, setIsScanning] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState<CreditPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | 'warning', text: string } | null>(null);
  
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phoneNumber || '',
    password: user.password || ''
  });

  const [paymentForm, setPaymentForm] = useState({ card: '', expiry: '', cvv: '' });

  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const traineeAttendance = attendance.filter(a => a.traineeId === user.id);
  const traineePayments = payments.filter(p => p.traineeId === user.id);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const processQrData = async (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.cid && data.sec) {
        const res = onCheckIn({
          id: Math.random().toString(36).substr(2, 9),
          classId: data.cid,
          traineeId: user.id,
          timestamp: Date.now(),
          method: 'QR'
        });
        
        if (res.success) {
          await stopScanner();
          setStatusMessage({ type: 'success', text: res.message });
          setActiveTab('history');
          setHistorySubTab('attendance');
          return true;
        } else {
          const isWarning = res.message.toLowerCase().includes("conflict") || res.message.toLowerCase().includes("hasn't started");
          setStatusMessage({ type: isWarning ? 'warning' : 'error', text: res.message });
          await stopScanner();
          return false;
        }
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: "Invalid QR format. Please scan a valid session code." });
      await stopScanner();
    }
    return false;
  };

  const stopScanner = async () => {
    if (qrScannerRef.current) {
      try { if (qrScannerRef.current.isScanning) await qrScannerRef.current.stop(); } 
      catch (e) { console.warn(e); } 
      finally { qrScannerRef.current = null; }
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    setStatusMessage(null);
    setIsScanning(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        qrScannerRef.current = html5QrCode;
        await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, async (txt) => await processQrData(txt), () => {});
      } catch (err) {
        setStatusMessage({ type: 'error', text: "Failed to access camera. Please check permissions." });
        setIsScanning(false);
      }
    }, 300);
  };

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentGateway) return;
    setIsProcessing(true);
    
    // Simulate payment processing delay (Stripe/PayPal imitation)
    setTimeout(() => {
      onPurchase({
        id: Math.random().toString(36).substr(2, 9),
        traineeId: user.id,
        amount: showPaymentGateway.price,
        credits: showPaymentGateway.credits,
        timestamp: Date.now(),
        status: 'SUCCESS'
      });
      setIsProcessing(false);
      setShowPaymentGateway(null);
      setShowPurchaseSuccess(true);
      setPaymentForm({ card: '', expiry: '', cvv: '' });
    }, 2000);
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: profileData.name,
      email: profileData.email,
      phoneNumber: profileData.phone,
      password: profileData.password
    });
    alert("Profile settings updated!");
  };

  const emailChanged = profileData.email !== user.email;

  return (
    <div className="space-y-6">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const html5QrCode = new Html5Qrcode("reader-hidden");
          const decodedText = await html5QrCode.scanFileV2(file, false);
          await processQrData(decodedText.decodedText);
          html5QrCode.clear();
        } catch (err) {
          setStatusMessage({ type: 'error', text: "Could not find a valid QR code in this image." });
        }
      }} />
      <div id="reader-hidden" className="hidden"></div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar shadow-inner">
        {[
          { id: 'scan', icon: QrCode, label: 'CHECK IN' },
          { id: 'history', icon: History, label: 'RECORDS' },
          { id: 'shop', icon: ShoppingBag, label: 'BUY CREDITS' },
          { id: 'profile', icon: UserIcon, label: 'MY PROFILE' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[75px] py-3 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1.5 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}>
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'scan' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {statusMessage && (
            <div className={`p-4 rounded-2xl border flex gap-3 animate-bounce ${statusMessage.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' : statusMessage.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertTriangle size={20} className="shrink-0" />}
              <div className="text-xs font-black uppercase leading-tight">{statusMessage.text}</div>
            </div>
          )}
          
          <div className="text-center space-y-3 px-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ready to Train?</h2>
            <p className="text-sm text-slate-500 leading-relaxed">Scan the session QR code at the studio to mark your attendance. <br/><strong>1 Credit will be deducted.</strong></p>
          </div>

          {!isScanning ? (
            <div className="grid grid-cols-1 gap-4 px-4">
              <button onClick={startScanner} className="group aspect-square bg-white border-4 border-indigo-50 rounded-[45px] flex flex-col items-center justify-center gap-6 active:scale-95 transition-all shadow-2xl hover:border-indigo-200">
                <div className="w-24 h-24 bg-indigo-600 text-white rounded-[32px] flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform"><Camera size={48} /></div>
                <span className="text-2xl font-black text-slate-800">Launch Scanner</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-600 font-black shadow-sm active:bg-slate-50"><ImageIcon size={20} /> Select from Photos</button>
            </div>
          ) : (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col">
              <div className="p-6 flex justify-between items-center text-white shrink-0 bg-slate-900/90 backdrop-blur-md">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                   <h3 className="font-black text-lg">Align QR Code</h3>
                </div>
                <button onClick={stopScanner} className="p-3 bg-white/10 rounded-full active:scale-75 transition-transform"><X size={28} /></button>
              </div>
              <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                <div id="reader" className="w-full h-full bg-black"></div>
                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                   <div className="w-64 h-64 border-2 border-indigo-500/50 rounded-3xl relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1 rounded-br-lg"></div>
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-indigo-500/30 animate-[scan_2s_infinite]"></div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300 pb-12">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border shadow-inner">
            <button onClick={() => setHistorySubTab('attendance')} className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest ${historySubTab === 'attendance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Session Log</button>
            <button onClick={() => setHistorySubTab('purchases')} className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest ${historySubTab === 'purchases' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Transactions</button>
          </div>
          
          <div className="space-y-3">
            {historySubTab === 'attendance' ? (
              traineeAttendance.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4"><Calendar size={32} /></div>
                  <p className="text-slate-400 font-bold">No sessions attended yet.</p>
                </div>
              ) : (
                traineeAttendance.map(record => {
                  const cls = classes.find(c => c.id === record.classId);
                  return (
                    <div key={record.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm hover:border-indigo-100 transition-colors">
                      <div className="space-y-1">
                        <div className="text-sm font-black text-slate-800">{cls?.name || 'Archived Session'}</div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                           <Clock size={12} /> {new Date(record.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                      <div className="text-[9px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-black uppercase tracking-tighter">{record.method} Verified</div>
                    </div>
                  );
                })
              )
            ) : (
              traineePayments.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4"><DollarSign size={32} /></div>
                  <p className="text-slate-400 font-bold">No purchase history found.</p>
                </div>
              ) : (
                traineePayments.map(p => (
                  <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black"><DollarSign size={20} /></div>
                        <div>
                          <div className="text-sm font-black text-slate-800">+{p.credits} Credits</div>
                          <div className="text-[10px] text-slate-400 font-bold">{new Date(p.timestamp).toLocaleDateString()}</div>
                        </div>
                     </div>
                     <div className="text-lg font-black text-slate-900">${p.amount}</div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="space-y-6 pb-20 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <p className="text-indigo-100 text-[11px] font-black uppercase tracking-[0.2em] mb-2">Available Balance</p>
            <div className="flex items-end gap-3">
              <h2 className="text-6xl font-black">{user.credits || 0}</h2>
              <span className="text-lg font-bold opacity-60 mb-2 uppercase">Credits</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Special Credit Packages</p>
            <div className="grid grid-cols-1 gap-4">
              {packages.map(pkg => (
                <button 
                  key={pkg.id} 
                  onClick={() => setShowPaymentGateway(pkg)} 
                  className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm active:scale-95 hover:border-indigo-400 transition-all text-left"
                >
                  <div className="space-y-1">
                    <div className="text-lg font-black text-slate-800 tracking-tight">{pkg.name}</div>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-indigo-600">{pkg.credits} Credits</span>
                       <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                       <span className="text-[10px] font-bold text-slate-400">${(pkg.price / pkg.credits).toFixed(2)} / credit</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-black text-slate-900">${pkg.price}</div>
                    <span className="text-[9px] font-bold text-indigo-500 uppercase flex items-center gap-1">Secure Pay <ChevronRight size={10} /></span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8 animate-in slide-in-from-right-4 duration-300">
          <div className="text-center space-y-3">
             <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center mx-auto shadow-inner border-2 border-indigo-100">
               <UserIcon size={40} />
             </div>
             <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Athlete Account</p>
             </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
              <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800" value={profileData.name} onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Login ID)</label>
              <input required type="email" className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800 ${emailChanged ? 'border-amber-200 ring-4 ring-amber-500/10' : 'border-slate-100'}`} value={profileData.email} onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))} />
              {emailChanged && (
                <div className="p-3 bg-amber-50 rounded-xl flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase">
                  <AlertTriangle size={14} /> ID Change detected
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 tracking-wider">Secure Password</label>
              <div className="relative">
                <input required type="password" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold" value={profileData.password} onChange={e => setProfileData(prev => ({ ...prev, password: e.target.value }))} />
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-100 active:scale-95 transition-all mt-6 uppercase tracking-widest text-xs">Save Settings</button>
          </form>
        </div>
      )}

      {/* Simulated Secure Payment Gateway (Stripe Style) */}
      {showPaymentGateway && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[50px] p-10 animate-in slide-in-from-bottom-full duration-500 shadow-2xl relative">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
            
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Checkout</h3>
                <p className="text-sm font-bold text-slate-400">{showPaymentGateway.name}</p>
              </div>
              <button onClick={() => setShowPaymentGateway(null)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 active:scale-90 transition-all">
                <X size={24} />
              </button>
            </div>

            {isProcessing ? (
              <div className="py-20 flex flex-col items-center justify-center gap-6">
                 <Loader2 size={64} className="text-indigo-600 animate-spin" />
                 <div className="text-center">
                   <h4 className="text-xl font-black text-slate-800">Processing Payment...</h4>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Connecting to Secure Server</p>
                 </div>
              </div>
            ) : (
              <form onSubmit={handlePurchase} className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 mb-6">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Price</span>
                      <span className="text-3xl font-black text-indigo-600">${showPaymentGateway.price}.00</span>
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase">Adding {showPaymentGateway.credits} credits to your account</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Number</label>
                    <div className="relative">
                       <input required placeholder="0000 0000 0000 0000" className="w-full pl-12 pr-5 py-5 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-mono font-bold tracking-widest" value={paymentForm.card} onChange={e => setPaymentForm({...paymentForm, card: e.target.value.replace(/\D/g, '').substring(0,16)})} />
                       <CreditCard size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry</label>
                      <input required placeholder="MM/YY" className="w-full px-5 py-5 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-center" value={paymentForm.expiry} onChange={e => setPaymentForm({...paymentForm, expiry: e.target.value.substring(0,5)})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CVV</label>
                      <input required type="password" placeholder="***" className="w-full px-5 py-5 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-center" value={paymentForm.cvv} onChange={e => setPaymentForm({...paymentForm, cvv: e.target.value.replace(/\D/g, '').substring(0,3)})} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-4 text-center">
                   <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
                   <span className="text-[10px] font-black text-slate-400 uppercase">Encrypted & Secure Transaction via Stripe</span>
                </div>

                <button type="submit" className="w-full py-6 bg-indigo-600 text-white font-black rounded-[28px] shadow-2xl shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                  <DollarSign size={20} /> PAY NOW
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Purchase Success Feedback */}
      {showPurchaseSuccess && (
        <div className="fixed inset-0 bg-indigo-600/95 backdrop-blur-xl z-[300] flex flex-col items-center justify-center p-10 animate-in fade-in duration-500">
           <div className="w-32 h-32 bg-white text-indigo-600 rounded-[45px] flex items-center justify-center shadow-2xl mb-8 animate-bounce">
             <CheckCircle2 size={64} strokeWidth={3} />
           </div>
           <div className="text-center space-y-3">
             <h3 className="text-4xl font-black text-white tracking-tight">Payment Received!</h3>
             <p className="text-indigo-100 font-bold uppercase tracking-widest text-sm">Your credits have been updated.</p>
           </div>
           <button onClick={() => setShowPurchaseSuccess(false)} className="mt-12 bg-white text-indigo-600 px-10 py-5 rounded-3xl font-black shadow-xl active:scale-90 transition-all uppercase tracking-widest text-xs">Awesome!</button>
        </div>
      )}
    </div>
  );
};

export default TraineeView;
