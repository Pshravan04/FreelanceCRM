'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Zap, Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[var(--color-foreground)] rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-[var(--color-background)]" />
          </div>
          <span className="font-bold text-lg">FreelanceCRM</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📬</div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <Link href="/login" className="text-sm text-[var(--color-foreground)] font-medium hover:underline flex items-center justify-center gap-2">
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1">Reset password</h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-8">
              Enter your email and we&apos;ll send you a reset link
            </p>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Send Reset Link
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
