'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Play, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { useTarefas } from '@/hooks/use-tarefas';
import { useUsuarios } from '@/hooks/use-usuarios';

// Import dos novos componentes modulares
import { DashboardCards } from './dashboard-cards';
import { PrioritiesList, type PriorityItem } from './priorities-list';
import { ActivityFeed, type FeedItem } from './activity-feed';
import { DashboardCharts, type ChartDataPoint } from './dashboard-charts';

export function ManagerDashboard() {
  const [period, setPeriod] = useState('hoje');

  const { tarefas, isCarregando: carregandoTarefas, erro: erroTarefas } = useTarefas();
  const { usuarios, isCarregando: carregandoUsuarios, erro: erroUsuarios } = useUsuarios();

  const isCarregando = carregandoTarefas || carregandoUsuarios;
  const erro = erroTarefas || erroUsuarios;

  // Tratamento da data contextual
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const todayDateString = new Date().toLocaleDateString('pt-BR', dateOptions);
  const formattedDate = todayDateString.charAt(0).toUpperCase() + todayDateString.slice(1);

  if (isCarregando) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-full sm:w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-1 lg:col-span-4 h-96 w-full" />
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar dashboard</AlertTitle>
        <AlertDescription>
          {erro}. Tente recarregar a página.
        </AlertDescription>
      </Alert>
    );
  }

  // ==========================================
  // PROCESSAMENTO DE DADOS REAIS
  // ==========================================
  const todayStr = new Date().toISOString().split('T')[0];

  const tarefasDoDia = tarefas.filter(t => t.origem?.dataReferencia === todayStr || t.prazo?.startsWith(todayStr));
  const executionTodayTotal = tarefasDoDia.length;
  const executionTodayCompleted = tarefasDoDia.filter(t => t.status === 'concluida').length;
  const pendingCritical = tarefas.filter(t => t.prioridade === 'Alta' && t.status !== 'concluida').length;
  const activeTeam = usuarios.filter(u => u.status === 'ativo').length;

  const prioritiesList: PriorityItem[] = tarefas
    .filter(t => t.status === 'pendente' || t.status === 'em_progresso' || t.status === 'atrasada')
    .sort((a, b) => {
      // Tarefas sem prazo vêm por último
      if (!a.prazo) return 1;
      if (!b.prazo) return -1;
      return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
    })
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      type: t.origem?.tipo || 'tarefa',
      title: t.titulo,
      assignee: usuarios.find(u => u.id === t.responsavel)?.nome || 'Não atribuído',
      deadline: t.prazo ? new Date(t.prazo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem prazo',
      status: t.prazo && new Date(t.prazo) < new Date() ? 'atrasado' : 'hoje'
    }));

  const feedList: FeedItem[] = tarefas
    .filter(t => t.status === 'concluida')
    .sort((a, b) => new Date(b.atualizadoEm || b.criadoEm).getTime() - new Date(a.atualizadoEm || a.criadoEm).getTime())
    .slice(0, 5)
    .map(t => {
      const u = usuarios.find(usr => usr.id === t.responsavel);
      const nome = u?.nome || 'Sistema';
      const initials = nome.substring(0, 2).toUpperCase();

      let tempo = 'Hoje';
      if (t.atualizadoEm) {
        const diffEmMinutos = Math.floor((new Date().getTime() - new Date(t.atualizadoEm).getTime()) / 60000);
        if (diffEmMinutos < 60) {
          tempo = `há ${diffEmMinutos} min`;
        } else if (diffEmMinutos < 1440) {
          tempo = `há ${Math.floor(diffEmMinutos / 60)}h`;
        } else {
          tempo = new Date(t.atualizadoEm).toLocaleDateString('pt-BR');
        }
      }

      return {
        id: t.id,
        user: nome,
        initials,
        action: 'concluiu algo',
        target: t.titulo,
        time: tempo
      };
    });

  const chartData: ChartDataPoint[] = [
    { name: 'Concluído', value: tarefas.filter(t => t.status === 'concluida').length, color: 'hsl(var(--primary))' },
    { name: 'Em Progresso', value: tarefas.filter(t => t.status === 'em_progresso').length, color: 'hsl(var(--accent))' },
    { name: 'Pendente', value: tarefas.filter(t => t.status === 'pendente' || t.status === 'atrasada').length, color: 'hsl(var(--muted-foreground))' },
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
        pendingCritical={pendingCritical}
        executionTodayCompleted={executionTodayCompleted}
        executionTodayTotal={executionTodayTotal}
        activeTeam={activeTeam}
      />

      {/* 3. ÁREA CENTRAL: Prioridades e Feed + Grafícos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

        {/* Coluna Esquerda: Master (Prioridades) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <PrioritiesList items={prioritiesList} emptyMessage="Parabéns! Nenhuma prioridade atrasada ou pendente para hoje." />
        </div>

        {/* Coluna Direita (Atividade e Gráfico Reduzido) */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">

          <div className="h-1/2 min-h-[300px]">
            <ActivityFeed items={feedList} />
          </div>

          <div className="h-1/2 min-h-[300px]">
            {chartData.every(d => d.value === 0) ? (
              <div className="rounded-xl border bg-card text-card-foreground shadow h-full flex items-center justify-center p-6 text-center">
                <p className="text-muted-foreground">Não há dados suficientes para gerar o gráfico.</p>
              </div>
            ) : (
              <DashboardCharts data={chartData} />
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
