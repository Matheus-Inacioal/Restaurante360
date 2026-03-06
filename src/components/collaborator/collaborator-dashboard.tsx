'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { usePerfil } from '@/hooks/use-perfil';
import { useTarefas } from '@/hooks/use-tarefas';
import { Skeleton } from '@/components/ui/skeleton';

export function CollaboratorDashboard() {
  const { perfilUsuario } = usePerfil();
  const { tarefas, isCarregando: isLoadingTarefas } = useTarefas();

  // Mock de Check-in (para não criar infra de ponto só no MVP de UI, mantemos no Client State local)
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const { toast } = useToast();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const collaboratorTasks = useMemo(() => {
    if (!tarefas || !perfilUsuario) return [];

    // Filtra tarefas designadas ao usuário logado E que sejam para hoje
    return tarefas
      .filter((t) => t.responsavel === perfilUsuario.uid)
      .filter((t) => t.origem?.dataReferencia === todayStr || t.prazo?.startsWith(todayStr))
      .slice(0, 5); // MVP limite
  }, [tarefas, perfilUsuario, todayStr]);

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    toast({
      title: 'Check-in realizado!',
      description: 'Seu turno foi iniciado com sucesso. Bom trabalho!',
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      {/* CARD 1: CHECK IN */}
      <Card className="lg:col-span-1 border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Bem-vindo(a)!</CardTitle>
          <CardDescription>Pronto para começar o seu turno?</CardDescription>
        </CardHeader>
        <CardContent>
          {isCheckedIn ? (
            <div className="flex items-center justify-center p-6 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400 mr-4" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">Check-in realizado</p>
                <p className="text-sm text-green-600 dark:text-green-400">Turno iniciado às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Clique no botão abaixo para registrar o início do seu trabalho.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleCheckIn} disabled={isCheckedIn || !perfilUsuario}>
            <LogIn className="mr-2 h-4 w-4" />
            {isCheckedIn ? 'Check-in Feito' : 'Fazer Check-in'}
          </Button>
        </CardFooter>
      </Card>

      {/* CARD 2: TAREFAS */}
      <Card className="lg:col-span-2 shadow-sm border-0 bg-background/50">
        <CardHeader>
          <div className='flex justify-between items-center'>
            <div>
              <CardTitle>Minhas Tarefas de Hoje</CardTitle>
              <CardDescription>Aqui estão as suas tarefas pendentes para o turno.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/operacional/tarefas">Ver Todas</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[50px]'>Status</TableHead>
                <TableHead>Tarefa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTarefas && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    <div className="flex flex-col gap-2 p-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoadingTarefas && collaboratorTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24 text-muted-foreground border-dashed border-2 m-4 rounded-xl">
                    Você não tem tarefas atribuídas para hoje. 🎉
                  </TableCell>
                </TableRow>
              )}
              {!isLoadingTarefas && collaboratorTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    {task.status === 'concluida' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : task.status === 'atrasada' ? (
                      <Circle className="h-5 w-5 text-red-500 fill-red-100 dark:fill-red-900/30" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{task.titulo}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{task.descricao || 'Sem descrição.'}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {task.status === 'concluida' && task.atualizadoEm ? (
                      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(task.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ) : (
                      <Button asChild variant="secondary" size="sm" className="h-7 text-xs">
                        <Link href="/operacional/tarefas">Executar</Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
