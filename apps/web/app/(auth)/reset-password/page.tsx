'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Bot, ArrowLeft, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card } from '@omniflow/ui';
import { ApiClient } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!token) {
      setError('Password reset token is required');
      return;
    }

    setLoading(true);

    try {
      await ApiClient.post('/auth/reset-password', {
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired reset token');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Password Reset Successful</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your account password has been updated securely. You can now log in with your new credentials.
        </p>
        <div className="pt-2">
          <Link href="/login">
            <Button className="w-full text-xs">Proceed to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Input
        label="Reset Security Token"
        type="text"
        required
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste reset token from email"
      />

      <Input
        label="New Password"
        type="password"
        required
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Minimum 6 characters"
        leftIcon={<Lock className="w-4 h-4" />}
      />

      <Input
        label="Confirm New Password"
        type="password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Re-enter new password"
        leftIcon={<Lock className="w-4 h-4" />}
      />

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'Updating Password...' : 'Save New Password'}
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
  );
}

export default function ResetPasswordPage() {
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
          Create new password
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Choose a secure password to protect your multi-tenant workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-8 shadow-xl shadow-slate-200/50">
          <Suspense fallback={<div className="text-center py-8 text-xs text-slate-400">Loading reset session...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
