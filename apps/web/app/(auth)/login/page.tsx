'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Bot, ArrowRight, Lock, Mail, AlertCircle, ShieldAlert, Store } from 'lucide-react';
import { Button, Input, Card } from '@omniflow/ui';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('mitul@apexstore.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      // Route based on role: Super Admin to /admin, business owners to /dashboard
      if (loggedUser?.isSuperAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Bot className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">
            Omni<span className="text-indigo-600">Flow</span> AI
          </span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Or{' '}
          <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            start your 14-day free trial
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-8 shadow-xl shadow-slate-200/50">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] text-center text-slate-400 font-medium">Quick Fill Credentials for Testing:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('mitul@apexstore.com', 'Admin123!')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-indigo-600" />
                <span>Store Owner</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin@omniflow.ai', 'Admin123!')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-[11px] font-semibold text-amber-800 transition-colors cursor-pointer border border-amber-200/60"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Super Admin</span>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
