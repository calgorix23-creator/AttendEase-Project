import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, User, UserRole, CreditPackage, PaymentRecord } from '../types';
import { 
  Users, Calendar, X, LayoutDashboard, Edit2, ShieldCheck, 
  ShoppingBag, Plus, Trash2, QrCode, ClipboardList, CheckCircle2, 
  AlertCircle, Eye, EyeOff, Minus, MapPin
} from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, Tooltip } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

interface AdminViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  users: User[];
  packages: CreditPackage[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onAddClass: (cls: AttendanceClass) => void;
  onUpdateClass: (cls: AttendanceClass) => void;
  onDeleteClass: (id: string) => void;
  onToggleAttendance: (classId: string, traineeId: string, method: 'STAFF') => { success: boolean; message: string };
  onUpdatePackages: (packages: CreditPackage[]) => void;
  onAdjustCredits: (traineeId: string, delta: number) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  user, classes, attendance, payments, users, packages, 
  onAddUser, onUpdateUser, onDeleteUser, onAddClass, onUpdateClass, onDeleteClass, onToggleAttendance, onUpdatePackages, onAdjustCredits 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'classes' | 'shop' | 'profile'>('dashboard');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [selectedClass, setSelectedClass] = useState<AttendanceClass | null>(null);
  
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: UserRole.TRAINEE, password: '' });
  const [classData, setClassData] = useState({ name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
  const [pkgData, setPkgData] = useState({ name: '', credits: 10, price: 100 });
  const [profileData, setProfileData] = useState({ name: user.name, email: user.email, phone: user.phoneNumber || '', password: user.password || '' });

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const sessionsToday = classes.filter(c => c.date === todayStr).length;
  const totalCheckIns = attendance.length;

  useEffect(() => {
    if (editingUser) setFormData({ name: editingUser.name, email: editingUser.email, phone: editingUser.phoneNumber || '', role: editingUser.role, password: editingUser.password || 'password123' });
    else if (showUserModal) setFormData({ name: '', email: '', phone: '', role: UserRole.TRAINEE, password: Math.random().toString(36).slice(-8) });
  }, [editingUser, showUserModal]);

  useEffect(() => {
    if (editingClass) setClassData({ name: editingClass.name, location: editingClass.location, date: editingClass.date, time: editingClass.time });
    else if (showClassModal) setClassData({ name: '', location: '', date: todayStr, time: '10:00' });
    setErrorFeedback(null);
  }, [editingClass, showClassModal]);

  useEffect(() => {
    if (editingPackage) setPkgData({ name: editingPackage.name, credits: editingPackage.credits, price: editingPackage.price });
    else if (showPackageModal) setPkgData({ name: '', credits: 10, price: 100 });
  }, [editingPackage, showPackageModal]);

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) onUpdateUser({ ...editingUser, ...formData, phoneNumber: formData.phone });
    else onAddUser({ id: Math.random().toString(36).substr(2, 9), ...formData, phoneNumber: formData.phone, ...(formData.role === UserRole.TRAINEE ? { credits: 0 } : {}) });
    setShowUserModal(false);
  };

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isDuplicate = classes.some(c => 
      c.id !== editingClass?.id && 
      c.name.trim().toLowerCase() === classData.name.trim().toLowerCase() && 
      c.date === classData.date && 
      c.time === classData.time
    );
    if (isDuplicate) {
      setErrorFeedback("Duplicate Error: Session exists for this time.");
      return;
    }
    if (editingClass) onUpdateClass({ ...editingClass, ...classData });
    else onAddClass({ id: Math.random().toString(36).substr(2, 9), trainerId: user.id, ...classData, qrSecret: `AE-ADM-${Math.random().toString(36).substr(2, 4).toUpperCase()}`, createdAt: Date.now() });
    setShowClassModal(false);
  };

  const handlePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPkg = { id: editingPackage?.id || Math.random().toString(36).substr(2, 9), ...pkgData };
    if (editingPackage) onUpdatePackages(packages.map(p => p.id === newPkg.id ? newPkg : p));
    else onUpdatePackages([...packages, newPkg]);
    setShowPackageModal(false);
  };

  const chartData = [...classes].slice(0, 5).reverse().map(cls => ({
    name: cls.name.substring(0, 8),
    count: attendance.filter(a => a.classId === cls.id).length
  }));

  return (
    <div className="space-y-4">
      {/* Compact Top Navigation */}
      <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner gap-1">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'HUB' },
          { id: 'users', icon: Users, label: 'USERS' },
          { id: 'classes', icon: Calendar, label: 'CLASS' },
          { id: 'shop', icon: ShoppingBag, label: 'SHOP' },
          { id: 'profile', icon: ShieldCheck, label: 'ADMN' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all flex flex-col items-center justify-center ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <Calendar className="text-indigo-600 mb-1" size={16} />
              <div className="text-xl font-bold text-slate-800">{sessionsToday}</div>
              <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">Sessions Today</div>
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <CheckCircle2 className="text-emerald-500 mb-1" size={16} />
              <div className="text-xl font-bold text-slate-800">{totalCheckIns}</div>
              <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">Check-ins</div>
            </div>
          </div>
          <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow flex justify-between items-center">
             <div><p className="text-[8px] font-bold uppercase tracking-[0.1em] opacity-70">Sales</p><h2 className="text-2xl font-bold leading-none">S${totalRevenue.toLocaleString()}</h2></div>
             <div className="text-[10px] font-bold italic opacity-40">SGD</div>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 h-40">
            <h3 className="text-[8px] font-bold text-slate-400 mb-2 uppercase tracking-widest text-center">Top Sessions</h3>
            <ResponsiveContainer width="100%" height="80%">
              <ReBarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: 10 }} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-3 animate-in slide-in-from-right-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-medium text-slate-800">Accounts</h3>
            <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="bg-indigo-600 text-white p-2 rounded-xl shadow active:scale-95 transition-all"><Plus size={16} /></button>
          </div>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0 ${u.role === UserRole.ADMIN ? 'bg-rose-500' : u.role === UserRole.TRAINER ? 'bg-indigo-500' : 'bg-emerald-500'}`}>{u.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate leading-none">{u.name}</div>
                    <div className="text-[8px] text-slate-400 font-medium uppercase mt-0.5 tracking-tight">{u.role} • {u.credits || 0} Credits</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                   {u.role === UserRole.TRAINEE && (
                     <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-0.5 mr-1">
                        <button onClick={() => onAdjustCredits(u.id, -1)} className="p-1 hover:text-red-500"><Minus size={12}/></button>
                        <span className="text-[10px] font-bold px-1.5 min-w-[20px] text-center">{u.credits || 0}</span>
                        <button onClick={() => onAdjustCredits(u.id, 1)} className="p-1 hover:text-emerald-500"><Plus size={12}/></button>
                     </div>
                   )}
                   <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-1.5 text-slate-300 hover:text-indigo-600"><Edit2 size={14} /></button>
                   <button onClick={() => onDeleteUser(u.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="space-y-3 animate-in slide-in-from-right-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-medium text-slate-800">Schedule</h3>
            <button onClick={() => { setEditingClass(null); setShowClassModal(true); }} className="bg-indigo-600 text-white p-2 rounded-xl shadow active:scale-95 transition-all"><Plus size={16} /></button>
          </div>
          <div className="space-y-2">
            {classes.map(cls => {
              const attendeeCount = attendance.filter(a => a.classId === cls.id).length;
              const creator = users.find(u => u.id === cls.trainerId);
              return (
                <div key={cls.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-800 truncate leading-none">{cls.name}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-[8px] text-slate-400 font-medium uppercase tracking-tight">{cls.date} • {cls.time}</div>
                      <div className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 rounded-full font-bold uppercase">{attendeeCount} Atnd</div>
                    </div>
                    <div className="flex items-center gap-1 text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                      <MapPin size={8} /> {cls.location} {creator && <span>• By: {creator.name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                     <button onClick={() => { setSelectedClass(cls); setShowQRModal(true); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><QrCode size={14} /></button>
                     <button onClick={() => { setSelectedClass(cls); setShowManual(true); }} className="p-1.5 bg-slate-50 text-slate-600 rounded-lg"><ClipboardList size={14} /></button>
                     <button onClick={() => { setEditingClass(cls); setShowClassModal(true); }} className="p-1.5 text-slate-200 hover:text-indigo-600"><Edit2 size={14} /></button>
                     <button onClick={() => onDeleteClass(cls.id)} className="p-1.5 text-slate-200 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="space-y-3 animate-in slide-in-from-right-2">
           <div className="flex justify-between items-center px-1">
             <h3 className="text-base font-medium text-slate-800">Packages</h3>
             <button onClick={() => { setEditingPackage(null); setShowPackageModal(true); }} className="bg-indigo-600 text-white p-2 rounded-xl shadow active:scale-95 transition-all"><Plus size={16} /></button>
           </div>
           <div className="space-y-2">
             {packages.map(pkg => (
               <div key={pkg.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                 <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800">{pkg.name}</div>
                    <div className="text-[8px] text-indigo-600 font-bold uppercase tracking-wide">{pkg.credits} Credits • S${pkg.price}</div>
                 </div>
                 <div className="flex gap-1 shrink-0">
                   <button onClick={() => { setEditingPackage(pkg); setShowPackageModal(true); }} className="p-1.5 text-slate-200 hover:text-amber-500"><Edit2 size={14} /></button>
                   <button onClick={() => onUpdatePackages(packages.filter(p => p.id !== pkg.id))} className="p-1.5 text-slate-200 hover:text-red-500"><Trash2 size={14} /></button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4 border border-slate-100 animate-in slide-in-from-right-2">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2"><ShieldCheck size={24} /></div>
            <h3 className="text-base font-medium text-slate-800">Admin Identity</h3>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onUpdateUser({ ...user, name: profileData.name, email: profileData.email, phoneNumber: profileData.phone, password: profileData.password }); alert("Saved!"); }} className="space-y-3">
            <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name</label><input required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-medium" value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email ID</label>
              <input required type="email" className={`w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs font-medium ${profileData.email !== user.email ? 'border-amber-300' : 'border-slate-100'}`} value={profileData.email} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))} />
              {profileData.email !== user.email && <div className="p-2 bg-amber-50 rounded-lg text-[7px] text-amber-600 font-bold uppercase">Identity Guard: Changing email affects login ID.</div>}
            </div>
            <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone</label><input required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-medium" value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label><input required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-medium" value={profileData.password} onChange={e => setProfileData(p => ({ ...p, password: e.target.value }))} /></div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow active:scale-95 text-xs">Save Changes</button>
          </form>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-sm tracking-tight">{editingUser ? 'Edit' : 'New'} Account</h3><button onClick={() => setShowUserModal(false)} className="text-slate-300"><X size={20} /></button></div>
            <form onSubmit={handleUserSubmit} className="space-y-3">
              <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Name</label><input required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-medium" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Email</label><input type="email" required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-medium" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Phone</label><input required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-medium" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Password</label><input required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-medium" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
              <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Role</label><select className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-medium appearance-none" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}><option value={UserRole.TRAINEE}>Trainee</option><option value={UserRole.TRAINER}>Trainer</option><option value={UserRole.ADMIN}>Admin</option></select></div>
              <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow mt-1 text-xs">Complete Setup</button>
            </form>
          </div>
        </div>
      )}

      {/* Class Editor Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold">{editingClass ? 'Edit' : 'New'} Session</h3><button onClick={() => setShowClassModal(false)} className="text-slate-300"><X size={20} /></button></div>
            <form onSubmit={handleClassSubmit} className="space-y-3">
               {errorFeedback && <div className="p-2 bg-red-50 text-[7px] text-red-600 font-bold uppercase rounded-lg border border-red-100">{errorFeedback}</div>}
               <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Session Name</label><input required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium" value={classData.name} onChange={e => setClassData({...classData, name: e.target.value})} /></div>
               <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Location</label><input required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium" value={classData.location} onChange={e => setClassData({...classData, location: e.target.value})} /></div>
               <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Date</label><input type="date" required className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium outline-none" value={classData.date} onChange={e => setClassData({...classData, date: e.target.value})} /></div>
                 <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Time</label><input type="time" required className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium outline-none" value={classData.time} onChange={e => setClassData({...classData, time: e.target.value})} /></div>
               </div>
               <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow mt-1 text-xs">Commit Session</button>
            </form>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold">Package Editor</h3><button onClick={() => setShowPackageModal(false)} className="text-slate-300"><X size={20} /></button></div>
            <form onSubmit={handlePackageSubmit} className="space-y-3">
              <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Title</label><input required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-medium" value={pkgData.name} onChange={e => setPkgData({...pkgData, name: e.target.value})} /></div>
              <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Credits</label><input type="number" required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-medium" value={pkgData.credits} onChange={e => setPkgData({...pkgData, credits: parseInt(e.target.value)})} /></div>
              <div className="space-y-0.5"><label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Price (SGD)</label><input type="number" required className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-medium" value={pkgData.price} onChange={e => setPkgData({...pkgData, price: parseInt(e.target.value)})} /></div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow mt-1 text-xs transition-all active:scale-95">Save Package</button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Roster Modal */}
      {showManual && selectedClass && (
        <div className="fixed inset-0 bg-white z-[200] flex flex-col animate-in slide-in-from-bottom-2">
          <div className="p-3 border-b flex justify-between items-center shrink-0">
             <div><h3 className="font-bold text-sm text-slate-800 tracking-tight">Manual Roster</h3><p className="text-[8px] text-indigo-600 font-bold uppercase">{selectedClass.name}</p></div>
             <button onClick={() => { setShowManual(false); setSelectedClass(null); }} className="p-2 bg-slate-100 rounded-lg text-slate-500"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
            {users.filter(u => u.role === UserRole.TRAINEE).map(t => {
              const isPresent = attendance.some(a => a.classId === selectedClass.id && a.traineeId === t.id);
              return (
                <div key={t.id} className="p-3 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                   <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isPresent ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{t.name.charAt(0)}</div>
                      <div className="min-w-0"><div className="text-[11px] font-semibold text-slate-800 truncate">{t.name}</div><div className="text-[9px] text-slate-400 font-medium">{t.credits} Cr</div></div>
                   </div>
                   <button onClick={() => { onToggleAttendance(selectedClass.id, t.id, 'STAFF'); }} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${isPresent ? 'bg-red-50 text-red-600' : 'bg-indigo-600 text-white'}`}>
                      {isPresent ? 'Remove' : 'Present'}
                   </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && selectedClass && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in">
          <div className="text-center mb-6 space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">{selectedClass.name}</h3>
            <p className="text-indigo-200 font-bold uppercase tracking-wider text-[8px]">{selectedClass.date} • {selectedClass.time}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-2xl">
             <QRCodeSVG value={JSON.stringify({ cid: selectedClass.id, sec: selectedClass.qrSecret, t: Date.now() })} size={180} level="H" includeMargin />
          </div>
          <button onClick={() => { setShowQRModal(false); setSelectedClass(null); }} className="mt-8 text-white bg-white/10 p-3 rounded-full active:scale-95 transition-all"><X size={24} /></button>
        </div>
      )}
    </div>
  );
};

export default AdminView;