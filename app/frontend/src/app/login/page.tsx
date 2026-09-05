'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Command, Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      toast.success('Signed in successfully');
      router.push('/reports');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-black py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-white shadow-lg">
            <Command className="h-6 w-6 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-white">
          PeoplePay<span className="text-zinc-500 font-normal">360</span>
        </h2>
        <p className="mt-1 text-center text-xs font-medium text-zinc-400">
          Enterprise Human Resources & Payroll Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] px-6 py-8 shadow-2xl sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-800 bg-rose-950/80 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300">Work Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@peoplepay360.com"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-9 text-xs text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 hover:border-zinc-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-300" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 border-t border-zinc-800 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5 text-center">
              Quick Login Demo Roles (Password: Password123!)
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('payroll@peoplepay360.com', 'Password123!')}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5 text-left hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer text-white"
              >
                <div>
                  <div className="text-xs font-bold text-white">Payroll Officer</div>
                  <div className="text-[10px] text-zinc-400">payroll@peoplepay360.com</div>
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-200 bg-zinc-950 border border-zinc-700 px-1.5 py-0.5 rounded">
                  Full Access
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('hr@peoplepay360.com', 'Password123!')}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5 text-left hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer text-white"
              >
                <div>
                  <div className="text-xs font-bold text-white">HR Manager</div>
                  <div className="text-[10px] text-zinc-400">hr@peoplepay360.com</div>
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-200 bg-zinc-950 border border-zinc-700 px-1.5 py-0.5 rounded">
                  HR & Leaves
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('priya.sharma@company.com', 'Password123!')}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5 text-left hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer text-white"
              >
                <div>
                  <div className="text-xs font-bold text-white">Employee (Priya Sharma)</div>
                  <div className="text-[10px] text-zinc-400">priya.sharma@company.com</div>
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-200 bg-zinc-950 border border-zinc-700 px-1.5 py-0.5 rounded">
                  Self-Service
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('alice.johnson@example.com', 'Password123!')}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5 text-left hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer text-white"
              >
                <div>
                  <div className="text-xs font-bold text-white">Employee (Alice Johnson)</div>
                  <div className="text-[10px] text-zinc-400">alice.johnson@example.com</div>
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-200 bg-zinc-950 border border-zinc-700 px-1.5 py-0.5 rounded">
                  Self-Service
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
