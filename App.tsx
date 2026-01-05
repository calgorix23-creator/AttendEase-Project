import React, { useState, useEffect } from 'react';
import { User, UserRole, AuthState, AttendanceClass, AttendanceRecord, PaymentRecord, CreditPackage } from './types';
import { MOCK_USERS, APP_STORAGE_KEY, CREDIT_PACKAGES as INITIAL_PACKAGES } from './constants';
import Auth from './components/Auth';
import AdminView from './components/AdminView';
import TrainerView from './components/TrainerView';
import TraineeView from './components/TraineeView';
import { LogOut, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('attendease_auth');
    try {
      return saved ? JSON.parse(saved) : { user: null, isAuthenticated: false };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  });

  const [classes, setClasses] = useState<AttendanceClass[]>(() => {
    const saved = localStorage.getItem(`${APP_STORAGE_KEY}_classes`);
    return saved ? JSON.parse(saved) : [];
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(`${APP_STORAGE_KEY}_attendance`);
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(`${APP_STORAGE_KEY}_payments`);
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${APP_STORAGE_KEY}_all_users`);
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [packages, setPackages] = useState<CreditPackage[]>(() => {
    const saved = localStorage.getItem(`${APP_STORAGE_KEY}_packages`);
    return saved ? JSON.parse(saved) : INITIAL_PACKAGES;
  });

  useEffect(() => {
    localStorage.setItem('attendease_auth', JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    localStorage.setItem(`${APP_STORAGE_KEY}_classes`, JSON.stringify(classes));
    localStorage.setItem(`${APP_STORAGE_KEY}_attendance`, JSON.stringify(attendance));
    localStorage.setItem(`${APP_STORAGE_KEY}_payments`, JSON.stringify(payments));
    localStorage.setItem(`${APP_STORAGE_KEY}_all_users`, JSON.stringify(users));
    localStorage.setItem(`${APP_STORAGE_KEY}_packages`, JSON.stringify(packages));
  }, [classes, attendance, payments, users, packages]);

  const handleLogin = (email: string, password?: string) => {
    const lowerEmail = email.toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === lowerEmail);
    if (foundUser) {
      if (foundUser.password && password !== foundUser.password) {
        alert("Invalid password.");
        return;
      }
      setAuth({ user: foundUser, isAuthenticated: true });
    } else {
      alert("User not found.");
    }
  };

  const handleLogout = () => setAuth({ user: null, isAuthenticated: false });

  const handleResetPassword = (email: string, phone: string, newPassword: string): boolean => {
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase() && u.phoneNumber === phone);
    if (userIndex !== -1) {
      const updatedUsers = [...users];
      updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: newPassword };
      setUsers(updatedUsers);
      return true;
    }
    return false;
  };

  const adjustCredits = (traineeId: string, delta: number) => {
    const trainee = users.find(u => u.id === traineeId);
    if (trainee && trainee.role === UserRole.TRAINEE) {
      const updatedUser = { ...trainee, credits: Math.max(0, (trainee.credits || 0) + delta) };
      setUsers(prev => prev.map(u => u.id === traineeId ? updatedUser : u));
      if (auth.user?.id === traineeId) setAuth(prev => ({ ...prev, user: updatedUser }));
    }
  };

  const addClass = (newClass: AttendanceClass) => {
    setClasses(prev => [newClass, ...prev]);
  };

  const updateClass = (updatedClass: AttendanceClass) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
  };

  const deleteClass = (id: string) => {
    if (window.confirm("Permanently delete this session?")) {
      setClasses(prev => prev.filter(c => c.id !== id));
      setAttendance(prev => prev.filter(a => a.classId !== id));
    }
  };

  const addUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (auth.user?.id === updatedUser.id) setAuth(prev => ({ ...prev, user: updatedUser }));
  };

  const deleteUser = (id: string) => {
    if (id === auth.user?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (window.confirm("Permanently delete this user account?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
      setAttendance(prev => prev.filter(a => a.traineeId !== id));
      setPayments(prev => prev.filter(p => p.traineeId !== id));
    }
  };

  const toggleAttendance = (classId: string, traineeId: string, method: 'STAFF' | 'SELF') => {
    const existingRecord = attendance.find(a => a.classId === classId && a.traineeId === traineeId);
    const targetClass = classes.find(c => c.id === classId);
    const trainee = users.find(u => u.id === traineeId);

    if (!targetClass || !trainee) return { success: false, message: "System error: Data missing." };

    if (existingRecord) {
      const updatedTrainee = { ...trainee, credits: (trainee.credits || 0) + 1 };
      setUsers(prev => prev.map(u => u.id === trainee.id ? updatedTrainee : u));
      if (auth.user?.id === trainee.id) setAuth(prev => ({ ...prev, user: updatedTrainee }));
      setAttendance(prev => prev.filter(a => a.id !== existingRecord.id));
      return { success: true, message: "Attendance removed. 1 Credit refunded." };
    } else {
      if ((trainee.credits ?? 0) <= 0) {
        return { success: false, message: "Insufficient credits. Trainee must top up." };
      }

      const hasOverlap = attendance.some(a => {
        if (a.traineeId !== traineeId) return false;
        const existingClass = classes.find(cl => cl.id === a.classId);
        return existingClass?.date === targetClass.date && existingClass?.time === targetClass.time;
      });

      if (hasOverlap) return { success: false, message: "Attendance Conflict: Overlap detected." };

      const updatedTrainee = { ...trainee, credits: (trainee.credits || 0) - 1 };
      setUsers(prev => prev.map(u => u.id === trainee.id ? updatedTrainee : u));
      if (auth.user?.id === trainee.id) setAuth(prev => ({ ...prev, user: updatedTrainee }));

      const record: AttendanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        classId,
        traineeId,
        timestamp: Date.now(),
        method
      };
      setAttendance(prev => [record, ...prev]);
      return { success: true, message: "Attendance marked. 1 Credit deducted." };
    }
  };

  const processPayment = (payment: PaymentRecord) => {
    setPayments(prev => [payment, ...prev]);
    const trainee = users.find(t => t.id === payment.traineeId);
    if (trainee) {
      const updatedTrainee = { ...trainee, credits: (trainee.credits || 0) + payment.credits };
      setUsers(prev => prev.map(u => u.id === trainee.id ? updatedTrainee : u));
      if (auth.user?.id === trainee.id) setAuth(prev => ({ ...prev, user: updatedTrainee }));
    }
  };

  if (!auth.isAuthenticated || !auth.user) return <Auth onLogin={handleLogin} onResetPassword={handleResetPassword} />;

  return (
    <div className="min-h-screen flex flex-col max-w-[448px] mx-auto bg-white shadow-xl relative overflow-hidden border-x border-slate-100">
      <header className="px-3 py-4 bg-indigo-600 text-white flex justify-between items-center shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center"><UserIcon size={16} /></div>
          <div>
            <h1 className="font-bold text-base italic tracking-tight leading-none">AttendEase</h1>
            <p className="text-[8px] text-indigo-200 font-semibold uppercase">{auth.user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 bg-white/10 hover:bg-white/20 rounded-full active:scale-95 transition-all"><LogOut size={16} /></button>
      </header>

      <main className="flex-1 overflow-y-auto p-3 pb-24 no-scrollbar bg-slate-50/50">
        {auth.user?.role === UserRole.ADMIN && (
          <AdminView 
            user={auth.user} classes={classes} attendance={attendance} payments={payments} users={users} packages={packages}
            onAddUser={addUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} onAddClass={addClass} onUpdateClass={updateClass} onDeleteClass={deleteClass} onToggleAttendance={toggleAttendance} onUpdatePackages={setPackages} onAdjustCredits={adjustCredits}
          />
        )}
        {auth.user?.role === UserRole.TRAINER && (
          <TrainerView 
            user={auth.user} classes={classes} attendance={attendance} trainees={users.filter(u => u.role === UserRole.TRAINEE)}
            onAddClass={addClass} onUpdateClass={updateClass} onDeleteClass={deleteClass} onToggleAttendance={toggleAttendance} onUpdateUser={updateUser}
          />
        )}
        {auth.user?.role === UserRole.TRAINEE && (
          <TraineeView 
            user={auth.user} classes={classes} attendance={attendance} payments={payments} packages={packages}
            onToggleAttendance={toggleAttendance} onPurchase={processPayment} onUpdateUser={updateUser}
          />
        )}
      </main>

      {auth.user?.role === UserRole.TRAINEE && (
        <div className="absolute bottom-4 left-4 right-4 bg-white border border-slate-200 p-3 rounded-2xl flex justify-between items-center shadow-lg animate-in slide-in-from-bottom-4">
          <div><p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Balance</p><p className="text-xl font-bold text-indigo-600">{auth.user.credits || 0} <span className="text-[10px] text-slate-400 font-normal">Credits</span></p></div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${(auth.user.credits || 0) > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
             {(auth.user.credits || 0) > 0 ? '✓' : '!'}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;