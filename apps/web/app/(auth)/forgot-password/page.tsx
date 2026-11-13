'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card } from '@omniflow/ui';
import { ApiClient } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sandboxToken, setSandboxToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await ApiClient.post('/auth/forgot-password', { email });
      setSubmitted(true);
      if (res.resetToken) {
        setSandboxToken(res.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
          Reset your password
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Enter your registered email address to receive password recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-8 shadow-xl shadow-slate-200/50">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Reset instructions dispatched</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an account with <strong>{email}</strong> exists, an email has been sent with a secure password reset link.
              </p>

              {sandboxToken && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-left text-xs text-amber-900">
                  <div className="font-bold text-[11px] mb-1">Sandbox Reset Link:</div>
                  <Link
                    href={`/reset-password?token=${sandboxToken}`}
                    className="text-indigo-600 hover:underline font-mono text-[10px] break-all"
                  >
                    /reset-password?token={sandboxToken}
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full text-xs">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
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

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Sending Instructions...' : 'Send Reset Link'}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-indigo-600"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
