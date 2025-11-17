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
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { ChecklistInstance, CheckIn } from '@/lib/types';


const chartData = [
  { status: 'Concluído', total: Math.floor(Math.random() * 50) + 20, fill: 'hsl(var(--primary))' },
  { status: 'Em Progresso', total: Math.floor(Math.random() * 20) + 5, fill: 'hsl(var(--accent))' },
  { status: 'Pendente', total: Math.floor(Math.random() * 10) + 2, fill: 'hsl(var(--muted-foreground))' },
];

export function ManagerDashboard() {
    const { firestore } = useFirebase();
    const today = new Date().toISOString().split('T')[0];

    const checklistsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'checklists'), where('date', '==', today));
    }, [firestore, today]);

    const checkinsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'checkIns'), where('date', '==', today));
    }, [firestore, today]);

    const recentChecklistsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'checklists'), orderBy('date', 'desc'), limit(5));
    }, [firestore]);

    const { data: checklistsDoDiaData } = useCollection<ChecklistInstance>(checklistsQuery);
    const { data: checkinsDoDiaData } = useCollection<CheckIn>(checkinsQuery);
    const { data: recentChecklists } = useCollection<ChecklistInstance>(recentChecklistsQuery);

    const checklistsDoDia = checklistsDoDiaData?.length || 0;
    const checkinsDoDia = checkinsDoDiaData?.length || 0;

    const tarefasAtrasadas = checklistsDoDiaData?.filter(c => c.status === 'open' || c.status === 'in_progress').length || 0;

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
            <div className="text-2xl font-bold">{checklistsDoDia}</div>
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
            <div className="text-2xl font-bold text-destructive">{tarefasAtrasadas}</div>
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
            <div className="text-2xl font-bold">{checkinsDoDia}</div>
            <p className="text-xs text-muted-foreground">
              Colaboradores no turno atual
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
                    {recentChecklists && recentChecklists.map((checklist) => (
                        <TableRow key={checklist.id}>
                            <TableCell>
                                <div className="font-medium">{checklist.assignedTo}</div>
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
}
