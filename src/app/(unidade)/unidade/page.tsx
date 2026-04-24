'use client';

/**
 * Dashboard da Unidade — gestorLocal
 *
 * Estados: Carregando → Erro → Vazio → Sucesso
 */
import { usePerfil } from '@/hooks/use-perfil';
import { useUnidades } from '@/hooks/use-unidades';
import { Loader2, MapPin, ClipboardCheck, CalendarClock, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UnidadeDashboard() {
  const { perfilUsuario, carregandoPerfil } = usePerfil();

  if (carregandoPerfil) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const nomeUnidade = (perfilUsuario as any)?.unidade?.nome ?? 'sua unidade';

  return (
    <div className="flex flex-col gap-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <MapPin className="h-4 w-4" />
          <span>{nomeUnidade}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {perfilUsuario?.nome?.split(' ')[0] ?? 'Gestor'} 👋
        </h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe as operações da sua unidade em tempo real.
        </p>
      </div>

      {/* Cards de ação rápida */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/unidade/tarefas">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Tarefas</CardTitle>
                <CardDescription>Acompanhe e crie tarefas da unidade</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/unidade/rotinas">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <CalendarClock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-base">Rotinas</CardTitle>
                <CardDescription>Gerencie as rotinas diárias</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/unidade/equipe">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-base">Equipe</CardTitle>
                <CardDescription>Colaboradores desta unidade</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Aviso de módulos em construção */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="flex flex-row items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <CardTitle className="text-sm text-amber-700 dark:text-amber-400">
              Portal em configuração
            </CardTitle>
            <CardDescription className="text-xs text-amber-600/80 dark:text-amber-500/80">
              Os módulos de tarefas, rotinas e relatórios estão sendo migrados para o novo banco de dados. Em breve disponíveis.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
