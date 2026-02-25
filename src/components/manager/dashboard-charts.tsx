"use client"

import { Pie, PieChart, Cell } from "recharts"
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
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export type ChartDataPoint = {
    name: string;
    value: number;
    color: string;
}

const chartConfig = {
    value: {
        label: "Checklists",
    },
    completed: {
        label: "Concluído",
        color: "hsl(var(--primary))",
    },
    progress: {
        label: "Em Progresso",
        color: "hsl(var(--accent))",
    },
    pending: {
        label: "Pendente",
        color: "hsl(var(--muted-foreground))",
    },
} satisfies ChartConfig

export function DashboardCharts({ data }: { data: ChartDataPoint[] }) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    if (total === 0) {
        return (
            <Card className="flex flex-col h-full">
                <CardHeader className="items-center pb-0">
                    <CardTitle>Desempenho da Semana</CardTitle>
                    <CardDescription>Tarefas e Rotinas criadas nos últimos dias</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-muted-foreground text-sm">Dados insuficientes para gerar o gráfico neste período.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="items-center pb-0">
                <CardTitle>Desempenho da Semana</CardTitle>
                <CardDescription>Panorama de status geral da operação</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[220px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
                >
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            strokeWidth={2}
                            stroke="hsl(var(--background))"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <div className="p-4 pt-2 text-center text-xs text-muted-foreground">
                Exibindo proporção de {total} itens registrados até o momento.
            </div>
        </Card>
    )
}
