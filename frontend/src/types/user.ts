import { Timestamp } from 'firebase/firestore';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'MODULE_ADMIN'
  | 'DISTRICT_ADMIN'
  | 'MODERATOR'
  | 'OFFICIAL'
  | 'VOLUNTEER'
  | 'CITIZEN'
  | 'USER'
  | 'TOURIST'
  | 'ADMIN'
  | 'EMERGENCY_ADMIN'
  | 'HEALTHCARE_ADMIN'
  | 'GOVERNMENT_ADMIN'
  | 'WATER_ADMIN'
  | 'ELECTRICITY_ADMIN'
  | 'WASTE_ADMIN'
  | 'AGRICULTURE_ADMIN'
  | 'EDUCATION_ADMIN'
  | 'TRANSPORT_ADMIN'
  | 'TOURISM_ADMIN'
  | 'COMPLAINTS_ADMIN'
  | 'COMMUNITY_MODERATOR';

export type AdminField =
  | 'EMERGENCY'
  | 'HEALTHCARE'
  | 'GOVERNMENT'
  | 'WATER'
  | 'ELECTRICITY'
  | 'WASTE'
  | 'AGRICULTURE'
  | 'EDUCATION'
  | 'TRANSPORT'
  | 'TOURISM'
  | 'COMPLAINTS'
  | 'COMMUNITY';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'mr' | 'hi';
  notificationsEnabled: boolean;
  locationPermission: boolean;
  accessibilityMode: boolean;
  soundEnabled: boolean;
}

export interface LoginHistoryItem {
  id?: string;
  uid?: string;
  method?: string;
  status?: string;
  timestamp?: string;
  loginTime?: string;
  ip?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
}

export interface VerificationLog {
  id?: string;
  uid?: string;
  email?: string;
  phone?: string;
  timestamp?: string;
  type?: string;
  status?: string;
  method?: string;
  attempts?: number;
}

export interface UserSession {
  uid?: string;
  sessionId: string;
  createdAt: string;
  lastActive: string;
  device?: string;
  browser?: string;
  platform?: string;
  isActive?: boolean;
}

export interface DeviceToken {
  uid?: string;
  token?: string;
  fcmToken?: string;
  platform?: string;
  device?: string;
  createdAt?: string;
  updatedAt?: string;
  lastUsed?: string;
}

export interface EmergencyContactItem {
  name: string;
  phone: string;
  relation?: string;
  email?: string;
}

export interface AuditLog {
  id?: string;
  uid?: string;
  target?: string;
  adminId?: string;
  action?: string;
  timestamp?: string;
  details?: string;
}

export interface SecurityLog {
  id?: string;
  uid?: string;
  userId?: string;
  type?: string;
  event?: string;
  reason?: string;
  userAgent?: string;
  timestamp?: string;
}

export interface UserProfile {
  uid: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  adminField?: AdminField;
  displayRole?: string;
  isAdmin?: boolean;
  permissions?: string[];
  district?: string;
  taluka?: string;
  village?: string;
  state?: string;
  assignedAreas?: string[];
  status?: 'ACTIVE' | 'SUSPENDED';
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  isSuspended?: boolean;
  isBanned?: boolean;
  isVerified?: boolean;
  emergencyContactsConfigured?: boolean;
  lastLogin?: string | Timestamp;
  language?: 'en' | 'mr' | 'hi';
  theme?: 'light' | 'dark' | 'system';
  notificationsEnabled?: boolean;
  locationPermission?: boolean;
  accessibilityMode?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isProfileComplete?: boolean;
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}
