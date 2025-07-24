"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

type Props = {
  title: string;
  value: number;
  data: number[];
  today: number;
  yesterday: number;
};

export default function StatCard({ title, value, data, today, yesterday }: Props) {
  let percentage: number | null = null;
  let displayText = "–";

  const todayNumber = Number(today);
  const yesterdayNumber = Number(yesterday);

  if (!isNaN(todayNumber) && !isNaN(yesterdayNumber)) {
    if (yesterdayNumber === 0 && todayNumber === 0) {
      displayText = "0% par rapport à hier";
      percentage = 0;
    } else if (yesterdayNumber === 0 && todayNumber > 0) {
      displayText = "+100% par rapport à hier";
      percentage = 100;
    } else {
      const result = ((todayNumber - yesterdayNumber) / yesterdayNumber) * 100;
      if (Number.isFinite(result)) {
        percentage = result;
        displayText = `${result >= 0 ? "+" : ""}${result.toFixed(1)}% par rapport à hier`;
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col justify-between">
      <div className="space-y-1">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">
          {typeof value === "number" ? value.toLocaleString() : "–"}
        </p>
        <p
          className={`text-sm ${
            percentage === null ? "text-gray-400" :
            percentage >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {displayText}
        </p>
      </div>

      {data.length >= 2 && (
        <div className="mt-4 h-[60px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.map((val, index) => ({ index, val }))}>
              <Line
                type="monotone"
                dataKey="val"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 1.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
