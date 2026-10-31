import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n-context';

export const metadata: Metadata = {
  title: 'OmniFlow AI — Enterprise AI Business Automation SaaS',
  description: 'Unify Facebook Messenger, Instagram, and WhatsApp. Automate sales and support with multimodal AI agents, order management, bKash/Nagad/Stripe payments, and Steadfast courier dispatch.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
