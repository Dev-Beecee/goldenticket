"use client";
import { useEffect } from "react";
import { useReglageSite } from "@/hooks/useReglageSite";

export function ReglageSiteStyleProvider({ children }: { children: React.ReactNode }) {
  const { reglage } = useReglageSite();

  useEffect(() => {
    console.log("Valeur de reglage dans le provider:", reglage);
    if (!reglage) return;
    const body = document.body;
    if (reglage.texte_color) body.style.setProperty("--texte-color", reglage.texte_color);
    if (reglage.button_background_color) body.style.setProperty("--button-background-color", reglage.button_background_color);
    if (reglage.button_text_color) body.style.setProperty("--button-text-color", reglage.button_text_color);
    if (reglage.button_border_radius) body.style.setProperty("--button-border-radius", `${reglage.button_border_radius}px`);
    if (reglage.card_background_color) body.style.setProperty("--card-background-color", reglage.card_background_color);
    if (reglage.card_border_radius) body.style.setProperty("--card-border-radius", `${reglage.card_border_radius}px`);
    if (reglage.card_border) body.style.setProperty("--card-border", reglage.card_border);
    // Nettoyage si besoin (optionnel)
    return () => {
      body.style.removeProperty("--texte-color");
      body.style.removeProperty("--button-background-color");
      body.style.removeProperty("--button-text-color");
      body.style.removeProperty("--button-border-radius");
      body.style.removeProperty("--card-background-color");
      body.style.removeProperty("--card-border-radius");
      body.style.removeProperty("--card-border");
    };
  }, [reglage]);

  return <>{children}</>;
}