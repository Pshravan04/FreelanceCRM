import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: {
    default: 'FreelanceCRM — Your Complete Freelance Business',
    template: '%s | FreelanceCRM',
  },
  description: 'Manage your entire freelance business — leads, clients, projects, tasks, invoices, and analytics — all in one place.',
  keywords: ['freelancer', 'crm', 'client management', 'invoicing', 'project management'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FreelanceCRM',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
