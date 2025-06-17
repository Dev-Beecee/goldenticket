"use client"

import * as React from "react"
import {
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
} from "recharts"
import useSWR from "swr"

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

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function ChartAreaInteractive() {
    const [timeRange, setTimeRange] = React.useState("30d")
    const { data, error, isLoading } = useSWR(
        `https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/dashboard-participation?timeRange=${timeRange}`,
        fetcher
    )

    if (error) return <div>Erreur de chargement des données</div>
    if (isLoading) return <div>Chargement...</div>

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
                        <SelectItem value="7d" className="rounded-lg">
                            Derniers 7 jours
                        </SelectItem>
                        <SelectItem value="14d" className="rounded-lg">
                            Dernières 2 semaines
                        </SelectItem>
                        <SelectItem value="30d" className="rounded-lg">
                            Dernier mois
                        </SelectItem>
                        <SelectItem value="45d" className="rounded-lg">
                            Dernier mois et demi
                        </SelectItem>
                        <SelectItem value="60d" className="rounded-lg">
                            Derniers 2 mois
                        </SelectItem>
                        <SelectItem value="90d" className="rounded-lg">
                            Derniers 3 mois
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={data}>
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