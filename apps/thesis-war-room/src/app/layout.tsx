import type { Metadata } from 'next';
import './globals.css';

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
          {children}
        </div>
      </body>
    </html>
  );
}
