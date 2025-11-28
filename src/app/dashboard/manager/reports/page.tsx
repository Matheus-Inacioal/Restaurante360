'use client';

import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Download, Users, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useMemo } from 'react';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { ChecklistInstance, User } from '@/lib/types';


export default function ReportsPage() {
    const [date, setDate] = React.useState<Date>(new Date());
    const { firestore } = useFirebase();
    const { user } = useUser();

    const formattedDate = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    const checklistsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'checklists'), where('date', '==', formattedDate), where('createdBy', '==', user.uid));
    }, [firestore, formattedDate, user]);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);


    const { data: checklists, isLoading: loadingChecklists } = useCollection<ChecklistInstance>(checklistsQuery);
    const { data: users, isLoading: loadingUsers } = useCollection<User>(usersQuery);

    const { totalTasks, complianceData, statusData, averageCompliance } = useMemo(() => {
        if (!checklists || !users) {
            return { totalTasks: 0, complianceData: [], statusData: [], averageCompliance: 0 };
        }

        let totalTasksCount = 0;
        const statusCounts = { completed: 0, in_progress: 0, open: 0 };
        const userCompliance = new Map<string, { completed: number, total: number }>();

        checklists.forEach(checklist => {
            const tasks = checklist.tasks || [];
            totalTasksCount += tasks.length;
            statusCounts[checklist.status]++;
            
            if (!userCompliance.has(checklist.assignedTo)) {
                userCompliance.set(checklist.assignedTo, { completed: 0, total: 0 });
            }
            const compliance = userCompliance.get(checklist.assignedTo)!;
            
            if (tasks.length > 0) {
                compliance.total += tasks.length;
                compliance.completed += tasks.filter(t => t.status === 'done').length;
            }
        });

        const newStatusData = [
            { name: 'Concluídos', value: statusCounts.completed, fill: 'hsl(var(--primary))' },
            { name: 'Em Progresso', value: statusCounts.in_progress, fill: 'hsl(var(--accent))' },
            { name: 'Pendentes', value: statusCounts.open, fill: 'hsl(var(--muted-foreground))' },
        ];
        
        const newComplianceData = Array.from(userCompliance.entries()).map(([userId, data], index) => {
            const user = users.find(u => u.id === userId);
            const percentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;
            return {
                name: user?.name || 'Desconhecido',
                value: Math.round(percentage),
                fill: `hsl(var(--chart-${(index % 5) + 1}))`
            }
        }).sort((a, b) => b.value - a.value);

        const totalComplianceSum = newComplianceData.reduce((acc, curr) => acc + curr.value, 0);
        const newAverageCompliance = newComplianceData.length > 0 ? totalComplianceSum / newComplianceData.length : 0;

        return { 
            totalTasks: totalTasksCount, 
            complianceData: newComplianceData, 
            statusData: newStatusData,
            averageCompliance: Math.round(newAverageCompliance)
        };

    }, [checklists, users]);
    
    const isLoading = loadingChecklists || loadingUsers;

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
                      {date ? format(date, "PPP", {}) : <span>Escolha uma data</span>}
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
              <Button disabled>Gerar Relatório</Button>
              <Button variant="outline" disabled><Download className="mr-2 h-4 w-4" /> Exportar</Button>
          </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? '...' : totalTasks}</div>
                  <p className="text-xs text-muted-foreground">no período selecionado</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conformidade Média</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-green-600">{isLoading ? '...' : `${averageCompliance}%`}</div>
                  <p className="text-xs text-muted-foreground">de todas as tarefas concluídas</p>
              </CardContent>
          </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                  <CardTitle>Conformidade por Colaborador</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? <p className="text-center">Carregando dados...</p> : (
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={complianceData} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="#888888" fontSize={12} width={120} />
                          <Tooltip cursor={{ fill: 'hsla(var(--muted))' }} />
                          <Bar dataKey="value" name="Conformidade" unit="%" radius={[0, 4, 4, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                  <CardTitle>Distribuição de Status dos Checklists</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-center">Carregando dados...</p> : (
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
                )}
              </CardContent>
          </Card>
      </div>

    </main>
  );
}

    