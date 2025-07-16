"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

export function RegistrationHeader() {
  const [headerUrl, setHeaderUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("reglage_site").select("header_image_url").limit(1).single();
      setHeaderUrl(data?.header_image_url || null);
    })();
  }, []);

  return (
    <div className="mb-8 text-center">
      <img
        src={headerUrl || ""}
        alt=""
        className="mx-auto max-w-full h-auto"
      />
    </div>
  );
}
