'use client';

import { useState, useEffect, useMemo } from 'react';
import { Camera, CheckCircle2, Circle, Clock, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TaskInstance, ChecklistInstance } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';

interface EnrichedTask extends TaskInstance {
    checklistId: string;
}

export default function TasksPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);

  const checklistsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return query(
      collection(firestore, 'checklists'), 
      where('assignedTo', '==', user.uid),
      where('date', '==', todayStr)
    );
  }, [firestore, user]);

  const { data: checklists, isLoading: isLoadingChecklists } = useCollection<ChecklistInstance>(checklistsQuery);
  
  const allTasks: EnrichedTask[] = useMemo(() => {
    if (!checklists) return [];
    return checklists.flatMap(checklist => 
      (checklist.tasks || []).map(task => ({
        ...task,
        checklistId: checklist.id,
      }))
    );
  }, [checklists]);

  const handleCompleteTask = (task: EnrichedTask) => {
    if (!firestore || !checklists || !user) return;

    const checklist = checklists.find(c => c.id === task.checklistId);
    if (!checklist) return;
    
    // Find the index of the task to update within the checklist's tasks array
    const taskIndex = checklist.tasks?.findIndex(t => t.id === task.id);
    if (taskIndex === undefined || taskIndex === -1) return;

    // Create a deep copy of the tasks array to avoid direct mutation
    const updatedTasks = JSON.parse(JSON.stringify(checklist.tasks));

    // Update the specific task
    updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        status: 'done' as const,
        completedAt: new Date().toISOString(),
        completedBy: user.uid
    };
    
    const checklistRef = doc(firestore, `checklists/${task.checklistId}`);
    updateDocumentNonBlocking(checklistRef, { tasks: updatedTasks });

    toast({
      title: "Tarefa concluída!",
      description: "Bom trabalho!",
    });
  };
  
  const handleOpenPhotoUpload = (task: EnrichedTask) => {
    setSelectedTask(task);
    setIsPhotoUploadOpen(true);
  }

  const handlePhotoUpload = () => {
    if (selectedTask) {
        // Here you would handle the actual photo upload to Firebase Storage
        // and get the URL. For now, we'll just mark the task as complete.
        handleCompleteTask(selectedTask);
    }
    setIsPhotoUploadOpen(false);
    setSelectedTask(null);
    toast({
        title: "Foto enviada!",
        description: "A tarefa foi concluída com a evidência fotográfica."
    });
  }

  const isLoading = isLoadingChecklists;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Tarefas do Dia</CardTitle>
          <CardDescription>
            Complete suas tarefas de rotina e pontuais para garantir a excelência operacional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'></TableHead>
                <TableHead>Tarefa</TableHead>
                <TableHead className='hidden md:table-cell'>Descrição</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center">Carregando tarefas...</TableCell>
                  </TableRow>
              )}
              {!isLoading && allTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">Você não tem tarefas para hoje.</TableCell>
                </TableRow>
              )}
              {allTasks.map((task) => (
                <TableRow key={task.id} className={task.status === 'done' ? 'bg-muted/50' : ''}>
                  <TableCell>
                    {task.status === 'done' ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell className='hidden md:table-cell text-muted-foreground'>{task.description}</TableCell>
                  <TableCell className="text-right">
                    {task.status === 'done' ? (
                      <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{task.completedAt ? new Date(task.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                    ) : (
                      task.requiresPhoto ? (
                          <Button variant="outline" size="sm" onClick={() => handleOpenPhotoUpload(task)}>
                              <Camera className="mr-2 h-4 w-4" />
                              Anexar Foto
                          </Button>
                      ) : (
                          <Button variant="default" size="sm" onClick={() => handleCompleteTask(task)}>
                              Concluir
                          </Button>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isPhotoUploadOpen} onOpenChange={setIsPhotoUploadOpen}>
          <DialogContent>
              <DialogHeader>
              <DialogTitle>Anexar Foto de Evidência</DialogTitle>
              <DialogDescription>
                  Para a tarefa "{selectedTask?.title}", é necessário uma foto para concluir.
              </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="picture">Foto</Label>
                      <Input id="picture" type="file" accept="image/*" />
                  </div>
              </div>
              <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPhotoUploadOpen(false)}>Cancelar</Button>
              <Button type="submit" onClick={handlePhotoUpload}>
                  <Paperclip className="mr-2 h-4 w-4" />
                  Enviar e Concluir
              </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </main>
  );
}
