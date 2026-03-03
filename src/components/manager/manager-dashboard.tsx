'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useFirebase, useCollection, useUser } from '@/firebase';
import { Search, Plus, Play, Calendar as CalendarIcon } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import type { ChecklistInstance, User } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import dos novos componentes modulares
import { DashboardCards } from './dashboard-cards';
import { PrioritiesList, type PriorityItem } from './priorities-list';
import { ActivityFeed, type FeedItem } from './activity-feed';
import { DashboardCharts, type ChartDataPoint } from './dashboard-charts';

export function ManagerDashboard() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [period, setPeriod] = useState('hoje');

  // Tratamento da data contextual
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const todayDateString = new Date().toLocaleDateString('pt-BR', dateOptions);
  const formattedDate = todayDateString.charAt(0).toUpperCase() + todayDateString.slice(1);

  // --- Opcional: Futura integração real de queries abaixo ---
  // const today = new Date().toISOString().split('T')[0];
  // const checklistsQuery = useMemoFirebase(() => { ... });
  // const { data: checklistsDoDiaData } = useCollection<ChecklistInstance>(checklistsQuery);
  // -----------------------------------------------------------

  // ==========================================
  // MOCKS DE DADOS UI - PARA DEMONSTRAÇÃO DO LAYOUT
  // ==========================================

  // Dashboard Metrics
  const metrics = {
    pendingCritical: 2,
    executionTodayCompleted: 14,
    executionTodayTotal: 25,
    activeTeam: 8
  };

  // Priorities (Atrasadas primeiro, depois hoje)
  const prioritiesMock: PriorityItem[] = [
    { id: '1', type: 'rotina', title: 'Abertura de Caixa', assignee: 'Maria Souza', deadline: '09:00', status: 'atrasado' },
    { id: '2', type: 'tarefa', title: 'Reposição Limpeza', assignee: 'João Silva', deadline: '10:30', status: 'atrasado' },
    { id: '3', type: 'processo', title: 'Inspeção Sanitária', assignee: 'Carlos Gerente', deadline: '14:00', status: 'hoje' },
    { id: '4', type: 'rotina', title: 'Troca de Turno', assignee: 'Equipe Tarde', deadline: '15:00', status: 'hoje' },
    { id: '5', type: 'tarefa', title: 'Auditoria de Estoque', assignee: 'Ana Clara', deadline: '18:00', status: 'hoje' },
  ];

  // Feed (Recentes)
  const feedMock: FeedItem[] = [
    { id: 'f1', user: 'Maria Souza', initials: 'MS', action: 'concluiu a rotina', target: 'Abertura de Caixa (Ontem)', time: 'há 10 min' },
    { id: 'f2', user: 'João Silva', initials: 'JS', action: 'anexou uma foto em', target: 'Manutenção Freezer', time: 'há 45 min' },
    { id: 'f3', user: 'Carlos Gerente', initials: 'CG', action: 'criou o processo', target: 'Treinamento Novatos', time: 'há 1 hora' },
    { id: 'f4', user: 'Ana Clara', initials: 'AC', action: 'concluiu a tarefa', target: 'Reposição Bebidas', time: 'há 2 horas' },
  ];

  // Chart
  const chartMock: ChartDataPoint[] = [
    { name: 'Concluído', value: 45, color: 'hsl(var(--primary))' },
    { name: 'Em Progresso', value: 30, color: 'hsl(var(--accent))' },
    { name: 'Pendente', value: 25, color: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <div className="flex flex-col space-y-6">

      {/* 1. TOPO DO DASHBOARD: Data, Filtro e Ações Rápidas */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard do Gestor</h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <CalendarIcon className="h-4 w-4" /> {formattedDate}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Tabs value={period} onValueChange={setPeriod} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="hoje">Hoje</TabsTrigger>
              <TabsTrigger value="semana">Semana</TabsTrigger>
              <TabsTrigger value="mes">Mês</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar tarefas, rotinas..."
              className="pl-8 w-full bg-background"
            />
          </div>
        </div>
      </div>

      {/* Ações Rápidas (Nova Linha Base) */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <Button size="sm" className="h-8" asChild>
          <Link href="/empresa/tarefas">
            <Plus className="mr-2 h-4 w-4" /> Criar tarefa
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="h-8" asChild>
          <Link href="/empresa/rotinas">
            <Plus className="mr-2 h-4 w-4" /> Criar rotina
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="h-8" asChild>
          <Link href="/empresa/processos">
            <Plus className="mr-2 h-4 w-4" /> Criar processo
          </Link>
        </Button>
        <Button size="sm" variant="secondary" className="h-8 bg-primary/10 text-primary hover:bg-primary/20" asChild>
          <Link href="/empresa/processos">
            <Play className="mr-2 h-4 w-4" /> Executar processo
          </Link>
        </Button>
      </div>

      {/* 2. CARDS PRINCIPAIS */}
      <DashboardCards
        pendingCritical={metrics.pendingCritical}
        executionTodayCompleted={metrics.executionTodayCompleted}
        executionTodayTotal={metrics.executionTodayTotal}
        activeTeam={metrics.activeTeam}
      />

      {/* 3. ÁREA CENTRAL: Prioridades e Feed + Grafícos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

        {/* Coluna Esquerda: Master (Prioridades) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <PrioritiesList items={prioritiesMock} />
        </div>

        {/* Coluna Direita (Atividade e Gráfico Reduzido) */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">

          <div className="h-1/2 min-h-[300px]">
            <ActivityFeed items={feedMock} />
          </div>

          <div className="h-1/2 min-h-[300px]">
            <DashboardCharts data={chartMock} />
          </div>

        </div>

      </div>

    </div>
  );
}
