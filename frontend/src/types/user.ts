import { Timestamp } from 'firebase/firestore';

export type UserRole =
  | 'CITIZEN'
  | 'VOLUNTEER'
  | 'OFFICIAL'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'DISTRICT_ADMIN'
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
  | 'COMMUNITY_MODERATOR'
  | 'MODERATOR'
  | 'TOURIST'
  | 'USER';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'mr' | 'hi';
  notificationsEnabled: boolean;
  locationPermission: boolean;
  accessibilityMode: boolean;
  soundEnabled: boolean;
}

export interface UserProfile {
  uid: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  displayRole?: string;
  isAdmin?: boolean;
  permissions?: string[];
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  isSuspended?: boolean;
  isBanned?: boolean;
  isVerified?: boolean;
  language: 'en' | 'mr' | 'hi';
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  locationPermission: boolean;
  accessibilityMode: boolean;
  district?: string;
  taluka?: string;
  village?: string;
  state?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isProfileComplete: boolean;
  emergencyContactsConfigured: boolean;
  createdAt: string | Timestamp | Date;
  updatedAt: string | Timestamp | Date;
  lastLogin: string | Timestamp | Date;
  createdBy?: string;
}

export type AlertCategory =
  | 'Emergency'
  | 'Disaster'
  | 'Weather'
  | 'Government'
  | 'Health'
  | 'Traffic'
  | 'Community'
  | 'Infrastructure';

export type AlertPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AlertItem {
  id?: string;
  title: string;
  description: string;
  category: AlertCategory;
  priority: AlertPriority;
  district?: string;
  taluka?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  startTime?: string | Timestamp | Date;
  endTime?: string | Timestamp | Date;
  scheduledAt?: string | Timestamp | Date;
  image?: string;
  attachments?: string[];
  isPinned: boolean;
  isPaused?: boolean;
  isGeoFenced?: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED' | 'SCHEDULED';
  createdBy?: string;
  createdAt: string | Timestamp | Date;
}

export interface LoginHistoryItem {
  id?: string;
  uid: string;
  method: 'EMAIL' | 'GOOGLE' | 'PHONE_OTP' | 'ANONYMOUS';
  device: string;
  browser: string;
  os: string;
  ipAddress?: string;
  location?: string;
  loginTime: string | Timestamp | Date;
  logoutTime?: string | Timestamp | Date;
  status: 'SUCCESS' | 'FAILED' | 'LOCKED';
}

export interface VerificationLog {
  id?: string;
  uid: string;
  type: 'EMAIL' | 'PHONE';
  phone?: string;
  email?: string;
  status: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'LOCKED';
  timestamp: string | Timestamp | Date;
  attempts: number;
}

export interface UserSession {
  sessionId: string;
  uid: string;
  device: string;
  browser: string;
  platform: string;
  createdAt: string | Timestamp | Date;
  lastActive: string | Timestamp | Date;
  isActive: boolean;
}

export interface DeviceToken {
  id?: string;
  uid: string;
  fcmToken: string;
  device: string;
  createdAt: string | Timestamp | Date;
  lastUsed: string | Timestamp | Date;
}

export interface EmergencyContactItem {
  id?: string;
  uid: string;
  name: string;
  phone: string;
  relationship: string;
  isVerified: boolean;
  createdAt: string | Timestamp | Date;
}

export interface AuditLog {
  id?: string;
  adminId: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string | Timestamp | Date;
  ip?: string;
}

export interface SecurityLog {
  id?: string;
  uid: string;
  type: 'FAILED_LOGIN' | 'ACCOUNT_LOCKED' | 'SUSPICIOUS_ACTIVITY' | 'PASSWORD_CHANGE';
  reason: string;
  ipAddress?: string;
  userAgent: string;
  timestamp: string | Timestamp | Date;
}
