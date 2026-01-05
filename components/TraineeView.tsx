import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AttendanceClass, AttendanceRecord, User, PaymentRecord, CreditPackage } from '../types';
import { QrCode, History, ShoppingBag, CheckCircle2, X, CreditCard, Camera, User as UserIcon, Loader2, AlertCircle, Trash2, Eye, EyeOff, Upload, CalendarDays, Calendar } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface TraineeViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  packages: CreditPackage[];
  onToggleAttendance: (classId: string, traineeId: string, method: 'SELF') => { success: boolean, message: string };
  onPurchase: (payment: PaymentRecord) => void;
  onUpdateUser: (user: User) => void;
}

const TraineeView: React.FC<TraineeViewProps> = ({ user, classes, attendance, payments, packages, onToggleAttendance, onPurchase, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'shop' | 'profile'>('scan');
  const [historySubTab, setHistorySubTab] = useState<'attendance' | 'purchases'>('attendance');
  const [isScanning, setIsScanning] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState<CreditPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | 'warning', text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState({ name: user.name, email: user.email, phone: user.phoneNumber || '', password: user.password || '' });
  
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss status messages on tab change
  useEffect(() => { setStatusMessage(null); }, [activeTab]);

  // Click-away to dismiss alerts
  useEffect(() => {
    const handleClickAway = () => { if (statusMessage) setStatusMessage(null); };
    window.addEventListener('click', handleClickAway);
    return () => window.removeEventListener('click', handleClickAway);
  }, [statusMessage]);

  // Data Selectors
  const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []); // YYYY-MM-DD local
  const traineeAttendance = useMemo(() => attendance.filter(a => a.traineeId === user.id), [attendance, user.id]);
  const traineePayments = useMemo(() => payments.filter(p => p.traineeId === user.id), [payments, user.id]);

  /**
   * Refined 30-Minute Rule Cancellation Logic (v3.1 Reference)
   */
  const canCancel = (classTime: string, classDate: string) => {
    const sessionDate = new Date(`${classDate}T${classTime}`);
    const now = new Date();
    const diffInMs = sessionDate.getTime() - now.getTime();
    const diffInMins = diffInMs / (1000 * 60);
    return diffInMins > 30;
  };

  const handleTraineeCancel = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;

    if (!canCancel(cls.time, cls.date)) {
      setStatusMessage({ type: 'warning', text: "Cancellation Locked (30m Rule)." });
      return;
    }

    if (window.confirm("Confirm cancellation? 1 Credit will be refunded.")) {
      const res = onToggleAttendance(classId, user.id, 'SELF');
      if (res.success) {
        setStatusMessage({ type: 'success', text: "Booking cancelled. Credit refunded." });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }
  };

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentGateway) return;
    setIsProcessing(true);
    setTimeout(() => {
      const payment: PaymentRecord = {
        id: Math.random().toString(36).substr(2, 9),
        traineeId: user.id,
        amount: showPaymentGateway.price,
        credits: showPaymentGateway.credits,
        timestamp: Date.now(),
        status: 'SUCCESS'
      };
      onPurchase(payment);
      setIsProcessing(false);
      setShowPaymentGateway(null);
      setShowPurchaseSuccess(true);
    }, 1500);
  };

  const processQrData = async (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.cid) {
        const res = onToggleAttendance(data.cid, user.id, 'SELF');
        if (res.success) {
          await stopScanner();
          setStatusMessage({ type: 'success', text: "Success! Enjoy your session." });
          setActiveTab('history');
          return true;
        } else {
          setStatusMessage({ type: 'error', text: res.message });
          await stopScanner();
        }
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: "Invalid QR code format." });
      await stopScanner();
    }
    return false;
  };

  const stopScanner = async () => {
    if (qrScannerRef.current?.isScanning) await qrScannerRef.current.stop();
    qrScannerRef.current = null;
    setIsScanning(false);
  };

  const startScanner = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        qrScannerRef.current = scanner;
        await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, processQrData, () => {});
      } catch (err) {
        setStatusMessage({ type: 'error', text: "Camera access denied or failed." });
        setIsScanning(false);
      }
    }, 300);
  };

  // Lists for Sessions Tab
  const myBookedIds = useMemo(() => new Set(traineeAttendance.map(a => a.classId)), [traineeAttendance]);

  const availableToday = classes.filter(cls => {
    if (cls.date !== todayStr || myBookedIds.has(cls.id)) return false;
    const sessionDate = new Date(`${cls.date}T${cls.time}`);
    const now = new Date();
    // Show if class hasn't started or started less than 30 mins ago
    return (sessionDate.getTime() + (30 * 60 * 1000)) > now.getTime();
  });

  const availableAdvance = classes.filter(cls => {
    return cls.date > todayStr && !myBookedIds.has(cls.id);
  }).sort((a, b) => a.date.localeCompare(b.date));

  const currentBookings = traineeAttendance.map(a => ({
    record: a,
    cls: classes.find(c => c.id === a.classId)
  })).filter(item => item.cls && (new Date(`${item.cls.date}T${item.cls.time}`).getTime() + (30 * 60 * 1000) > Date.now()));

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner gap-1">
        {[
          { id: 'scan', icon: QrCode, label: 'SESSIONS' },
          { id: 'history', icon: History, label: 'ACTIVITY' },
          { id: 'shop', icon: ShoppingBag, label: 'WALLET' },
          { id: 'profile', icon: UserIcon, label: 'PROFILE' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-2 rounded-lg text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'scan' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 pb-16">
          {statusMessage && (
            <div onClick={(e) => { e.stopPropagation(); setStatusMessage(null); }} className={`p-3 rounded-2xl flex items-start gap-3 shadow-lg border cursor-pointer animate-in zoom-in ${statusMessage.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : statusMessage.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
               <AlertCircle size={18} className="shrink-0 mt-0.5" />
               <div className="flex-1">
                 <div className="text-[10px] font-bold uppercase leading-tight tracking-wide">{statusMessage.text}</div>
                 <div className="text-[7px] font-bold uppercase opacity-50 mt-1">Click to dismiss</div>
               </div>
               <X size={14} className="shrink-0 opacity-40" />
            </div>
          )}

          <div className="p-6 bg-indigo-600 rounded-3xl text-white flex flex-col items-center gap-4 shadow relative overflow-hidden">
             <div className="text-center space-y-0.5">
                <h2 className="text-lg font-bold italic tracking-tight">Check-in</h2>
                <p className="text-[8px] font-semibold text-indigo-200 uppercase tracking-widest">Scan QR at Studio</p>
             </div>
             <div className="flex gap-4">
               <button onClick={startScanner} className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"><Camera size={20} /></button>
               <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-white/20 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 border border-white/20"><Upload size={20} /></button>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                 if (e.target.files?.length) {
                   const scanner = new Html5Qrcode("reader");
                   scanner.scanFile(e.target.files[0], true).then(processQrData).catch(() => setStatusMessage({ type: 'error', text: 'No QR found in image' }));
                 }
               }} />
             </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-800 px-1 flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-600"/> Current Bookings</h3>
             <div className="space-y-2">
                {currentBookings.map(item => {
                  const cancellable = item.cls ? canCancel(item.cls.time, item.cls.date) : false;
                  return (
                    <div key={item.record.id} className="bg-white p-3 rounded-2xl border border-indigo-100 flex justify-between items-center shadow-sm">
                       <div className="min-w-0">
                          <div className="text-[11px] font-bold text-indigo-600 truncate">{item.cls?.name}</div>
                          <div className="text-[8px] font-medium text-slate-400 uppercase">{item.cls?.time} • {item.cls?.location}</div>
                          <div className={`text-[7px] font-bold uppercase mt-1 ${cancellable ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {cancellable ? 'Confirmed' : 'Locked (Starts Soon)'}
                          </div>
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); handleTraineeCancel(item.record.classId); }} className={`p-2 transition-all active:scale-90 ${cancellable ? 'text-slate-300 hover:text-red-500' : 'text-slate-200 cursor-not-allowed opacity-50'}`} disabled={!cancellable}>
                         <Trash2 size={16} />
                       </button>
                    </div>
                  );
                })}
                {availableToday.map(cls => (
                  <div key={cls.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                     <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-800 truncate">{cls.name}</div>
                        <div className="text-[8px] font-medium text-slate-400 uppercase">{cls.time} • {cls.location}</div>
                     </div>
                     <button onClick={(e) => { e.stopPropagation(); const res = onToggleAttendance(cls.id, user.id, 'SELF'); setStatusMessage({ type: res.success ? 'success' : 'error', text: res.message }); }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase active:scale-95">Book</button>
                  </div>
                ))}
                {availableToday.length === 0 && currentBookings.filter(b => b.cls?.date === todayStr).length === 0 && (
                  <div className="text-center py-6 text-slate-300 text-[9px] font-bold uppercase border border-dashed rounded-2xl">No more sessions today</div>
                )}
             </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-800 px-1 flex items-center gap-2"><CalendarDays size={14} className="text-indigo-600"/> Future Options</h3>
             <div className="space-y-2">
                {availableAdvance.map(cls => (
                  <div key={cls.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                     <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-800 truncate">{cls.name}</div>
                        <div className="text-[8px] font-medium text-slate-400 uppercase">{cls.date} • {cls.time}</div>
                     </div>
                     <button onClick={(e) => { e.stopPropagation(); const res = onToggleAttendance(cls.id, user.id, 'SELF'); setStatusMessage({ type: res.success ? 'success' : 'error', text: res.message }); }} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase active:scale-95">Book</button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-in slide-in-from-right-2 pb-24">
           <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
             <button onClick={() => setHistorySubTab('attendance')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-bold uppercase ${historySubTab === 'attendance' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Logbook</button>
             <button onClick={() => setHistorySubTab('purchases')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-bold uppercase ${historySubTab === 'purchases' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Wallet</button>
           </div>
           
           {historySubTab === 'attendance' ? (
               traineeAttendance.length === 0 ? (
                 <div className="text-center py-12 text-slate-300 text-[10px] font-bold uppercase">No session activity yet</div>
               ) : (
                 [...traineeAttendance].reverse().map(rec => {
                   const cls = classes.find(c => c.id === rec.classId);
                   const cancellable = cls ? canCancel(cls.time, cls.date) : false;
                   return (
                     <div key={rec.id} className="bg-white p-3 rounded-2xl border border-slate-50 shadow-sm flex justify-between items-center">
                        <div className="min-w-0 flex-1 pr-2">
                           <div className="text-[11px] font-semibold text-slate-800 truncate">{cls?.name || 'Session'}</div>
                           <div className="text-[8px] font-medium text-slate-400 uppercase">{cls?.date || 'Past'} • {cls?.time || ''}</div>
                           <div className={`text-[7px] font-bold uppercase mt-1 ${cancellable ? 'text-emerald-500' : 'text-slate-400'}`}>
                             {cancellable ? 'Upcoming' : 'Locked/Completed'}
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`text-[7px] font-bold px-2 py-1 rounded-full uppercase ${rec.method === 'SELF' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>{rec.method === 'SELF' ? 'Self' : 'Staff'}</div>
                          {cancellable && (
                            <button onClick={(e) => { e.stopPropagation(); handleTraineeCancel(rec.classId); }} className="p-1.5 bg-red-50 text-red-500 rounded-lg active:scale-90"><Trash2 size={12} /></button>
                          )}
                        </div>
                     </div>
                   );
                 })
               )
             ) : (
               [...traineePayments].reverse().map(p => (
                 <div key={p.id} className="bg-white p-3 rounded-2xl border border-slate-50 shadow-sm flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                       <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs italic">S$</div>
                       <div><div className="text-[11px] font-semibold text-slate-800">+{p.credits} Credits</div><div className="text-[8px] text-slate-400 font-medium uppercase">{new Date(p.timestamp).toLocaleDateString()}</div></div>
                    </div>
                    <div className="text-xs font-bold text-slate-900">S${p.amount}</div>
                 </div>
               ))
             )}
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="space-y-4 animate-in slide-in-from-right-2 pb-24">
          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow flex justify-between items-end">
             <div><p className="text-[8px] font-bold uppercase opacity-60 tracking-widest mb-1">My Balance</p><h2 className="text-3xl font-bold">{user.credits || 0} Cr</h2></div>
             <ShoppingBag size={32} className="opacity-30 mb-1" />
          </div>
          <div className="grid grid-cols-1 gap-3">
             {packages.map(pkg => (
               <button key={pkg.id} onClick={() => setShowPaymentGateway(pkg)} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm active:scale-95 text-left transition-all">
                  <div><div className="text-sm font-semibold text-slate-800 leading-tight">{pkg.name}</div><div className="text-[9px] font-medium text-indigo-600 uppercase tracking-wide">{pkg.credits} Training Credits</div></div>
                  <div className="text-base font-bold text-slate-900">S${pkg.price}</div>
               </button>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4 border border-slate-100 animate-in slide-in-from-right-2">
           <div className="text-center">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-inner"><UserIcon size={24} /></div>
              <h3 className="text-base font-medium text-slate-800">{user.name}</h3>
           </div>
           <form onSubmit={(e) => { e.preventDefault(); onUpdateUser({...user, ...profileData, phoneNumber: profileData.phone}); alert("Profile Saved!"); }} className="space-y-3">
              <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name</label><input required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-medium" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email ID</label><input required type="email" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-medium" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone</label><input required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-medium" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} /></div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input required type={showPassword ? 'text' : 'password'} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-medium" value={profileData.password} onChange={e => setProfileData(p => ({ ...p, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">{showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                </div>
              </div>
              <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow active:scale-95 text-xs">Save Profile</button>
           </form>
        </div>
      )}

      {/* Payment Modal with Full Card Details */}
      {showPaymentGateway && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-end justify-center">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[448px] rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start mb-6">
              <div><h3 className="text-lg font-bold text-slate-800">Checkout</h3><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{showPaymentGateway.name}</p></div>
              <button onClick={() => setShowPaymentGateway(null)} className="p-2 bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            {isProcessing ? (
              <div className="py-12 flex flex-col items-center gap-4 text-center"><Loader2 size={32} className="text-indigo-600 animate-spin" /><p className="font-bold text-slate-800 uppercase tracking-widest text-[9px]">Processing...</p></div>
            ) : (
              <form onSubmit={handlePurchase} className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center"><span className="text-[9px] font-bold uppercase text-slate-400">Total</span><span className="text-xl font-bold text-indigo-600">S${showPaymentGateway.price}</span></div>
                <div className="space-y-3">
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input required placeholder="Card Number" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none font-semibold text-xs focus:border-indigo-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input required placeholder="MM/YY" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl outline-none font-semibold text-xs focus:border-indigo-600 text-center" />
                    </div>
                    <input required placeholder="CVV" type="password" maxLength={3} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl outline-none font-semibold text-xs focus:border-indigo-600 text-center" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg text-xs active:scale-95 transition-all uppercase tracking-widest">Authorize Payment</button>
              </form>
            )}
          </div>
        </div>
      )}

      {showPurchaseSuccess && (
        <div className="fixed inset-0 bg-indigo-600/90 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-8 animate-in fade-in">
           <div className="w-16 h-16 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl mb-6 animate-bounce"><CheckCircle2 size={32} /></div>
           <h3 className="text-xl font-bold text-white text-center mb-1">Top-up Successful!</h3>
           <button onClick={() => setShowPurchaseSuccess(false)} className="mt-8 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-lg text-[10px] uppercase active:scale-95 transition-all">Great!</button>
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-in fade-in">
           <div className="p-4 flex justify-between items-center text-white shrink-0">
             <h3 className="font-bold text-sm">Studio Scanner</h3>
             <button onClick={stopScanner} className="p-2 bg-white/10 rounded-full"><X size={20} /></button>
           </div>
           <div id="reader" className="w-full flex-1" />
        </div>
      )}
    </div>
  );
};

export default TraineeView;