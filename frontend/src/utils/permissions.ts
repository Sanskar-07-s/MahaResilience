/**
 * permissions.ts — Comprehensive Role-based Access Control Helpers for MahaResilience
 */

import { UserProfile } from '../types/user.ts';

export { SUPER_ADMIN_UID } from './superAdminBootstrap.ts';

const SUPER_ADMIN_UID_LOCAL = 'gfhWRztes9dYzGzHBu9MjZH5Uuo2';

export type AdminRole =
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
  | 'ADMIN'
  | 'OFFICIAL'
  | 'VOLUNTEER'
  | 'CITIZEN'
  | 'USER';

/** Check if the user is the permanent Super Admin */
export const isSuperAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return (
    user.uid === SUPER_ADMIN_UID_LOCAL ||
    user.id === SUPER_ADMIN_UID_LOCAL ||
    user.role === 'SUPER_ADMIN'
  );
};

/** Check if the user is a District Admin */
export const isDistrictAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return isSuperAdmin(user) || user.role === 'DISTRICT_ADMIN' || user.role === 'ADMIN';
};

/** Check if the user is an officer */
export const isOfficer = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'OFFICIAL' || isSuperAdmin(user);
};

/** Check if the user is a regular citizen */
export const isCitizen = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'CITIZEN' || user.role === 'USER';
};

/** Check if the user has any administrative or moderation role */
export const canAccessAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (user.isAdmin === true) return true;

  const role = user.role || '';
  return (
    role.includes('ADMIN') ||
    role.includes('MODERATOR') ||
    role === 'OFFICIAL'
  );
};

/** Check specific permission */
export const hasPermission = (
  user: UserProfile | null | undefined,
  permission: string
): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  const perms = user.permissions || [];
  return perms.includes('*') || perms.includes(permission);
};
