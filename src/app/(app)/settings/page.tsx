'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Save, User, Bell, Shield, Wallet, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Dummy state for demonstration
  const [profileForm, setProfileForm] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    company: '',
    website: '',
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: profileForm.name }
      });
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business Details', icon: Wallet },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Settings</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Manage your account and business preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === tab.id 
                  ? "bg-[var(--color-foreground)] text-[var(--color-background)]" 
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card p-6 animate-fade-in">
              <h2 className="text-lg font-semibold mb-6">Profile Settings</h2>
              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      value={profileForm.name} 
                      onChange={e => setProfileForm(p => ({...p, name: e.target.value}))}
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      value={profileForm.email} 
                      disabled
                      className={cn(inputClass, "opacity-70 cursor-not-allowed")} 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Company Name</label>
                  <input 
                    type="text" 
                    value={profileForm.company} 
                    onChange={e => setProfileForm(p => ({...p, company: e.target.value}))}
                    className={inputClass} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">Website</label>
                  <input 
                    type="url" 
                    value={profileForm.website} 
                    onChange={e => setProfileForm(p => ({...p, website: e.target.value}))}
                    placeholder="https://"
                    className={inputClass} 
                  />
                </div>

                <div className="pt-4 border-t border-[var(--color-border)] flex justify-end">
                  <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-semibold rounded-lg hover:opacity-90">
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab !== 'profile' && (
            <div className="card p-12 text-center animate-fade-in">
              <div className="mx-auto w-12 h-12 bg-[var(--color-muted)] rounded-full flex items-center justify-center mb-4">
                {tabs.find(t => t.id === activeTab)?.icon({ size: 24, className: 'text-[var(--color-muted-foreground)]' })}
              </div>
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-[var(--color-muted-foreground)] text-sm max-w-sm mx-auto">
                The {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} settings module is currently under development. Check back later!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass = 'w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:border-transparent transition-all';
