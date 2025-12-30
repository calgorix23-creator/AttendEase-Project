
import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, PaymentRecord, User, UserRole } from '../types';
import { BarChart, Users, DollarSign, Calendar, UserPlus, X, Mail, Phone, LayoutDashboard, Edit2, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AdminViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ user, classes, attendance, payments, users, onAddUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'profile'>('dashboard');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: UserRole.TRAINEE,
    password: ''
  });

  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phoneNumber || '',
    password: user.password || ''
  });

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const trainees = users.filter(u => u.role === UserRole.TRAINEE);
  
  const chartData = classes.slice(0, 5).reverse().map(cls => {
    const count = attendance.filter(a => a.classId === cls.id).length;
    return { name: cls.name.substring(0, 10), count };
  });

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phoneNumber || '',
        role: editingUser.role,
        password: editingUser.password || 'password123'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: UserRole.TRAINEE,
        password: ''
      });
    }
  }, [editingUser]);

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        role: formData.role,
        password: formData.password
      });
    } else {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        role: formData.role,
        password: formData.password || 'password123',
        ...(formData.role === UserRole.TRAINEE ? { credits: 0 } : {})
      };
      onAddUser(newUser);
    }
    closeModal();
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
    alert("Profile updated successfully! If you changed your email, please use the new one for your next login.");
  };

  const closeModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
  };

  const handleEditClick = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setShowUserModal(true);
  };

  const emailChanged = profileData.email !== user.email;

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          <LayoutDashboard size={14} /> DASHBOARD
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          <Users size={14} /> USERS
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          <ShieldCheck size={14} /> PROFILE
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-indigo-600 mb-2"><Users size={20} /></div>
              <div className="text-2xl font-bold">{trainees.length}</div>
              <div className="text-xs text-slate-500 font-medium">Total Trainees</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-emerald-600 mb-2"><DollarSign size={20} /></div>
              <div className="text-2xl font-bold">${totalRevenue}</div>
              <div className="text-xs text-slate-500 font-medium">Revenue</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-orange-600 mb-2"><Calendar size={20} /></div>
              <div className="text-2xl font-bold">{classes.length}</div>
              <div className="text-xs text-slate-500 font-medium">Total Classes</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-blue-600 mb-2"><BarChart size={20} /></div>
              <div className="text-2xl font-bold">{attendance.length}</div>
              <div className="text-xs text-slate-500 font-medium">Attendances</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Attendance Trends</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
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
            <h3 className="text-lg font-bold text-slate-800">Users List</h3>
            <button 
              onClick={() => { setEditingUser(null); setShowUserModal(true); }}
              className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md"
            >
              <UserPlus size={16} /> Add User
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
            {users.map(u => (
              <div key={u.id} className="p-4 space-y-2 relative group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {u.name}
                      <button 
                        onClick={() => handleEditClick(u)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                    <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-block font-bold uppercase tracking-wider mt-1">
                      {u.role}
                    </div>
                  </div>
                  {u.role === UserRole.TRAINEE && (
                    <div className="text-right">
                      <div className="text-xs font-bold text-indigo-600">{u.credits || 0} Credits</div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-1 pt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail size={12} className="shrink-0" /> {u.email}
                  </div>
                  {u.phoneNumber && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone size={12} className="shrink-0" /> {u.phoneNumber}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-indigo-100">
              <ShieldCheck size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Admin Settings</h3>
            <p className="text-xs text-slate-500">Manage your profile & login details</p>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Your Name</label>
              <input 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                value={profileData.name} 
                onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))} 
              />
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
              <input 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                value={profileData.phone} 
                onChange={e => setProfileData(prev => ({ ...prev, phone: e.target.value }))} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">New Password</label>
              <div className="relative">
                <input 
                  type="password"
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={profileData.password} 
                  onChange={e => setProfileData(prev => ({ ...prev, password: e.target.value }))} 
                />
                <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl mt-4 shadow-lg active:scale-95 transition-transform"
            >
              Update Profile Details
            </button>
          </form>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{editingUser ? 'Edit User Profile' : 'Add New User'}</h3>
              <button onClick={closeModal} className="text-slate-400"><X /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input type="email" required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Set user password" value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.role}
                  onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  disabled={!!editingUser}
                >
                  <option value={UserRole.TRAINEE}>Trainee</option>
                  <option value={UserRole.TRAINER}>Trainer</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl mt-4 shadow-lg active:scale-95 transition-transform">
                {editingUser ? 'Save Changes' : 'Create Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
