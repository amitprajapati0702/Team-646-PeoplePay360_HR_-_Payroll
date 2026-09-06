'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Loader2 } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  onNewEmployeeClick?: () => void;
  title?: string;
  subtitle?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export function AppShell({
  children,
  onNewEmployeeClick,
  title,
  subtitle,
  searchQuery,
  onSearchChange,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('pp360_token') : null;
    const isValidToken = storedToken && storedToken !== 'undefined' && storedToken !== 'null';
    if (!isValidToken && !token) {
      router.replace('/login');
    }
  }, [token, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex">
      {/* Left Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          onNewEmployeeClick={onNewEmployeeClick}
          onMobileMenuToggle={() => setMobileOpen(true)}
          title={title}
          subtitle={subtitle}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 bg-[#09090b] text-zinc-100">{children}</main>
      </div>
    </div>
  );
}
