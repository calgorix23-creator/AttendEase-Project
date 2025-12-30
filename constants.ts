
import { UserRole, User } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'admin@test.com', name: 'Super Admin', role: UserRole.ADMIN, phoneNumber: '+1 555-0100', password: 'password123' },
  { id: 'u2', email: 'trainer@test.com', name: 'John Trainer', role: UserRole.TRAINER, phoneNumber: '+1 555-0101', password: 'password123' },
  { id: 'u3', email: 'trainee@test.com', name: 'Alice Trainee', role: UserRole.TRAINEE, credits: 10, phoneNumber: '+1 555-0102', password: 'password123' },
];

export const APP_STORAGE_KEY = 'attendease_v1_data';

export const CREDIT_PACKAGES = [
  { id: 'p1', name: 'Starter Pack', credits: 5, price: 50 },
  { id: 'p2', name: 'Value Pack', credits: 15, price: 135 },
  { id: 'p3', name: 'Pro Pack', credits: 50, price: 400 },
];
