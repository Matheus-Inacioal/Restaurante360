'use client';

import { useState } from 'react';
import { MoreHorizontal, PlusCircle, Workflow } from 'lucide-react';
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
import type { Process } from '@/lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ProcessForm } from '@/components/manager/process-form';


export default function ProcessesPage() {
    const { firestore } = useFirebase();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    const processesColRef = useMemoFirebase(() =>
        firestore ? collection(firestore, 'processes') : null,
        [firestore]
    );

    const { data: processes, isLoading } = useCollection<Process>(processesColRef);

    const handleFormSuccess = () => {
        setIsSheetOpen(false);
    };

    const handleAddNew = () => {
        setIsSheetOpen(true);
    };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Processos Operacionais</h2>
          <p className="text-muted-foreground">
            Agrupe atividades em processos para otimizar os checklists.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Processo
        </Button>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="sm:max-w-2xl w-[95vw] overflow-y-auto">
              <SheetHeader>
              <SheetTitle className="font-headline text-2xl">Criar Novo Processo</SheetTitle>
              <SheetDescription>
                  Defina um nome para o processo e selecione as atividades que farão parte dele.
              </SheetDescription>
              </SheetHeader>
              <div className="mt-8">
                  <ProcessForm onSuccess={handleFormSuccess} />
              </div>
          </SheetContent>
      </Sheet>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Processo</TableHead>
                <TableHead>Nº de Atividades</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center">Carregando processos...</TableCell>
                  </TableRow>
              )}
              {processes && processes.map((process) => (
                <TableRow key={process.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Workflow className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p>{process.name}</p>
                        <p className="text-xs text-muted-foreground">{process.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-base">
                      {process.activityIds?.length || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={process.isActive ? 'default' : 'destructive'}
                     className={process.isActive ? 'bg-green-600' : ''}
                    >
                      {process.isActive ? 'Ativo' : 'Inativo'}
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Ver Atividades</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
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
