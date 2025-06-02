import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/footer/Footer';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Golden Tickets',
  description: 'Participez à notre offre promotionnelle et inscrivez-vous pour courir la chance de vous faire rembourser votre achat.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Suspense fallback={null}>
          {children}
          <Footer />
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
