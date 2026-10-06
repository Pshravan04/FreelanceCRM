import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: {
    default: 'FreelanceCRM — Your Complete Freelance Business',
    template: '%s | FreelanceCRM',
  },
  description: 'Manage your entire freelance business — leads, clients, projects, tasks, invoices, and analytics — all in one place.',
  keywords: ['freelancer', 'crm', 'client management', 'invoicing', 'project management'],
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
