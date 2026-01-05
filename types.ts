
export enum UserRole {
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER',
  TRAINEE = 'TRAINEE'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  credits?: number;
  phoneNumber?: string;
}

export interface AttendanceClass {
  id: string;
  trainerId: string;
  name: string;
  date: string;
  time: string;
  location: string;
  qrSecret: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  traineeId: string;
  timestamp: number;
  // Fix: Added 'STAFF' and 'SELF' to permitted methods to match component usage and resolve type errors
  method: 'QR' | 'MANUAL' | 'STAFF' | 'SELF';
}

export interface PaymentRecord {
  id: string;
  traineeId: string;
  amount: number;
  credits: number;
  timestamp: number;
  status: 'SUCCESS' | 'PENDING';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AttendancePackage {
  id: string;
  name: string;
  credits: number;
  price: number;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
}
