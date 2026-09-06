'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { token, user } = useAuth();

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('pp360_token') : null;
    const isValidToken = storedToken && storedToken !== 'undefined' && storedToken !== 'null';
    if (isValidToken || (token && token !== 'undefined')) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [token, user, router]);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white gap-3">
      <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
      <p className="text-xs text-zinc-500 font-mono">Authenticating session...</p>
    </div>
  );
}
