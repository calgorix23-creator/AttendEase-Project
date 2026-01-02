
import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, User } from '../types';
import { Plus, QrCode, ClipboardList, CheckCircle2, UserPlus, MapPin, Calendar as CalendarIcon, Clock, X, Phone, Mail, AlertCircle, User as UserIcon, Lock, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface TrainerViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  trainees: User[];
  onAddClass: (cls: AttendanceClass) => void;
  onUpdateClass: (cls: AttendanceClass) => void;
  onDeleteClass: (id: string) => void;
  onAddAttendance: (rec: AttendanceRecord) => { success: boolean; message: string };
  onUpdateUser: (user: User) => void;
}

const TrainerView: React.FC<TrainerViewProps> = ({ user, classes, attendance, trainees, onAddClass, onUpdateClass, onDeleteClass, onAddAttendance, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'profile'>('classes');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<AttendanceClass | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualFeedback, setManualFeedback] = useState<{ type: 'error' | 'success' | 'warning', text: string } | null>(null);
  
  const [classForm, setClassForm] = useState({
    name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00'
  });
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phoneNumber || '',
    password: user.password || ''
  });

  useEffect(() => {
    if (editingClass) {
      setClassForm({ name: editingClass.name, location: editingClass.location, date: editingClass.date, time: editingClass.time });
    } else {
      setClassForm({ name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
    }
  }, [editingClass]);

  useEffect(() => {
    if (manualFeedback) {
      const timer = setTimeout(() => setManualFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [manualFeedback]);

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isDuplicate = classes.some(c => 
      c.id !== editingClass?.id &&
      c.date === classForm.date &&
      c.time === classForm.time &&
      c.location.trim().toLowerCase() === classForm.location.trim().toLowerCase()
    );

    if (isDuplicate) {
      setError("A class at this location, date, and time already exists.");
      return;
    }

    if (editingClass) {
      onUpdateClass({ ...editingClass, ...classForm });
    } else {
      const newClass: AttendanceClass = {
        id: Math.random().toString(36).substr(2, 9),
        trainerId: user.id,
        ...classForm,
        qrSecret: `AE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        createdAt: Date.now()
      };
      onAddClass(newClass);
    }
    setShowModal(false);
    setEditingClass(null);
  };

  const markManual = (traineeId: string) => {
    if (!selectedClass) return;
    const res = onAddAttendance({
      id: Math.random().toString(36).substr(2, 9),
      classId: selectedClass.id,
      traineeId,
      timestamp: Date.now(),
      method: 'MANUAL'
    });
    setManualFeedback({ 
      type: res.success ? 'success' : (res.message.toLowerCase().includes("conflict") ? 'warning' : 'error'), 
      text: res.message 
    });
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
    alert("Profile updated successfully!");
  };

  const emailChanged = profileData.email !== user.email;

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button onClick={() => setActiveTab('classes')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'classes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><CalendarIcon size={16} /> Dashboard</button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><UserIcon size={16} /> My Account</button>
      </div>

      {activeTab === 'classes' && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-800">Unified Schedule</h2>
            <button onClick={() => { setError(null); setEditingClass(null); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"><Plus size={18} className="inline mr-1" /> Add Class</button>
          </div>

          <div className="space-y-4">
            {classes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200"><CalendarIcon className="mx-auto text-slate-200 mb-2" size={48} /><p className="text-slate-400 text-sm">No classes scheduled yet.</p></div>
            ) : (
              classes.map(cls => {
                const isMine = cls.trainerId === user.id;
                const attendeeCount = attendance.filter(a => a.classId === cls.id).length;
                return (
                  <div key={cls.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:border-indigo-200 transition-all">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-800">{cls.name}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                         <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><CalendarIcon size={12} /> {cls.date}</div>
                         <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><Clock size={12} /> {cls.time}</div>
                         <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><MapPin size={12} /> {cls.location}</div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase">{attendeeCount} Checked In</span>
                        {isMine && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase">Your Class</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                       <button onClick={() => setSelectedClass(cls)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all active:scale-90"><QrCode size={18} /></button>
                       <button onClick={() => { setSelectedClass(cls); setShowManual(true); }} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all active:scale-90"><ClipboardList size={18} /></button>
                       <button onClick={() => { setEditingClass(cls); setShowModal(true); }} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all active:scale-90"><Edit2 size={18} /></button>
                       <button onClick={() => onDeleteClass(cls.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all active:scale-90"><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-in slide-in-from-right-4 duration-300">
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Full Name</label>
              <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={profileData.name} onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-wider">Email (Login ID)</label>
              <input required type="email" className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${emailChanged ? 'border-amber-200' : 'border-slate-100'}`} value={profileData.email} onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))} />
              {emailChanged && <p className="text-[10px] text-amber-600 font-black px-1 mt-1 uppercase">Changes your Login Access</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Password</label>
              <input type="password" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={profileData.password} onChange={e => setProfileData(prev => ({ ...prev, password: e.target.value }))} />
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl mt-4 shadow-xl active:scale-95 transition-all">Save Changes</button>
          </form>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-800 tracking-tight">{editingClass ? 'Edit Session' : 'Schedule Session'}</h3><button onClick={() => { setShowModal(false); setEditingClass(null); }} className="text-slate-400"><X /></button></div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-[10px] font-black uppercase"><AlertCircle size={14} className="shrink-0" /><span>{error}</span></div>}
            <form onSubmit={handleClassSubmit} className="space-y-4">
              <input placeholder="Class Name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
              <input placeholder="Venue" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={classForm.location} onChange={e => setClassForm({...classForm, location: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" required className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold" value={classForm.date} onChange={e => setClassForm({...classForm, date: e.target.value})} />
                <input type="time" required className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold" value={classForm.time} onChange={e => setClassForm({...classForm, time: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl mt-4 shadow-xl active:scale-95 transition-all">
                {editingClass ? 'Update Session' : 'Launch Session'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedClass && !showManual && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8">
           <div className="text-center mb-10 space-y-2">
            <h3 className="text-3xl font-black text-white leading-tight">{selectedClass.name}</h3>
            <p className="text-indigo-200 font-black uppercase tracking-[0.2em] text-xs">{selectedClass.date} • {selectedClass.time}</p>
          </div>
          <div className="bg-white p-10 rounded-[50px] shadow-2xl">
            <QRCodeSVG value={JSON.stringify({ cid: selectedClass.id, sec: selectedClass.qrSecret, t: Date.now() })} size={260} level="H" includeMargin />
          </div>
          <button onClick={() => setSelectedClass(null)} className="mt-12 text-white bg-white/10 p-5 rounded-full active:scale-90 transition-all"><X size={32} /></button>
        </div>
      )}

      {showManual && selectedClass && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="p-5 border-b flex justify-between items-center shadow-sm">
            <div>
              <h3 className="font-black text-slate-800">Manual Check-In</h3>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{selectedClass.name}</p>
            </div>
            <button onClick={() => { setShowManual(false); setSelectedClass(null); setManualFeedback(null); }} className="p-2 bg-slate-100 rounded-xl"><X size={20} /></button>
          </div>
          
          {manualFeedback && (
            <div className={`mx-5 mt-5 p-4 rounded-2xl flex gap-3 animate-in slide-in-from-top-4 ${
              manualFeedback.type === 'warning' ? 'bg-amber-50 border border-amber-100 text-amber-800' : 
              manualFeedback.type === 'error' ? 'bg-red-50 border border-red-100 text-red-800' : 
              'bg-emerald-50 border border-emerald-100 text-emerald-800'
            }`}>
              {manualFeedback.type === 'warning' ? <AlertTriangle size={18} className="shrink-0" /> : 
               manualFeedback.type === 'error' ? <AlertCircle size={18} className="shrink-0" /> : 
               <CheckCircle2 size={18} className="shrink-0" />}
              <div className="text-[11px] font-black uppercase leading-relaxed">{manualFeedback.text}</div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar">
            {trainees.map(t => {
              const isChecked = attendance.some(a => a.classId === selectedClass.id && a.traineeId === t.id);
              return (
                <div key={t.id} className="p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm bg-white active:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">{t.name.charAt(0)}</div>
                    <div><div className="text-sm font-black text-slate-800">{t.name}</div><div className="text-[10px] text-slate-400 font-bold">{t.email}</div></div>
                  </div>
                  {isChecked ? <div className="bg-emerald-500 text-white p-1.5 rounded-lg shadow-sm"><CheckCircle2 size={18} /></div> : <button onClick={() => markManual(t.id)} className="text-indigo-600 bg-indigo-50 p-2.5 rounded-xl active:scale-90 transition-all"><UserPlus size={20} /></button>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerView;
