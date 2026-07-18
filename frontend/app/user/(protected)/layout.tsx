"use client";

import AuthGuard from '@/components/guards/AuthGuard';
import RoleGuard from '@/components/guards/RoleGuard';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['USER']}>
        {children}
      </RoleGuard>
    </AuthGuard>
  );
}