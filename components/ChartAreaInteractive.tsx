"use client"

import * as React from "react"
import {
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export const description = "An interactive area chart showing event participation"

const chartData = [
    { date: "2024-06-01", inscriptions: 30, participations: 20 },
    { date: "2024-06-02", inscriptions: 40, participations: 35 },
    { date: "2024-06-03", inscriptions: 20, participations: 15 },
    { date: "2024-06-04", inscriptions: 50, participations: 42 },
    { date: "2024-06-05", inscriptions: 60, participations: 50 },
    { date: "2024-06-06", inscriptions: 25, participations: 18 },
    { date: "2024-06-07", inscriptions: 70, participations: 60 },
    { date: "2024-06-08", inscriptions: 45, participations: 30 },
    { date: "2024-06-09", inscriptions: 55, participations: 45 },
    { date: "2024-06-10", inscriptions: 35, participations: 25 },
]

const chartConfig = {
    inscriptions: {
        label: "Inscriptions",
        color: "var(--chart-1)",
    },
    participations: {
        label: "Participations",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

export function ChartAreaInteractive() {
    const [timeRange, setTimeRange] = React.useState("30d")

    // Logique potentielle pour filtrer plus tard
    const filteredData = chartData // à remplacer selon le filtre

    return (
        <Card className="pt-0">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Participation au jeu</CardTitle>
                    <CardDescription>
                        Évolution des inscriptions et participations récentes
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                        aria-label="Select time range"
                    >
                        <SelectValue placeholder="Last 30 days" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="90d" className="rounded-lg">
                            Derniers 3 mois
                        </SelectItem>
                        <SelectItem value="30d" className="rounded-lg">
                            Derniers 30 jours
                        </SelectItem>
                        <SelectItem value="7d" className="rounded-lg">
                            Derniers 7 jours
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={filteredData}>
                        <defs>
                            <linearGradient id="fillInscriptions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-inscriptions)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-inscriptions)" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="fillParticipations" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-participations)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-participations)" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "short",
                                })
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("fr-FR", {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                        })
                                    }}
                                    indicator="dot"
                                />
                            }
                        />
                        <Area
                            dataKey="inscriptions"
                            type="natural"
                            fill="url(#fillInscriptions)"
                            stroke="var(--color-inscriptions)"
                            stackId="a"
                        />
                        <Area
                            dataKey="participations"
                            type="natural"
                            fill="url(#fillParticipations)"
                            stroke="var(--color-participations)"
                            stackId="a"
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
