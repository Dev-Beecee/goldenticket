// components/ReglageSiteStyles.tsx
'use client';

import { useReglageSite } from '@/hooks/useReglageSite';

export function ReglageSiteStyles() {
  const {
    texte_color,
    button_background_color,
    button_text_color,
    button_border_radius,
  } = useReglageSite();

  return (
    <style jsx global>{`
      :root {
        --texte-color: ${texte_color};
        --button-background-color: ${button_background_color};
        --button-text-color: ${button_text_color};
        --button-border-radius: ${button_border_radius ? `${button_border_radius}px` : '4px'};
      }
    `}</style>
  );
}
