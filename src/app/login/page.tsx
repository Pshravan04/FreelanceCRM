'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, Zap, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-foreground)] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--color-background)] rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-[var(--color-foreground)]" />
          </div>
          <span className="text-[var(--color-background)] font-bold text-lg">FreelanceCRM</span>
        </div>

        <div>
          <blockquote className="text-[var(--color-background)] text-2xl font-semibold leading-relaxed mb-6">
            &ldquo;My entire freelance business in one place.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
              R
            </div>
            <div>
              <p className="text-white font-medium text-sm">Rahul Sharma</p>
              <p className="text-white/60 text-xs">Freelance Designer</p>
            </div>
          </div>
        </div>

        <div className="text-white/40 text-xs">
          © {new Date().getFullYear()} FreelanceCRM. Built for freelancers.
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[var(--color-foreground)] rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-[var(--color-background)]" />
            </div>
            <span className="font-bold text-lg">FreelanceCRM</span>
          </div>

          <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-1">Welcome back</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-8">
            Sign in to your CRM dashboard
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-[var(--color-foreground)]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:border-transparent transition-all"
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
              Sign in
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-muted-foreground)] mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[var(--color-foreground)] font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
