"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

export default function DynamicBackgroundWrapper({ children }: { children: React.ReactNode }) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('reglage_site').select('background_type, background_colors').limit(1).single();
      if (data) {
        if (data.background_type === 'linear-gradient' && Array.isArray(data.background_colors) && data.background_colors.length > 1) {
          setStyle({ background: `linear-gradient(90deg, ${data.background_colors.join(', ')})` });
        } else if (data.background_type === 'solid' && Array.isArray(data.background_colors) && data.background_colors[0]) {
          setStyle({ background: data.background_colors[0] });
        }
      }
    })();
  }, []);

  return <div style={style} className="min-h-screen">{children}</div>;
} 