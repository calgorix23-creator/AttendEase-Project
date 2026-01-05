
import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, User } from '../types';
import { Plus, QrCode, ClipboardList, Calendar as CalendarIcon, X, Edit2, Trash2, AlertCircle, ShieldCheck, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface TrainerViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  trainees: User[];
  onAddClass: (cls: AttendanceClass) => void;
  onUpdateClass: (cls: AttendanceClass) => void;
  onDeleteClass: (id: string) => void;
  onToggleAttendance: (classId: string, traineeId: string, method: 'STAFF') => { success: boolean; message: string };
  onUpdateUser: (user: User) => void;
}

const TrainerView: React.FC<TrainerViewProps> = ({ user, classes, attendance, trainees, onAddClass, onUpdateClass, onDeleteClass, onToggleAttendance, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'profile'>('classes');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  
  // Separation of states to prevent overlap bug
  const [manualClass, setManualClass] = useState<AttendanceClass | null>(null);
  const [qrClass, setQrClass] = useState<AttendanceClass | null>(null);
  
  const [manualFeedback, setManualFeedback] = useState<{ type: 'error' | 'success' | 'warning', text: string } | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [classForm, setClassForm] = useState({ name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
  const [profileData, setProfileData] = useState({ name: user.name, email: user.email, phone: user.phoneNumber || '', password: user.password || '' });

  useEffect(() => {
    if (editingClass) setClassForm({ name: editingClass.name, location: editingClass.location, date: editingClass.date, time: editingClass.time });
    else if (showModal) setClassForm({ name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
    setInlineError(null);
  }, [editingClass, showModal]);

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = classForm.name.toLowerCase().trim();
    const isDuplicate = classes.some(c => 
      c.id !== editingClass?.id &&
      c.name.toLowerCase().trim() === normalizedName &&
      c.date === classForm.date &&
      c.time === classForm.time
    );

    if (isDuplicate) {
      setInlineError("Duplicate Error: Already scheduled.");
      return;
    }

    if (editingClass) onUpdateClass({ ...editingClass, ...classForm });
    else onAddClass({ id: Math.random().toString(36).substr(2, 9), trainerId: user.id, ...classForm, qrSecret: `AE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, createdAt: Date.now() });
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner gap-1">
        <button onClick={() => setActiveTab('classes')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'classes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><CalendarIcon size={14} /> Sessions</button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><UserIcon size={14} /> Account</button>
      </div>

      {activeTab === 'classes' && (
        <div className="space-y-4 animate-in slide-in-from-left-2">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-base font-medium text-slate-800">My Dashboard</h2>
            <button onClick={() => { setEditingClass(null); setShowModal(true); }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow active:scale-95 transition-all"><Plus size={14} className="inline mr-1" /> Create</button>
          </div>

          <div className="space-y-2">
            {classes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-300 text-[10px] font-bold uppercase tracking-widest">No Active Sessions</div>
            ) : (
              classes.map(cls => {
                const isMine = cls.trainerId === user.id;
                const count = attendance.filter(a => a.classId === cls.id).length;
                return (
                  <div key={cls.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate leading-none mb-1">{cls.name}</div>
                      <div className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">{cls.date} • {cls.time}</div>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[7px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase">{count} Atnd</span>
                        {isMine && <span className="text-[7px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase">Me</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                       <button onClick={() => setQrClass(cls)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg active:scale-95 transition-all"><QrCode size={14} /></button>
                       <button onClick={() => setManualClass(cls)} className="p-2 bg-slate-50 text-slate-500 rounded-lg active:scale-95 transition-all"><ClipboardList size={14} /></button>
                       {isMine && (
                         <div className="flex gap-1">
                           <button onClick={() => { setEditingClass(cls); setShowModal(true); }} className="p-2 text-slate-200 hover:text-indigo-600 transition-colors"><Edit2 size={14} /></button>
                           <button onClick={() => onDeleteClass(cls.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                         </div>
                       )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in slide-in-from-right-2 space-y-4">
          <div className="text-center">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2"><ShieldCheck size={24} /></div>
             <h3 className="text-base font-medium text-slate-800">Trainer Profile</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onUpdateUser({...user, ...profileData}); alert("Saved!"); }} className="space-y-3">
            <div className="space-y-1">
               <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name</label>
               <input required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-medium" value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email ID</label>
               <input required type="email" className={`w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs font-medium ${profileData.email !== user.email ? 'border-amber-300' : 'border-slate-100'}`} value={profileData.email} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))} />
               {profileData.email !== user.email && <div className="p-2 bg-amber-50 rounded-lg text-[7px] text-amber-600 font-bold uppercase">Identity Warning: Modifies unique login ID</div>}
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone</label>
               <input required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-medium" value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
               <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
               <div className="relative">
                 <input required type={showPassword ? 'text' : 'password'} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-medium" value={profileData.password} onChange={e => setProfileData(p => ({ ...p, password: e.target.value }))} />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">{showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
               </div>
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow active:scale-95 text-xs transition-all">Update Access</button>
          </form>
        </div>
      )}

      {/* Manual Marker Modal */}
      {manualClass && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom-2">
          <div className="p-3 border-b flex justify-between items-center shrink-0">
             <div><h3 className="font-bold text-sm tracking-tight leading-tight">Manual Roster</h3><p className="text-[8px] text-indigo-600 font-bold uppercase">{manualClass.name}</p></div>
             <button onClick={() => { setManualClass(null); setManualFeedback(null); }} className="p-2 bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
          </div>
          {manualFeedback && (
            <div className={`mx-3 mt-3 p-2 rounded-xl flex gap-2 animate-in slide-in-from-top-2 shadow-sm ${manualFeedback.type === 'warning' ? 'bg-amber-50 text-amber-700' : manualFeedback.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <AlertCircle size={14} className="shrink-0" />
              <div className="text-[9px] font-bold uppercase leading-tight">{manualFeedback.text}</div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
            {trainees.map(t => {
              const isChecked = attendance.some(a => a.classId === manualClass.id && a.traineeId === t.id);
              return (
                <div key={t.id} className="p-3 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isChecked ? 'bg-emerald-500 text-white' : 'bg-indigo-50 text-indigo-600'}`}>{t.name.charAt(0)}</div>
                    <div><div className="text-[11px] font-semibold text-slate-800">{t.name}</div><div className="text-[8px] text-slate-400 font-medium">{t.credits} Credits</div></div>
                  </div>
                  <button onClick={() => { const res = onToggleAttendance(manualClass.id, t.id, 'STAFF'); setManualFeedback({ type: res.success ? 'success' : 'error', text: res.message }); }} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${isChecked ? 'bg-red-50 text-red-600' : 'bg-indigo-600 text-white'}`}>
                    {isChecked ? 'Remove' : 'Present'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrClass && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in">
           <div className="text-center mb-6 space-y-1">
            <h3 className="text-lg font-bold text-white leading-tight">{qrClass.name}</h3>
            <p className="text-indigo-200 font-bold uppercase tracking-wider text-[8px]">{qrClass.date} • {qrClass.time}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-2xl">
             <QRCodeSVG value={JSON.stringify({ cid: qrClass.id, sec: qrClass.qrSecret, t: Date.now() })} size={180} level="H" includeMargin />
          </div>
          <button onClick={() => setQrClass(null)} className="mt-8 text-white bg-white/10 p-3 rounded-full active:scale-95 transition-all"><X size={24} /></button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold">{editingClass ? 'Edit' : 'New'} Session</h3><button onClick={() => setShowModal(false)} className="text-slate-300"><X size={20} /></button></div>
            <form onSubmit={handleClassSubmit} className="space-y-3">
              {inlineError && <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-[9px] text-red-700 font-bold uppercase leading-tight">{inlineError}</div>}
              <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Title</label><input placeholder="Class Name" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} /></div>
              <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Location</label><input placeholder="Location" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium" value={classForm.location} onChange={e => setClassForm({...classForm, location: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Date</label><input type="date" required className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium outline-none" value={classForm.date} onChange={e => setClassForm({...classForm, date: e.target.value})} /></div>
                <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Time</label><input type="time" required className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium outline-none" value={classForm.time} onChange={e => setClassForm({...classForm, time: e.target.value})} /></div>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow mt-1 text-xs active:scale-95 transition-all">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerView;
