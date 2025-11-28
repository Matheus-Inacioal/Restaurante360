'use client';

import { useState } from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
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
import type { ActivityTemplate, UserRole } from '@/lib/types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ActivityForm } from '@/components/manager/activity-form';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

const roleLabels: Record<UserRole, string> = {
    manager: 'Gestor',
    collaborator: 'Colaborador',
    gestor: 'Gestor',
    bar: 'Bar',
    pia: 'Pia',
    cozinha: 'Cozinha',
    producao: 'Produção',
    garcon: 'Garçom',
};

export default function OneOffTasksPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<ActivityTemplate | undefined>(undefined);

    const activitiesColRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/activityTemplates`);
    }, [user, firestore]);

    const { data: activities, isLoading } = useCollection<ActivityTemplate>(activitiesColRef);

    const handleFormSuccess = () => {
        setIsSheetOpen(false);
        setSelectedActivity(undefined);
    };

    const handleEdit = (activity: ActivityTemplate) => {
        setSelectedActivity(activity);
        setIsSheetOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedActivity(undefined);
        setIsSheetOpen(true);
    }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tarefas Pontuais</h2>
          <p className="text-muted-foreground">
            Crie e gerencie os modelos de tarefas que podem ser usados em rotinas.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Modelo de Tarefa
        </Button>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="sm:max-w-2xl w-[95vw] overflow-y-auto">
              <SheetHeader>
              <SheetTitle className="font-headline text-2xl">{selectedActivity ? 'Editar Modelo de Tarefa' : 'Criar Novo Modelo de Tarefa'}</SheetTitle>
              <SheetDescription>
                  {selectedActivity ? 'Altere os detalhes deste modelo.' : 'Preencha os detalhes para criar um novo modelo de tarefa reutilizável.'}
              </SheetDescription>
              </SheetHeader>
              <div className="mt-8">
                  <ActivityForm activity={selectedActivity} onSuccess={handleFormSuccess} />
              </div>
          </SheetContent>
      </Sheet>


      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título (Modelos)</TableHead>
                <TableHead>Função Atribuída</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Exige Foto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                  <TableRow>
                      <TableCell colSpan={6} className="text-center">Carregando modelos de tarefas...</TableCell>
                  </TableRow>
              )}
              {activities && activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.title}</TableCell>
                  <TableCell>
                    {activity.assignedRole ? (
                      <Badge variant="secondary">{roleLabels[activity.assignedRole] || activity.assignedRole}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{activity.frequency}</TableCell>
                  <TableCell>{activity.requiresPhoto ? 'Sim' : 'Não'}</TableCell>
                  <TableCell>
                    <Badge variant={activity.status === 'active' ? 'default' : 'destructive'}
                     className={activity.status === 'active' ? 'bg-green-600' : ''}
                    >
                      {activity.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
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
                        <DropdownMenuItem onSelect={() => handleEdit(activity)}>Editar Modelo</DropdownMenuItem>
                        <DropdownMenuItem>Inativar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
