
import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, PaymentRecord, User, UserRole, CreditPackage } from '../types';
import { 
  BarChart, Users, DollarSign, Calendar, UserPlus, X, Mail, Phone, 
  LayoutDashboard, Edit2, ShieldCheck, Lock, AlertTriangle, 
  ShoppingBag, Plus, Trash2, QrCode, ClipboardList, CheckCircle2, Clock, MapPin, AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
  onAddClass: (cls: AttendanceClass) => void;
  onUpdateClass: (cls: AttendanceClass) => void;
  onDeleteClass: (id: string) => void;
  onAddAttendance: (rec: AttendanceRecord) => { success: boolean; message: string };
  onUpdatePackages: (packages: CreditPackage[]) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  user, classes, attendance, payments, users, packages, 
  onAddUser, onUpdateUser, onAddClass, onUpdateClass, onDeleteClass, onAddAttendance, onUpdatePackages 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'classes' | 'shop' | 'profile'>('dashboard');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showManualAttendance, setShowManualAttendance] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<AttendanceClass | null>(null);
  const [manualFeedback, setManualFeedback] = useState<{ type: 'error' | 'success' | 'warning', text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', role: UserRole.TRAINEE, password: ''
  });

  const [pkgData, setPkgData] = useState({
    name: '', credits: 10, price: 100
  });

  const [classData, setClassData] = useState({
    name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00'
  });

  const [profileData, setProfileData] = useState({
    name: user.name, email: user.email, phone: user.phoneNumber || '', password: user.password || ''
  });

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const trainees = users.filter(u => u.role === UserRole.TRAINEE);
  
  const chartData = [...classes].slice(0, 5).reverse().map(cls => {
    const count = attendance.filter(a => a.classId === cls.id).length;
    return { name: cls.name.substring(0, 10), count };
  });

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name, email: editingUser.email, phone: editingUser.phoneNumber || '',
        role: editingUser.role, password: editingUser.password || 'password123'
      });
    } else {
      setFormData({ name: '', email: '', phone: '', role: UserRole.TRAINEE, password: '' });
    }
  }, [editingUser]);

  useEffect(() => {
    if (editingPackage) {
      setPkgData({ name: editingPackage.name, credits: editingPackage.credits, price: editingPackage.price });
    } else {
      setPkgData({ name: '', credits: 10, price: 100 });
    }
  }, [editingPackage]);

  useEffect(() => {
    if (editingClass) {
      setClassData({ name: editingClass.name, location: editingClass.location, date: editingClass.date, time: editingClass.time });
    } else {
      setClassData({ name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
    }
  }, [editingClass]);

  useEffect(() => {
    if (manualFeedback) {
      const timer = setTimeout(() => setManualFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [manualFeedback]);

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        name: formData.name, email: formData.email, phoneNumber: formData.phone,
        role: formData.role, password: formData.password
      });
    } else {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name, email: formData.email, phoneNumber: formData.phone,
        role: formData.role, password: formData.password || 'password123',
        ...(formData.role === UserRole.TRAINEE ? { credits: 0 } : {})
      };
      onAddUser(newUser);
    }
    setShowUserModal(false);
  };

  const handlePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPackage) {
      const updated = packages.map(p => p.id === editingPackage.id ? { ...p, ...pkgData } : p);
      onUpdatePackages(updated);
    } else {
      const newPkg: CreditPackage = {
        id: Math.random().toString(36).substr(2, 9),
        ...pkgData
      };
      onUpdatePackages([...packages, newPkg]);
    }
    setShowPackageModal(false);
  };

  const deletePackage = (id: string) => {
    if (window.confirm("Are you sure you want to delete this credit package? Existing trainee credits won't be affected.")) {
      onUpdatePackages(packages.filter(p => p.id !== id));
    }
  };

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        name: classData.name,
        location: classData.location,
        date: classData.date,
        time: classData.time
      });
    } else {
      const newClass: AttendanceClass = {
        id: Math.random().toString(36).substr(2, 9),
        trainerId: user.id,
        name: classData.name,
        location: classData.location,
        date: classData.date,
        time: classData.time,
        qrSecret: `AE-ADM-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        createdAt: Date.now()
      };
      onAddClass(newClass);
    }
    setShowClassModal(false);
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
      name: profileData.name, email: profileData.email,
      phoneNumber: profileData.phone, password: profileData.password
    });
    alert("Administrative profile updated successfully!");
  };

  const emailChanged = profileData.email !== user.email;

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'HUB' },
          { id: 'users', icon: Users, label: 'USERS' },
          { id: 'classes', icon: Calendar, label: 'CLASSES' },
          { id: 'shop', icon: ShoppingBag, label: 'SHOP' },
          { id: 'profile', icon: ShieldCheck, label: 'ADMIN' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[70px] py-2 rounded-lg text-[9px] font-bold transition-all flex flex-col items-center justify-center gap-1 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-indigo-600 mb-2"><Users size={20} /></div>
              <div className="text-2xl font-bold">{trainees.length}</div>
              <div className="text-xs text-slate-500 font-medium">Trainees</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-emerald-600 mb-2"><DollarSign size={20} /></div>
              <div className="text-2xl font-bold">${totalRevenue}</div>
              <div className="text-xs text-slate-500 font-medium">Revenue</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider text-center">Engagement Trends</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-bold text-slate-800">User Directory</h3>
            <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="bg-indigo-600 text-white p-2 rounded-xl shadow-md active:scale-95 transition-all"><Plus size={20} /></button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
            {users.map(u => (
              <div key={u.id} className="p-4 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-slate-900">{u.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${u.role === UserRole.ADMIN ? 'bg-rose-500' : u.role === UserRole.TRAINER ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                    {u.role}
                  </div>
                </div>
                <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-bold text-slate-800">Global Sessions</h3>
            <button onClick={() => { setEditingClass(null); setShowClassModal(true); }} className="bg-indigo-600 text-white p-2 rounded-xl shadow-md active:scale-95 transition-all"><Plus size={20} /></button>
          </div>
          <div className="space-y-3">
            {classes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm italic">No sessions found. Start scheduling to see them here.</div>
            ) : (
              classes.map(cls => {
                const trainer = users.find(u => u.id === cls.trainerId);
                return (
                  <div key={cls.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm hover:border-indigo-200 transition-all">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-800">{cls.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                        <MapPin size={10} /> {cls.location} • <Calendar size={10} /> {cls.date} @ {cls.time}
                      </div>
                      <div className="text-[9px] text-indigo-500 font-bold uppercase tracking-tighter">Organized by: {trainer?.name || 'Admin'}</div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setSelectedClass(cls); setShowQRModal(true); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shadow-sm active:scale-90"><QrCode size={16} /></button>
                       <button onClick={() => { setEditingClass(cls); setShowClassModal(true); }} className="p-2 bg-slate-50 text-slate-600 rounded-lg shadow-sm active:scale-90"><Edit2 size={16} /></button>
                       <button onClick={() => onDeleteClass(cls.id)} className="p-2 bg-red-50 text-red-600 rounded-lg shadow-sm active:scale-90"><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-bold text-slate-800">Shop Config</h3>
            <button onClick={() => { setEditingPackage(null); setShowPackageModal(true); }} className="bg-indigo-600 text-white p-2 rounded-xl shadow-md active:scale-95 transition-all"><Plus size={20} /></button>
          </div>
          <div className="space-y-3">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                <div>
                  <div className="text-sm font-bold text-slate-800">{pkg.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{pkg.credits} Credits • ${pkg.price}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingPackage(pkg); setShowPackageModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => deletePackage(pkg.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-indigo-100 shadow-sm">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Admin Settings</h3>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
              <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={profileData.name} onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
              <input required type="email" className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${emailChanged ? 'border-amber-200' : 'border-slate-100'}`} value={profileData.email} onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))} />
              {emailChanged && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 mt-2 animate-in slide-in-from-top-2">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 leading-tight font-bold">
                    WARNING: Changing your email will change your LOGIN ID.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Master Password</label>
              <div className="relative">
                <input required type="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={profileData.password} onChange={e => setProfileData(prev => ({ ...prev, password: e.target.value }))} />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>

            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all mt-4">Commit Changes</button>
          </form>
        </div>
      )}

      {/* MODALS */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in duration-200 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">{editingUser ? 'Update User' : 'Add User'}</h3><button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button></div>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <input placeholder="Name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <input placeholder="Email" type="email" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Role</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
                  <option value={UserRole.TRAINEE}>Trainee</option>
                  <option value={UserRole.TRAINER}>Trainer</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-xl mt-4 active:scale-95 transition-all">Submit</button>
            </form>
          </div>
        </div>
      )}

      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in duration-200 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">{editingClass ? 'Modify Class' : 'Schedule New Class'}</h3><button onClick={() => { setShowClassModal(false); setEditingClass(null); }} className="text-slate-400"><X /></button></div>
            <form onSubmit={handleClassSubmit} className="space-y-4">
              <input placeholder="Session Name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={classData.name} onChange={e => setClassData({ ...classData, name: e.target.value })} />
              <input placeholder="Venue / Studio" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={classData.location} onChange={e => setClassData({ ...classData, location: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                 <input type="date" required className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs" value={classData.date} onChange={e => setClassData({ ...classData, date: e.target.value })} />
                 <input type="time" required className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs" value={classData.time} onChange={e => setClassData({ ...classData, time: e.target.value })} />
              </div>
              <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-xl mt-4 active:scale-95 transition-all">
                {editingClass ? 'Update Session' : 'Create Session'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showQRModal && selectedClass && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[120] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="text-center mb-8 space-y-2">
            <h3 className="text-3xl font-extrabold text-white">{selectedClass.name}</h3>
            <p className="text-indigo-200 font-bold uppercase tracking-widest text-sm">{selectedClass.date} • {selectedClass.time}</p>
          </div>
          <div className="bg-white p-10 rounded-[50px] shadow-2xl">
            <QRCodeSVG value={JSON.stringify({ cid: selectedClass.id, sec: selectedClass.qrSecret, t: Date.now() })} size={260} level="H" includeMargin />
          </div>
          <button onClick={() => setShowQRModal(false)} className="mt-12 text-white bg-white/10 p-5 rounded-full backdrop-blur-sm active:scale-90"><X size={32} /></button>
        </div>
      )}

      {showPackageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in duration-200 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">{editingPackage ? 'Update Package' : 'Create Package'}</h3><button onClick={() => setShowPackageModal(false)} className="text-slate-400"><X /></button></div>
            <form onSubmit={handlePackageSubmit} className="space-y-4">
              <input placeholder="Package Display Name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={pkgData.name} onChange={e => setPkgData({ ...pkgData, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400">CREDITS</label>
                   <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={pkgData.credits} onChange={e => setPkgData({ ...pkgData, credits: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400">PRICE ($)</label>
                   <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={pkgData.price} onChange={e => setPkgData({ ...pkgData, price: parseInt(e.target.value) })} />
                </div>
              </div>
              <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-xl mt-4 active:scale-95 transition-all">Save Config</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
