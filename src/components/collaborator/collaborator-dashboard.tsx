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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockChecklists } from '@/lib/data';
import Link from 'next/link';

const collaboratorTasks = mockChecklists.flatMap(c => c.tasks.map(t => ({...t, checklist: c})))
    .filter(t => t.checklist.assignedTo.includes('Carlos') || t.checklist.assignedTo.includes('Beatriz'))
    .slice(0, 4);

export function CollaboratorDashboard() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const { toast } = useToast();

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    toast({
      title: 'Check-in realizado!',
      description: 'Seu turno foi iniciado com sucesso. Bom trabalho!',
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
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
          <Button className="w-full" onClick={handleCheckIn} disabled={isCheckedIn}>
            <LogIn className="mr-2 h-4 w-4" />
            {isCheckedIn ? 'Check-in Feito' : 'Fazer Check-in'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <div className='flex justify-between items-center'>
            <div>
                <CardTitle>Minhas Tarefas de Hoje</CardTitle>
                <CardDescription>Aqui estão as suas tarefas pendentes para o turno.</CardDescription>
            </div>
            <Button asChild variant="outline">
                <Link href="/dashboard/collaborator/tasks">Ver Todas</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[50px]'></TableHead>
                <TableHead>Tarefa</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaboratorTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    {task.status === 'done' ? (
                       <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                       <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground hidden md:inline">{task.checklist.processName}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {task.status === 'done' ? (
                      <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(task.checklist.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ) : (
                       <Button variant="ghost" size="sm">Concluir</Button>
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
