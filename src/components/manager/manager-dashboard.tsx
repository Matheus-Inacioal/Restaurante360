'use client';

import {
  Activity,
  ArrowUpRight,
  CheckSquare,
  Clock,
  LogIn,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { ChecklistInstance, User } from '@/lib/types';
import { useMemo } from 'react';


export function ManagerDashboard() {
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();
    const today = new Date().toISOString().split('T')[0];

    const checklistsQuery = useMemoFirebase(() => {
        if (!firestore || isUserLoading || !user) return null;
        return query(collection(firestore, 'checklists'), where('createdBy', '==', user.uid), where('date', '==', today));
    }, [firestore, today, user, isUserLoading]);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);
    
    const { data: checklistsDoDiaData, isLoading: isLoadingChecklists } = useCollection<ChecklistInstance>(checklistsQuery);
    const { data: usersData, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    const { checklistsDoDia, checkinsDoDia, tarefasAtrasadas, chartData, recentChecklists } = useMemo(() => {
        if (!checklistsDoDiaData || !usersData) {
            const emptyChartData = [
                { status: 'Concluído', total: 0, fill: 'hsl(var(--primary))' },
                { status: 'Em Progresso', total: 0, fill: 'hsl(var(--accent))' },
                { status: 'Pendente', total: 0, fill: 'hsl(var(--muted-foreground))' },
            ];
            return { checklistsDoDia: 0, checkinsDoDia: 0, tarefasAtrasadas: 0, chartData: emptyChartData, recentChecklists: [] };
        }

        const counts = checklistsDoDiaData.reduce((acc, checklist) => {
            if (checklist.status === 'completed') acc.completed++;
            if (checklist.status === 'in_progress') acc.in_progress++;
            if (checklist.status === 'open') acc.open++;
            return acc;
        }, { completed: 0, in_progress: 0, open: 0 });

        const uniqueCheckinUsers = new Set(checklistsDoDiaData.map(c => c.assignedTo));

        const newChartData = [
            { status: 'Concluído', total: counts.completed, fill: 'hsl(var(--primary))' },
            { status: 'Em Progresso', total: counts.in_progress, fill: 'hsl(var(--accent))' },
            { status: 'Pendente', total: counts.open, fill: 'hsl(var(--muted-foreground))' },
        ];
        
        const atrasadas = counts.in_progress + counts.open;
        
        const usersMap = new Map(usersData.map(u => [u.id, u.name]));
        
        const sortedRecent = [...checklistsDoDiaData]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(checklist => ({
              ...checklist,
              assignedToName: usersMap.get(checklist.assignedTo) || checklist.assignedTo
          }));


        return {
            checklistsDoDia: checklistsDoDiaData.length,
            checkinsDoDia: uniqueCheckinUsers.size,
            tarefasAtrasadas: atrasadas,
            chartData: newChartData,
            recentChecklists: sortedRecent,
        };
    }, [checklistsDoDiaData, usersData]);

    const isLoading = isLoadingChecklists || isLoadingUsers;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Checklists do Dia
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : checklistsDoDia}</div>
            <p className="text-xs text-muted-foreground">
              Total de checklists para hoje
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendentes / Em Progresso
            </CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{isLoading ? '...' : tarefasAtrasadas}</div>
            <p className="text-xs text-muted-foreground">
              Checklists que precisam de atenção
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins do Dia</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : checkinsDoDia}</div>
            <p className="text-xs text-muted-foreground">
              Colaboradores com tarefas hoje
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visão Geral dos Checklists</CardTitle>
            <CardDescription>Status dos checklists do dia.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="status"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsla(var(--muted))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Checklists Recentes</CardTitle>
            <CardDescription>
              Progresso dos checklists mais recentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && <TableRow><TableCell colSpan={2} className="text-center">Carregando...</TableCell></TableRow>}
                    {!isLoading && recentChecklists && recentChecklists.map((checklist) => (
                        <TableRow key={checklist.id}>
                            <TableCell>
                                <div className="font-medium">{checklist.assignedToName}</div>
                                <div className="text-sm text-muted-foreground">{checklist.processName}</div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge variant={
                                    checklist.status === 'completed' ? 'default' :
                                    checklist.status === 'in_progress' ? 'secondary' : 'outline'
                                }
                                className={checklist.status === 'completed' ? 'bg-green-600 text-white' : ''}
                                >{checklist.status}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
