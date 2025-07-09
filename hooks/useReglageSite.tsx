"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

const ReglageSiteContext = createContext<any>(null);

export function ReglageSiteProvider({ children }: { children: React.ReactNode }) {
  const [reglage, setReglage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("reglage_site").select("*").limit(1).single();
      setReglage(data);
      setLoading(false);
    })();
  }, []);

  return (
    <ReglageSiteContext.Provider value={{ reglage, loading }}>
      {children}
    </ReglageSiteContext.Provider>
  );
}

export function useReglageSite() {
  return useContext(ReglageSiteContext);
} 