'use client';

import { useState } from 'react';
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
import { Header } from '@/components/header';
import { mockChecklists, mockUsers } from '@/lib/data';
import type { TaskInstance } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const currentUser = mockUsers.find(u => u.role === 'collaborator')!;

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskInstance[]>(
    mockChecklists.flatMap(c => c.tasks)
  );
  const { toast } = useToast();
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskInstance | null>(null);

  const handleCompleteTask = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: 'done', completedAt: new Date().toISOString() } : task
      )
    );
    toast({
      title: "Tarefa concluída!",
      description: "Bom trabalho!",
    });
  };
  
  const handleOpenPhotoUpload = (task: TaskInstance) => {
    setSelectedTask(task);
    setIsPhotoUploadOpen(true);
  }

  const handlePhotoUpload = () => {
    if (selectedTask) {
        handleCompleteTask(selectedTask.id);
    }
    setIsPhotoUploadOpen(false);
    setSelectedTask(null);
    toast({
        title: "Foto enviada!",
        description: "A tarefa foi concluída com a evidência fotográfica."
    });
  }

  return (
    <div className="flex flex-col">
      <Header user={currentUser} title="Minhas Tarefas" />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Tarefas do Dia</CardTitle>
            <CardDescription>
              Complete suas tarefas para garantir a excelência operacional.
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
                {tasks.map((task) => (
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
                            <Button variant="default" size="sm" onClick={() => handleCompleteTask(task.id)}>
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
    </div>
  );
}
