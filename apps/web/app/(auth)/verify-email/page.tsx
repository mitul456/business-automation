'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Bot, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button, Card } from '@omniflow/ui';
import { ApiClient } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    token ? 'verifying' : 'error'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing or invalid email verification token');
      return;
    }

    const verify = async () => {
      try {
        const res = await ApiClient.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired email verification link');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="text-center space-y-4">
      {status === 'verifying' && (
        <>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-200 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Verifying Email...</h3>
          <p className="text-xs text-slate-500">Please wait while we confirm your account security.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Email Verified Successfully</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {message || 'Your email has been confirmed. You now have full access to your workspace.'}
          </p>
          <div className="pt-2">
            <Link href="/dashboard">
              <Button className="w-full text-xs">Enter Workspace Dashboard</Button>
            </Link>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Verification Failed</h3>
          <p className="text-xs text-rose-600 leading-relaxed">
            {message || 'The verification token is invalid or has expired.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login">
              <Button variant="outline" className="w-full text-xs">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
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
          Email Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-8 shadow-xl shadow-slate-200/50">
          <Suspense fallback={<div className="text-center py-8 text-xs text-slate-400">Verifying session...</div>}>
            <VerifyEmailContent />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
