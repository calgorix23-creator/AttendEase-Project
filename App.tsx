
import React, { useState, useEffect } from 'react';
import { User, UserRole, AuthState, AttendanceClass, AttendanceRecord, PaymentRecord } from './types';
import { MOCK_USERS, APP_STORAGE_KEY } from './constants';
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

  useEffect(() => {
    localStorage.setItem('attendease_auth', JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    localStorage.setItem(`${APP_STORAGE_KEY}_classes`, JSON.stringify(classes));
    localStorage.setItem(`${APP_STORAGE_KEY}_attendance`, JSON.stringify(attendance));
    localStorage.setItem(`${APP_STORAGE_KEY}_payments`, JSON.stringify(payments));
    localStorage.setItem(`${APP_STORAGE_KEY}_all_users`, JSON.stringify(users));
  }, [classes, attendance, payments, users]);

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

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
  };

  const handleResetPassword = (email: string, phone: string, newPassword: string): boolean => {
    const userIndex = users.findIndex(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.phoneNumber === phone
    );

    if (userIndex !== -1) {
      const updatedUsers = [...users];
      updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: newPassword };
      setUsers(updatedUsers);
      return true;
    }
    return false;
  };

  const addClass = (newClass: AttendanceClass) => {
    setClasses(prev => [newClass, ...prev]);
  };

  const addUser = (newUser: User) => {
    const userToSave = { ...newUser, password: newUser.password || 'password123' };
    setUsers(prev => [...prev, userToSave]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (auth.user?.id === updatedUser.id) {
      setAuth(prev => ({ ...prev, user: updatedUser }));
    }
  };

  const addAttendance = (record: AttendanceRecord) => {
    const cls = classes.find(c => c.id === record.classId);
    if (!cls) return { success: false, message: "Class not found." };

    // Temporal Validation: Prevent future check-ins
    const now = new Date();
    // Create class start time date object. Assuming date format YYYY-MM-DD and time HH:mm
    const classStartTime = new Date(`${cls.date}T${cls.time}`);
    
    // 15-minute grace period (in milliseconds)
    const GRACE_PERIOD_MS = 15 * 60 * 1000;
    const earliestCheckIn = new Date(classStartTime.getTime() - GRACE_PERIOD_MS);

    if (now < earliestCheckIn) {
      return { 
        success: false, 
        message: `This class hasn't started yet. You can check in starting 15 minutes before the scheduled time (${cls.time}).` 
      };
    }

    const exists = attendance.some(r => r.classId === record.classId && r.traineeId === record.traineeId);
    if (exists) return { success: false, message: "Already checked in for this session!" };
    
    const trainee = users.find(t => t.id === record.traineeId && t.role === UserRole.TRAINEE);
    if (trainee) {
      const currentCredits = trainee.credits ?? 0;
      if (currentCredits <= 0) {
        return { success: false, message: "Insufficient credits! Please top up in the shop." };
      }
      
      const updatedTrainee = { ...trainee, credits: currentCredits - 1 };
      setUsers(prev => prev.map(u => u.id === record.traineeId ? updatedTrainee : u));
      
      if (auth.user?.id === record.traineeId) {
        setAuth(prev => ({ ...prev, user: updatedTrainee }));
      }
    }
    
    setAttendance(prev => [record, ...prev]);
    return { success: true, message: "Successfully checked in! Enjoy your session." };
  };

  const processPayment = (payment: PaymentRecord) => {
    setPayments(prev => [payment, ...prev]);
    
    const trainee = users.find(t => t.id === payment.traineeId && t.role === UserRole.TRAINEE);
    if (trainee) {
      const updatedTrainee = { ...trainee, credits: (trainee.credits || 0) + payment.credits };
      setUsers(prev => prev.map(u => u.id === payment.traineeId ? updatedTrainee : u));
      
      if (auth.user?.id === payment.traineeId) {
        setAuth(prev => ({ ...prev, user: updatedTrainee }));
      }
    }
  };

  if (!auth.isAuthenticated || !auth.user) {
    return <Auth onLogin={handleLogin} onResetPassword={handleResetPassword} />;
  }

  const trainees = users.filter(u => u.role === UserRole.TRAINEE);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
      <header className="px-4 py-6 bg-indigo-600 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <UserIcon size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">AttendEase</h1>
            <p className="text-xs text-indigo-100 uppercase tracking-tighter font-semibold">{auth.user?.role}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        {auth.user?.role === UserRole.ADMIN && (
          <AdminView 
            user={auth.user}
            classes={classes} 
            attendance={attendance} 
            payments={payments}
            users={users}
            onAddUser={addUser}
            onUpdateUser={updateUser}
          />
        )}
        {auth.user?.role === UserRole.TRAINER && (
          <TrainerView 
            user={auth.user} 
            classes={classes} 
            attendance={attendance}
            trainees={trainees}
            onAddClass={addClass}
            onAddAttendance={addAttendance}
            onUpdateUser={updateUser}
          />
        )}
        {auth.user?.role === UserRole.TRAINEE && (
          <TraineeView 
            user={auth.user} 
            classes={classes} 
            attendance={attendance}
            payments={payments}
            onCheckIn={addAttendance}
            onPurchase={processPayment}
            onUpdateUser={updateUser}
          />
        )}
      </main>

      {auth.user?.role === UserRole.TRAINEE && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur border border-slate-200 p-3 rounded-2xl flex justify-between items-center shadow-lg animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Balance</span>
            <span className="text-lg font-bold text-indigo-600">{auth.user.credits || 0} Credits</span>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${ (auth.user.credits || 0) > 0 ? 'bg-emerald-500' : 'bg-red-500' }`}>
             {(auth.user.credits || 0) > 0 ? '✓' : '!'}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
