'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/lib/types';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-xl z-50 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Bell size={15} />
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-medium">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center gap-1">
              <CheckCheck size={12} />Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {loading && (
          <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">Loading...</div>
        )}
        {!loading && notifications.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
            <Bell size={24} className="mx-auto mb-2 opacity-30" />
            No notifications yet
          </div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-muted)] transition-colors ${!n.is_read ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{n.title}</p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{n.message}</p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{formatRelativeTime(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="flex-shrink-0 p-1 text-blue-500 hover:bg-blue-100 rounded-md"
                >
                  <Check size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
