'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, Zap, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Please check your email to verify.');
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[var(--color-foreground)] rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-[var(--color-background)]" />
          </div>
          <span className="font-bold text-lg">FreelanceCRM</span>
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-1">Create your account</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-8">
          Start managing your freelance business today
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Full Name</label>
            <input
              id="name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              required
              className="w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Email address</label>
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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-muted-foreground)] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--color-foreground)] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
