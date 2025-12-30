
import React, { useState, useEffect, useRef } from 'react';
import { AttendanceClass, AttendanceRecord, User, PaymentRecord } from '../types';
// Added Mail to the imports below
import { QrCode, History, ShoppingBag, CheckCircle2, X, ChevronRight, CreditCard, DollarSign, Camera, Image as ImageIcon, MapPin, Calendar, Clock, User as UserIcon, Lock, AlertTriangle, Mail } from 'lucide-react';
import { CREDIT_PACKAGES } from '../constants';
import { Html5Qrcode } from 'html5-qrcode';

interface TraineeViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  onCheckIn: (rec: AttendanceRecord) => { success: boolean, message: string };
  onPurchase: (payment: PaymentRecord) => void;
  onUpdateUser: (user: User) => void;
}

const TraineeView: React.FC<TraineeViewProps> = ({ user, classes, attendance, payments, onCheckIn, onPurchase, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'shop' | 'profile'>('scan');
  const [historySubTab, setHistorySubTab] = useState<'attendance' | 'purchases'>('attendance');
  const [isScanning, setIsScanning] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phoneNumber || '',
    password: user.password || ''
  });

  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const traineeAttendance = attendance.filter(a => a.traineeId === user.id);
  const traineePayments = payments.filter(p => p.traineeId === user.id);

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
          setActiveTab('history');
          setHistorySubTab('attendance');
          return true;
        } else {
          alert(res.message);
          return false;
        }
      }
    } catch (e) {
      console.error("Invalid QR content", e);
      alert("Invalid QR Code structure.");
    }
    return false;
  };

  const stopScanner = async () => {
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
          await qrScannerRef.current.stop();
        }
      } catch (e) {
        console.warn("Scanner stop warning:", e);
      } finally {
        qrScannerRef.current = null;
      }
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        qrScannerRef.current = html5QrCode;
        
        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };
        
        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          async (decodedText) => {
            const success = await processQrData(decodedText);
            if (success) {
              // Nav handled
            }
          },
          () => {} 
        );
      } catch (err) {
        console.error("Unable to start scanning", err);
        alert("Camera access failed.");
        setIsScanning(false);
      }
    }, 300);
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
    alert("Profile updated successfully! If you changed your email, use it for your next login.");
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
          alert("Could not find a valid QR code in this image.");
        } finally {
          if (e.target) e.target.value = ""; 
        }
      }} />
      <div id="reader-hidden" className="hidden"></div>

      {/* Main Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('scan')} className={`flex-1 min-w-[70px] py-2 rounded-lg text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'scan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
          <QrCode size={14} /> SCAN
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 min-w-[70px] py-2 rounded-lg text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
          <History size={14} /> HISTORY
        </button>
        <button onClick={() => setActiveTab('shop')} className={`flex-1 min-w-[70px] py-2 rounded-lg text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'shop' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
          <ShoppingBag size={14} /> SHOP
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 min-w-[70px] py-2 rounded-lg text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
          <UserIcon size={14} /> PROFILE
        </button>
      </div>

      {activeTab === 'scan' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Check In</h2>
            <p className="text-sm text-slate-500 px-6">1 Credit will be deducted per session.</p>
          </div>
          {!isScanning ? (
            <div className="space-y-4 px-4">
              <button onClick={startScanner} className="w-full aspect-square bg-white border-2 border-indigo-100 rounded-[40px] flex flex-col items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-xl">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center"><Camera size={40} /></div>
                <span className="text-lg font-bold text-slate-800">Live Scan</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-600 font-bold active:bg-slate-50 shadow-sm"><ImageIcon size={20} /> Browse Gallery</button>
            </div>
          ) : (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col">
              <div className="p-6 flex justify-between items-center text-white shrink-0 bg-slate-900/80 backdrop-blur-md">
                <h3 className="font-bold">Scanning...</h3>
                <button onClick={stopScanner} className="p-2 bg-white/10 rounded-full"><X size={24} /></button>
              </div>
              <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                <div id="reader" className="absolute inset-0 w-full h-full"></div>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <div className="w-[280px] h-[280px] border-2 border-indigo-500 rounded-3xl relative">
                      <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                      <div className="absolute inset-x-0 top-1/2 h-[2px] bg-indigo-500 shadow-[0_0_10px_#6366f1] animate-[scanline_2s_infinite_linear]"></div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
            <button onClick={() => setHistorySubTab('attendance')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${historySubTab === 'attendance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Attendance</button>
            <button onClick={() => setHistorySubTab('purchases')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${historySubTab === 'purchases' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Purchases</button>
          </div>
          {historySubTab === 'attendance' ? (
            <div className="space-y-3">
              {traineeAttendance.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl text-center border border-slate-200 text-slate-400">No sessions recorded.</div>
              ) : (
                traineeAttendance.map(record => {
                  const cls = classes.find(c => c.id === record.classId);
                  return (
                    <div key={record.id} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                             {cls?.name || 'Session Completed'}
                             <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold uppercase">-1 CREDIT</span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {cls && <div className="flex items-center gap-1 text-[10px] text-slate-500"><MapPin size={10} /> {cls.location}</div>}
                            <div className="flex items-center gap-1 text-[10px] text-slate-500"><Clock size={10} /> Checked in at {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(record.timestamp).toLocaleDateString()}</div>
                           <div className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full mt-1 inline-block font-bold">{record.method}</div>
                        </div>
                      </div>
                      {cls && (
                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] font-medium text-slate-400 italic">
                          <span>Scheduled Class Detail:</span>
                          <span className="text-slate-500">{cls.date} @ {cls.time}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {traineePayments.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                  <div><div className="text-sm font-bold text-slate-800">+{p.credits} Credits</div><div className="text-xs text-slate-500">{new Date(p.timestamp).toLocaleString()}</div></div>
                  <div className="text-right font-bold text-slate-900">${p.amount}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300 pb-12">
          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <p className="text-indigo-100 text-[10px] font-bold uppercase mb-1">Current Balance</p>
            <h2 className="text-4xl font-extrabold">{user.credits || 0} <span className="text-xl font-normal opacity-80">Credits</span></h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {CREDIT_PACKAGES.map(pkg => (
              <button key={pkg.id} onClick={() => { onPurchase({ id: Math.random().toString(36).substr(2, 9), traineeId: user.id, amount: pkg.price, credits: pkg.credits, timestamp: Date.now(), status: 'SUCCESS' }); setShowPurchaseSuccess(true); }} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group shadow-sm active:scale-95 transition-all">
                <div className="text-left"><div className="text-sm font-bold text-slate-800">{pkg.name}</div><div className="text-xs text-slate-500">{pkg.credits} Credits</div></div>
                <div className="text-lg font-bold text-slate-900">${pkg.price} <ChevronRight className="inline-block text-slate-300" size={16} /></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-indigo-100">
              <UserIcon size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">My Account</h3>
            <p className="text-xs text-slate-500">Manage your profile & login details</p>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Display Name</label>
              <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={profileData.name} onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Email Address</label>
              <div className="relative">
                <input 
                  type="email"
                  required 
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${emailChanged ? 'border-amber-200' : 'border-slate-100'}`} 
                  value={profileData.email} 
                  onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))} 
                />
                <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
              {emailChanged && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 mt-1 animate-in slide-in-from-top-2">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 leading-tight font-medium">
                    Warning: Changing your email will change your login ID. You must use this new email to sign in next time.
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Phone Number</label>
              <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={profileData.phone} onChange={e => setProfileData(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
              <div className="relative">
                <input type="password" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={profileData.password} onChange={e => setProfileData(prev => ({ ...prev, password: e.target.value }))} />
                <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl mt-4 shadow-lg active:scale-95 transition-transform">Update Account Details</button>
          </form>
        </div>
      )}

      {showPurchaseSuccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} /></div>
            <h3 className="text-xl font-bold text-slate-800">Top-up Successful!</h3>
            <button onClick={() => setShowPurchaseSuccess(false)} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl mt-6 shadow-lg">Great!</button>
          </div>
        </div>
      )}
      <style>{`@keyframes scanline { 0% { top: 10%; } 50% { top: 90%; } 100% { top: 10%; } }`}</style>
    </div>
  );
};

export default TraineeView;
