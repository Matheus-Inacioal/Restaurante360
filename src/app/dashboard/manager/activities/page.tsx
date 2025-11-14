'use client';

import { useState } from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Header } from '@/components/header';
import { mockActivityTemplates, mockUsers } from '@/lib/data';
import type { ActivityTemplate } from '@/lib/types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ActivityForm } from '@/components/manager/activity-form';

const currentUser = mockUsers.find(u => u.role === 'manager')!;

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<ActivityTemplate[]>(mockActivityTemplates);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<ActivityTemplate | undefined>(undefined);

    const handleFormSuccess = () => {
        // Here you would refetch the data from the server
        // For now, we'll just close the sheet
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
    <div className="flex flex-col">
      <Header user={currentUser} title="Gestão de Atividades" />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Modelos de Atividade</h2>
            <p className="text-muted-foreground">
              Crie e gerencie os blocos de construção dos seus checklists.
            </p>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Atividade
          </Button>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto">
                <SheetHeader>
                <SheetTitle className="font-headline text-2xl">{selectedActivity ? 'Editar Atividade' : 'Criar Nova Atividade'}</SheetTitle>
                <SheetDescription>
                    {selectedActivity ? 'Altere os detalhes desta atividade.' : 'Preencha os detalhes para criar uma nova atividade para seus checklists.'}
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
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Exige Foto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.category}</Badge>
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
                          <DropdownMenuItem onSelect={() => handleEdit(activity)}>Editar</DropdownMenuItem>
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
    </div>
  );
}
