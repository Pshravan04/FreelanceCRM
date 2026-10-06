import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  const currencyMap: Record<string, { locale: string; symbol: string }> = {
    INR: { locale: 'en-IN', symbol: '₹' },
    USD: { locale: 'en-US', symbol: '$' },
    EUR: { locale: 'de-DE', symbol: '€' },
    GBP: { locale: 'en-GB', symbol: '£' },
    AED: { locale: 'ar-AE', symbol: 'د.إ' },
    AUD: { locale: 'en-AU', symbol: 'A$' },
    CAD: { locale: 'en-CA', symbol: 'C$' },
  };

  const config = currencyMap[currency] || currencyMap.INR;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date | null, formatStr = 'MMM dd, yyyy'): string {
  if (!date) return '—';
  try {
    return format(new Date(date), formatStr);
  } catch {
    return '—';
  }
}

export function formatRelativeTime(date: string | Date | null): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

export function isOverdue(date: string | Date | null): boolean {
  if (!date) return false;
  try {
    return isPast(new Date(date));
  } catch {
    return false;
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateInvoiceNumber(prefix = 'INV'): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${year}${month}-${random}`;
}

export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Lead statuses
    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
    CONTACTED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    QUALIFIED: 'bg-purple-50 text-purple-700 border-purple-200',
    PROPOSAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    NEGOTIATION: 'bg-orange-50 text-orange-700 border-orange-200',
    WON: 'bg-green-50 text-green-700 border-green-200',
    LOST: 'bg-red-50 text-red-700 border-red-200',
    // Project statuses
    PLANNING: 'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    REVIEW: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    COMPLETED: 'bg-green-50 text-green-700 border-green-200',
    ON_HOLD: 'bg-orange-50 text-orange-700 border-orange-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    // Task statuses
    TODO: 'bg-gray-100 text-gray-700 border-gray-200',
    DONE: 'bg-green-50 text-green-700 border-green-200',
    // Invoice statuses
    DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
    SENT: 'bg-blue-50 text-blue-700 border-blue-200',
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    PAID: 'bg-green-50 text-green-700 border-green-200',
    OVERDUE: 'bg-red-50 text-red-700 border-red-200',
    // Payment statuses
    FAILED: 'bg-red-50 text-red-700 border-red-200',
    REFUNDED: 'bg-orange-50 text-orange-700 border-orange-200',
    // Follow-up statuses
    UPCOMING: 'bg-blue-50 text-blue-700 border-blue-200',
    SKIPPED: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-blue-50 text-blue-700',
    HIGH: 'bg-orange-50 text-orange-700',
    URGENT: 'bg-red-50 text-red-700',
  };
  return colors[priority] || 'bg-gray-100 text-gray-600';
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export const LEAD_SOURCES = [
  'Website', 'Instagram', 'LinkedIn', 'WhatsApp', 'Referral', 'Cold Email', 'Discord', 'Other'
];

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const;
export const PROJECT_STATUSES = ['PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELLED'] as const;
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const;
export const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const PAYMENT_METHODS = ['BANK_TRANSFER', 'UPI', 'CREDIT_CARD', 'PAYPAL', 'CASH', 'OTHER'] as const;
export const FOLLOWUP_TYPES = ['EMAIL', 'CALL', 'MEETING', 'OTHER'] as const;
