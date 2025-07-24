import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/footer/Footer';
import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import DynamicBackgroundWrapper from '@/components/DynamicBackgroundWrapper';
import { ReglageSiteProvider } from "@/hooks/useReglageSite";
import { ReglageSiteStyles } from '@/components/ReglageSiteStyles';
import { ReglageSiteStyleProvider } from '@/components/ReglageSiteStyleProvider';
import { AuthProvider } from '@/hooks/useAuth';
import localFont from 'next/font/local';

const speede = localFont({
  src: [
    { path: './fonts/speedee-app-light.woff2', weight: '300', style: 'normal' },
    { path: './fonts/speedee-app.woff2', weight: '400', style: 'normal' },
    { path: './fonts/speedee-app-bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
});


export async function generateMetadata() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.from('reglage_site').select('*').limit(1).single();
  return {
    title: 'Jeu Golden Ticket McDonald’s + de 20 000 cadeaux à gagner',
    description: 'McDonald’s Guadeloupe te fait gagner + de 20 000 cadeaux avec le Golden Ticket ! 1 menu = 1 ticket à gratter, du 17 juillet au 31 août 2025.',
    openGraph: {
      images: ['https://jeu-mcdo.fr/partage.jpg'],
      title: 'Jeu Golden Ticket McDonald’s + de 20 000 cadeaux à gagner',
      description: 'McDonald’s Guadeloupe te fait gagner + de 20 000 cadeaux avec le Golden Ticket ! 1 menu = 1 ticket à gratter, du 17 juillet au 31 août 2025.',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Jeu Golden Ticket McDonald’s + de 20 000 cadeaux à gagner',
      description: 'McDonald’s Guadeloupe te fait gagner + de 20 000 cadeaux avec le Golden Ticket ! 1 menu = 1 ticket à gratter, du 17 juillet au 31 août 2025.',
      images: ['https://jeu-mcdo.fr/partage.jpg'],
    }
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReglageSiteProvider>
      <html lang="fr" suppressHydrationWarning>
        <head>
          <script async src="https://www.googletagmanager.com/gtag/js?id=G-2ZBSQ74P40"></script>
          <script dangerouslySetInnerHTML={{ __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2ZBSQ74P40');
          ` }} />
        </head>
        <body className={speede.className}>
          <AuthProvider>
            <ReglageSiteStyleProvider>
              <ReglageSiteStyles />
              <DynamicBackgroundWrapper>
                <Suspense fallback={null}>
                  {children}
                  <Footer />
                </Suspense>
                <Toaster />
              </DynamicBackgroundWrapper>
            </ReglageSiteStyleProvider>
          </AuthProvider>
        </body>
      </html>
    </ReglageSiteProvider>
  );
}
