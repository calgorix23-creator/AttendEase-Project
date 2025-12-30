
import React, { useState } from 'react';
import { AttendanceClass, AttendanceRecord, User } from '../types';
import { Plus, QrCode, ClipboardList, CheckCircle2, UserPlus, MapPin, Calendar as CalendarIcon, Clock, X, Phone, Mail, AlertCircle, User as UserIcon, Lock, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface TrainerViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  trainees: User[];
  onAddClass: (cls: AttendanceClass) => void;
  onAddAttendance: (rec: AttendanceRecord) => { success: boolean; message: string };
  onUpdateUser: (user: User) => void;
}

const TrainerView: React.FC<TrainerViewProps> = ({ user, classes, attendance, trainees, onAddClass, onAddAttendance, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'profile'>('classes');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClass, setSelectedClass] = useState<AttendanceClass | null>(null);
  const [showManual, setShowManual] = useState(false);
  
  const [className, setClassName] = useState('');
  const [classLocation, setClassLocation] = useState('');
  const [classDate, setClassDate] = useState(new Date().toISOString().split('T')[0]);
  const [classTime, setClassTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phoneNumber || '',
    password: user.password || ''
  });

  const trainerClasses = classes.filter(c => c.trainerId === user.id);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isDuplicate = classes.some(c => 
      c.name.trim().toLowerCase() === className.trim().toLowerCase() &&
      c.date === classDate &&
      c.time === classTime &&
      c.location.trim().toLowerCase() === classLocation.trim().toLowerCase()
    );

    if (isDuplicate) {
      setError("A class with identical details already exists at this date and time.");
      return;
    }

    const newClass: AttendanceClass = {
      id: Math.random().toString(36).substr(2, 9),
      trainerId: user.id,
      name: className.trim(),
      location: classLocation.trim(),
      date: classDate,
      time: classTime,
      qrSecret: `AE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: Date.now()
    };
    onAddClass(newClass);
    setShowCreate(false);
    setClassName('');
    setClassLocation('');
    setError(null);
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
    alert(res.message);
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
    alert("Profile updated successfully! Remember to use your new email for future logins if you changed it.");
  };

  const emailChanged = profileData.email !== user.email;

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('classes')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'classes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          <CalendarIcon size={16} /> My Classes
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          <UserIcon size={16} /> My Profile
        </button>
      </div>

      {activeTab === 'classes' && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Class Board</h2>
            <button 
              onClick={() => { setError(null); setShowCreate(true); }}
              className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-all active:scale-95"
            >
              <Plus size={18} /> New Class
            </button>
          </div>

          <div className="space-y-4">
            {trainerClasses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                <CalendarIcon className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-slate-400 text-sm">No classes created yet</p>
              </div>
            ) : (
              trainerClasses.map(cls => {
                const attendeeCount = attendance.filter(a => a.classId === cls.id).length;
                return (
                  <div key={cls.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start transition-all hover:border-indigo-200">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800">{cls.name}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                          <CalendarIcon size={12} /> {cls.date}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                          <Clock size={12} /> {cls.time}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                          <MapPin size={12} /> {cls.location}
                        </div>
                      </div>
                      <div className="pt-2">
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                          {attendeeCount} Attendee{attendeeCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => setSelectedClass(cls)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><QrCode size={20} /></button>
                      <button onClick={() => { setSelectedClass(cls); setShowManual(true); }} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-600 hover:text-white transition-all"><ClipboardList size={20} /></button>
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
          <div className="text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-indigo-100">
              <UserIcon size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Trainer Profile</h3>
            <p className="text-xs text-slate-500">Manage your profile & login details</p>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
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

      {/* Modal contents for create, QR, manual attendance remain the same... */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-slate-800">Create Class</h3><button onClick={() => setShowCreate(false)} className="text-slate-400"><X /></button></div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-xs font-medium"><AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Class Name</label><input autoFocus required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={className} onChange={e => setClassName(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Location</label><input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={classLocation} onChange={e => setClassLocation(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Date</label><input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={classDate} onChange={e => setClassDate(e.target.value)} /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Time</label><input type="time" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={classTime} onChange={e => setClassTime(e.target.value)} /></div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl mt-4 shadow-lg active:scale-95">Launch Class</button>
            </form>
          </div>
        </div>
      )}

      {selectedClass && !showManual && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-8"><h3 className="text-2xl font-bold text-white mb-2">{selectedClass.name}</h3><div className="flex items-center justify-center gap-3 text-indigo-200 text-xs"><span>{selectedClass.date}</span><span>{selectedClass.time}</span></div></div>
          <div className="bg-white p-8 rounded-[40px] shadow-2xl"><QRCodeSVG value={JSON.stringify({ cid: selectedClass.id, sec: selectedClass.qrSecret, t: Date.now() })} size={240} level="H" includeMargin /></div>
          <button onClick={() => setSelectedClass(null)} className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full"><X size={24} /></button>
        </div>
      )}

      {showManual && selectedClass && (
        <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
          <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center"><h3 className="font-bold text-slate-800">Manual Attendance</h3><button onClick={() => { setShowManual(false); setSelectedClass(null); }} className="p-2"><X /></button></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {trainees.map(t => {
              const isChecked = attendance.some(a => a.classId === selectedClass.id && a.traineeId === t.id);
              return (
                <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">{t.name.charAt(0)}</div><div><div className="text-sm font-bold text-slate-800">{t.name}</div><div className="text-[10px] text-slate-500">{t.email}</div></div></div>
                  {isChecked ? <CheckCircle2 className="text-emerald-500" size={24} /> : <button onClick={() => markManual(t.id)} className="text-indigo-600 bg-indigo-50 p-2 rounded-xl"><UserPlus size={20} /></button>}
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
