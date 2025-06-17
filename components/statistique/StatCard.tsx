"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

type Props = {
    title: string;
    value: number;
    percentage?: number;
    data: number[];
};

export default function StatCard({ title, value, percentage = 0, data }: Props) {
    return (
        <div className="bg-white rounded-xl shadow p-6 flex flex-col justify-between">
            <div className="space-y-1">
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
                <p className={`text-sm ${percentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {percentage >= 0 ? "+" : ""}
                    {percentage.toFixed(1)}% par rapport à hier
                </p>
            </div>
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
        </div>
    );
}
