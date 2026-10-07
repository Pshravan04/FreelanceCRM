'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getDashboardStats, getRevenueChartData, getLeads, getFollowUps } from '@/lib/services/data';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import type { DashboardStats, Lead, FollowUp } from '@/lib/types';
import {
  TrendingUp, TrendingDown, Users2, UserCheck, FolderKanban,
  FileText, CreditCard, AlertCircle, Plus, ArrowRight, Clock
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const CHART_COLORS = ['#111111', '#555555', '#999999', '#cccccc', '#e5e5e5'];

export default function DashboardPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<Array<{ label: string; revenue: number }>>([]);
  const [leadPipeline, setLeadPipeline] = useState<Array<{ status: string; count: number }>>([]);
  const [todayFollowUps, setTodayFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsData, revenueChartData, leads, followUps] = await Promise.all([
          getDashboardStats(),
          getRevenueChartData(6),
          getLeads(),
          getFollowUps({ status: 'UPCOMING' }),
        ]);

        setStats(statsData);
        setRevenueData(revenueChartData);

        // Lead pipeline data
        const pipelineMap: Record<string, number> = {
          NEW: 0, CONTACTED: 0, QUALIFIED: 0, PROPOSAL: 0, NEGOTIATION: 0, WON: 0, LOST: 0
        };
        leads.forEach(l => { pipelineMap[l.status] = (pipelineMap[l.status] || 0) + 1; });
        setLeadPipeline(Object.entries(pipelineMap).map(([status, count]) => ({ status, count })));

        // Today's follow-ups
        const today = new Date();
        const todayFU = followUps.filter(f => {
          const d = new Date(f.due_at);
          return d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();
        });
        setTodayFollowUps(todayFU);
      } catch (err) {
        console.error('Dashboard load error:', err ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err));
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const currency = profile?.currency || 'INR';

  const kpiCards = [
    {
      label: 'Revenue This Month',
      value: formatCurrency(stats?.revenueThisMonth || 0, currency),
      change: stats?.revenueChange || 0,
      icon: CreditCard,
      color: 'text-green-600',
      href: '/payments',
    },
    {
      label: 'Pending Payments',
      value: formatCurrency(stats?.pendingPayments || 0, currency),
      change: null,
      icon: AlertCircle,
      color: 'text-yellow-600',
      href: '/invoices',
    },
    {
      label: 'Active Clients',
      value: stats?.activeClients || 0,
      change: null,
      icon: UserCheck,
      color: 'text-blue-600',
      href: '/clients',
    },
    {
      label: 'Active Projects',
      value: stats?.activeProjects || 0,
      change: null,
      icon: FolderKanban,
      color: 'text-purple-600',
      href: '/projects',
    },
    {
      label: 'Total Leads',
      value: stats?.totalLeads || 0,
      change: null,
      icon: Users2,
      color: 'text-indigo-600',
      href: '/leads',
    },
    {
      label: 'Outstanding Invoices',
      value: stats?.outstandingInvoices || 0,
      change: null,
      icon: FileText,
      color: stats?.overdueInvoices ? 'text-red-600' : 'text-gray-600',
      href: '/invoices',
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-foreground)]">
            {greeting}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-xs md:text-sm text-[var(--color-muted-foreground)] mt-1">
            Here's your business overview
          </p>
        </div>

        {/* Quick Actions (Desktop only, mobile uses FAB) */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          <QuickAction label="Add Lead" href="/leads?new=1" />
          <QuickAction label="New Project" href="/projects?new=1" />
          <QuickAction label="Create Invoice" href="/invoices?new=1" primary />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="card p-3 md:p-4 hover:border-[var(--color-muted-foreground)] transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon size={16} className={card.color} />
                {card.change !== null && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${card.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(card.change)}%
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-[var(--color-foreground)] mb-1">
                {card.value}
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)]">{card.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Revenue Overview</h2>
            <span className="text-xs text-[var(--color-muted-foreground)]">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={revenueData}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ fontSize: 12, border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-card)' }}
                formatter={(v: any) => [formatCurrency(v as number, currency), 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#111111" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Pipeline */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Lead Pipeline</h2>
            <Link href="/leads" className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center gap-1">
              View all <ArrowRight size={10} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={leadPipeline} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-card)' }} />
              <Bar dataKey="count" fill="#111111" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's follow-ups */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Clock size={14} />
              Today&apos;s Follow-ups
              {todayFollowUps.length > 0 && (
                <span className="ml-1 text-xs bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 font-medium">{todayFollowUps.length}</span>
              )}
            </h2>
            <Link href="/follow-ups" className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
              <ArrowRight size={14} />
            </Link>
          </div>
          {todayFollowUps.length === 0 ? (
            <div className="py-6 text-center">
              <div className="text-2xl mb-2">✓</div>
              <p className="text-sm text-[var(--color-muted-foreground)]">All caught up today!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayFollowUps.slice(0, 4).map((fu) => (
                <div key={fu.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1 h-1 rounded-full bg-[var(--color-foreground)] mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">{fu.title}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {format(new Date(fu.due_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold mb-4">Business Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatRow label="New Leads This Month" value={stats?.newLeads || 0} />
            <StatRow label="Overdue Invoices" value={stats?.overdueInvoices || 0} alert={!!stats?.overdueInvoices} />
            <StatRow label="Pending Payments" value={formatCurrency(stats?.pendingPayments || 0, currency)} />
            <StatRow label="Conversion Rate" value={
              stats?.totalLeads ? `${Math.round((1 / stats.totalLeads) * 100)}%` : '0%'
            } />
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Need to follow up?</span>
              <Link href="/follow-ups" className="flex items-center gap-1 text-[var(--color-foreground)] font-medium hover:opacity-70">
                View Follow-ups <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, href, primary = false }: { label: string; href: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        primary
          ? 'bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-90'
          : 'border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
      }`}
    >
      <Plus size={14} />
      {label}
    </Link>
  );
}

function StatRow({ label, value, alert = false }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-muted-foreground)]">{label}</span>
      <span className={`text-sm font-semibold ${alert ? 'text-red-600' : 'text-[var(--color-foreground)]'}`}>{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="skeleton h-8 w-64 mb-2 rounded" />
      <div className="skeleton h-4 w-40 mb-8 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="skeleton h-4 w-8 mb-3 rounded" />
            <div className="skeleton h-6 w-20 mb-1 rounded" />
            <div className="skeleton h-3 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
