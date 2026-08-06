import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { canAccessAdmin, isSuperAdmin } from '../../utils/permissions.ts';
import { ShieldAlert, Lock } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

/**
 * Protects admin routes — redirects non-admin users to /dashboard
 * Optionally restrict to Super Admin only
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({ children, requireSuperAdmin = false }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Super admin-only route check
  if (requireSuperAdmin && !isSuperAdmin(user)) {
    return <AccessDenied message="Only the Super Administrator can access this area." />;
  }

  // General admin route check
  if (!canAccessAdmin(user)) {
    return <AccessDenied message="You do not have administrator privileges to access this control center." />;
  }

  return <>{children}</>;
};

const AccessDenied: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
    <div className="p-5 bg-red-100 text-danger rounded-full mb-6">
      <Lock className="w-14 h-14" />
    </div>
    <div className="flex items-center gap-2 mb-3">
      <ShieldAlert className="w-5 h-5 text-danger" />
      <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
    </div>
    <p className="text-slate-500 max-w-md text-sm leading-relaxed">{message}</p>
    <a
      href="/dashboard"
      className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-md3 font-semibold text-sm hover:bg-primary-hover transition-all"
    >
      Return to Dashboard
    </a>
  </div>
);
