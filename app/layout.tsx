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
    title: data?.meta_title || 'Golden Tickets',
    description: data?.meta_description || 'Participez à notre offre promotionnelle et inscrivez-vous pour courir la chance de vous faire rembourser votre achat.',
    openGraph: {
      images: data?.image_partage_url ? [data.image_partage_url] : [],
      title: data?.meta_title,
      description: data?.meta_description,
    },
    twitter: {
      card: 'summary_large_image',
      title: data?.meta_title,
      description: data?.meta_description,
      images: data?.image_partage_url ? [data.image_partage_url] : [],
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
        <body className={speede.className}>
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
        </body>
      </html>
    </ReglageSiteProvider>
  );
}
