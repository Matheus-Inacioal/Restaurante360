'use client';

import { useState } from 'react';
import { MoreHorizontal, PlusCircle, Workflow, Trash2 } from 'lucide-react';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Badge } from '@/components/ui/badge';
import type { Process } from '@/lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ProcessForm } from '@/components/manager/process-form';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';


export default function RoutinesPage() {
    const { firestore } = useFirebase();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [processToDelete, setProcessToDelete] = useState<Process | null>(null);
    const { toast } = useToast();
    
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

    const openDeleteDialog = (process: Process) => {
        setProcessToDelete(process);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteProcess = () => {
        if (!firestore || !processToDelete) return;
        
        const processRef = doc(firestore, 'processes', processToDelete.id);
        deleteDocumentNonBlocking(processRef);

        toast({
            title: "Rotina Excluída",
            description: `A rotina "${processToDelete.name}" foi excluída com sucesso.`,
        });

        setIsDeleteDialogOpen(false);
        setProcessToDelete(null);
    };

    const handleToggleActive = (process: Process) => {
        if (!firestore) return;
        const processRef = doc(firestore, 'processes', process.id);
        updateDocumentNonBlocking(processRef, { isActive: !process.isActive });
        toast({
            title: "Status da Rotina Alterado",
            description: `A rotina "${process.name}" foi ${!process.isActive ? 'ativada' : 'inativada'}.`
        })
    }


  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rotinas Operacionais</h2>
          <p className="text-muted-foreground">
            Agrupe atividades em rotinas para otimizar os checklists recorrentes.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Rotina
        </Button>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="sm:max-w-2xl w-[95vw] overflow-y-auto">
              <SheetHeader>
              <SheetTitle className="font-headline text-2xl">Criar Nova Rotina</SheetTitle>
              <SheetDescription>
                  Defina um nome para a rotina e selecione as tarefas que farão parte dela.
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
                <TableHead>Nome da Rotina</TableHead>
                <TableHead>Nº de Tarefas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center">Carregando rotinas...</TableCell>
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
                    <div className="flex items-center space-x-2">
                        <Switch
                            id={`status-switch-${process.id}`}
                            checked={process.isActive}
                            onCheckedChange={() => handleToggleActive(process)}
                            aria-label={`Ativar ou inativar rotina ${process.name}`}
                        />
                        <label htmlFor={`status-switch-${process.id}`} className="text-sm text-muted-foreground">
                            {process.isActive ? 'Ativa' : 'Inativa'}
                        </label>
                    </div>
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
                        <DropdownMenuItem>Ver Tarefas</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => openDeleteDialog(process)}>
                           <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso excluirá permanentemente a rotina 
                <span className="font-bold"> {processToDelete?.name}</span> e seus dados associados.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteProcess}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Sim, excluir rotina
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </main>
  );
}
