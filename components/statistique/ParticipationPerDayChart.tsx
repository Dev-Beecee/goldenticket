"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParticipationPerDayChart() {
  const [data, setData] = useState<{ date: string; participations: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/statistiques", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
      });
      const json = await res.json();
      if (res.ok && json.stats && json.stats.participationsParJour) {
        // Transforme l'objet en tableau trié par date
        const arr = Object.entries(json.stats.participationsParJour)
          .map(([date, participations]) => ({ date, participations: Number(participations) }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setData(arr);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <Card className="py-0">
      <CardHeader>
        <CardTitle>Participations par jour</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {loading ? (
          <div>Chargement...</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("fr-FR", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("fr-FR", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
                formatter={(value) => [value, "Participations"]}
              />
              <Bar dataKey="participations" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
} 