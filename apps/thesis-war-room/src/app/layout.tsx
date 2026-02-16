import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Activity, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'THESIS War Room',
  description: 'Real-time dashboard for THESIS VC analysis platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-background">
        <div className="min-h-screen bg-background">
          <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity"
                >
                  <Home className="w-6 h-6" />
                  THESIS
                </Link>
                <div className="flex items-center gap-4">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Sessions
                  </Link>
                  <Link
                    href="/activity"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Activity className="w-4 h-4" />
                    Activity
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
