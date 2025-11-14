'use client';

import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Download, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React from 'react';

const complianceData = [
  { name: 'Carlos Souza', value: 95, fill: 'hsl(var(--chart-1))' },
  { name: 'Beatriz Costa', value: 88, fill: 'hsl(var(--chart-2))' },
  { name: 'Marcos Andrade', value: 98, fill: 'hsl(var(--chart-3))' },
  { name: 'Juliana Lima', value: 92, fill: 'hsl(var(--chart-4))' },
];

const statusData = [
    { name: 'Concluídas', value: 400, fill: 'hsl(var(--primary))' },
    { name: 'Pendentes', value: 30, fill: 'hsl(var(--muted))' },
    { name: 'Não Aplicável', value: 50, fill: 'hsl(var(--accent))' },
];

export default function ReportsPage() {
    const [date, setDate] = React.useState<Date>();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
              <h2 className="text-2xl font-bold tracking-tight">Relatórios de Performance</h2>
              <p className="text-muted-foreground">
              Analise a conformidade e a conclusão de tarefas.
              </p>
          </div>
          <div className='flex gap-2 w-full md:w-auto'>
              <Popover>
                  <PopoverTrigger asChild>
                  <Button
                      variant={"outline"}
                      className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                      )}
                  >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Escolha uma data</span>}
                  </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                  <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                  />
                  </PopoverContent>
              </Popover>
              <Button>Gerar Relatório</Button>
              <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Exportar</Button>
          </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">480</div>
                  <p className="text-xs text-muted-foreground">no período selecionado</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conformidade Média</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-green-600">93.2%</div>
                  <p className="text-xs text-muted-foreground">+1.5% vs. período anterior</p>
              </CardContent>
          </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                  <CardTitle>Conformidade por Colaborador</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={complianceData} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="#888888" fontSize={12}/>
                          <Tooltip cursor={{ fill: 'hsla(var(--muted))' }} />
                          <Bar dataKey="value" name="Conformidade" unit="%" radius={[0, 4, 4, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                  <CardTitle>Distribuição de Status das Tarefas</CardTitle>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                          <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                              {statusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                          </Pie>
                          <Tooltip />
                      </PieChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
      </div>

    </main>
  );
}
