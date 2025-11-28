'use client';

import { useState } from 'react';
import { MoreHorizontal, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ChecklistInstance } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

const getStatusVariant = (status: ChecklistInstance['status']) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'open':
      return 'outline';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status: ChecklistInstance['status']) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'in_progress':
        return 'Em Progresso';
      case 'open':
        return 'Pendente';
    }
}

const getProgress = (checklist: ChecklistInstance) => {
    if (!checklist.tasks || checklist.tasks.length === 0) return 0;
    const totalTasks = checklist.tasks.length;
    const completedTasks = checklist.tasks.filter(t => t.status === 'done').length;
    return (completedTasks / totalTasks) * 100;
}

export default function ChecklistsPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState('all');

    const checklistsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;

        const baseQuery = collection(firestore, 'checklists');
        let finalQuery;

        if (activeTab === 'all') {
            finalQuery = query(baseQuery, where('createdBy', '==', user.uid));
        } else {
            finalQuery = query(baseQuery, where('createdBy', '==', user.uid), where('status', '==', activeTab));
        }
        return finalQuery;

    }, [firestore, user, activeTab]);

    const { data: checklists, isLoading } = useCollection<ChecklistInstance>(checklistsQuery);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="open">Pendentes</TabsTrigger>
            <TabsTrigger value="in_progress">Em Progresso</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filtro
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked>
                  Turno: Manhã
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Turno: Tarde</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Turno: Noite</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[40%]'>Processo / Checklist</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                      <TableRow>
                          <TableCell colSpan={6} className="text-center">Carregando checklists...</TableCell>
                      </TableRow>
                  )}
                  {checklists && checklists.map((checklist) => (
                    <TableRow key={checklist.id}>
                      <TableCell className="font-medium">
                          {checklist.processName || `Checklist Avulso`}
                      </TableCell>
                      <TableCell>{checklist.assignedTo}</TableCell>
                      <TableCell>{checklist.shift}</TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                              <Progress value={getProgress(checklist)} className="h-2 w-24" />
                              <span className="text-xs text-muted-foreground">{Math.round(getProgress(checklist))}%</span>
                          </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(checklist.status)}
                         className={checklist.status === 'completed' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                        >{getStatusLabel(checklist.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Enviar Feedback</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
