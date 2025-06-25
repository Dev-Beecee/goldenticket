import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/footer/Footer';
import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import DynamicBackgroundWrapper from '@/components/DynamicBackgroundWrapper';

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
    <html lang="fr" suppressHydrationWarning>
      <body>
        <DynamicBackgroundWrapper>
          <Suspense fallback={null}>
            {children}
            <Footer />
          </Suspense>
          <Toaster />
        </DynamicBackgroundWrapper>
      </body>
    </html>
  );
}
