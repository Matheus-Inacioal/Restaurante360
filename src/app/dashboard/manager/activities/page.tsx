'use client';

import { useState } from 'react';
import { PlusCircle, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { OneOffTaskForm } from '@/components/manager/one-off-task-form';
import { EmptyState } from '@/components/empty-state';

export default function OneOffTasksPage() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleFormSuccess = () => {
        setIsSheetOpen(false);
    };
    
    const handleAddNew = () => {
        setIsSheetOpen(true);
    }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tarefas Pontuais</h2>
          <p className="text-muted-foreground">
            Crie e atribua tarefas imediatas para um colaborador específico.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Tarefa Pontual
        </Button>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="sm:max-w-2xl w-[95vw] overflow-y-auto">
              <SheetHeader>
              <SheetTitle className="font-headline text-2xl">Criar Tarefa Pontual</SheetTitle>
              <SheetDescription>
                  Preencha os detalhes para criar e atribuir uma nova tarefa.
              </SheetDescription>
              </SheetHeader>
              <div className="mt-8">
                  <OneOffTaskForm onSuccess={handleFormSuccess} />
              </div>
          </SheetContent>
      </Sheet>


      <Card>
        <CardHeader>
            <CardTitle>Histórico de Tarefas Pontuais</CardTitle>
            <CardDescription>Esta seção está em desenvolvimento. Em breve, você poderá ver um histórico das tarefas pontuais criadas.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
            <EmptyState
                icon={ListTodo}
                title="Nenhuma tarefa pontual criada ainda"
                description="Use o botão 'Nova Tarefa Pontual' para atribuir uma tarefa imediata."
            />
        </CardContent>
      </Card>
    </main>
  );
}
