'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

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
