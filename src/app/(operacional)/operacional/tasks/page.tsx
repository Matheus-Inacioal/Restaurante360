'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Camera, CheckCircle2, Circle, Clock, Paperclip, Upload, Video, X, CameraIcon } from 'lucide-react';
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
import { collection, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

interface EnrichedTask extends TaskInstance {
    checklistId: string;
}

export default function TasksPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Flat map and sort: pending tasks first, then by title
      return checklists
        .flatMap(checklist => 
            (checklist.tasks || []).map(task => ({
                ...task,
                checklistId: checklist.id,
            }))
        )
        .sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            return a.title.localeCompare(b.title);
        });
  }, [checklists]);
  
  // Effect to handle camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const getCameraPermission = async () => {
      if (!isPhotoUploadOpen) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acesso à Câmera Negado',
          description: 'Por favor, habilite a permissão de câmera no seu navegador.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isPhotoUploadOpen, toast]);


  const handleCompleteTask = async (task: EnrichedTask, photoUrls: string[] = []) => {
    if (!firestore || !user || !checklists) return;

    const checklist = checklists.find(c => c.id === task.checklistId);
    if (!checklist) return;
    
    const checklistRef = doc(firestore, 'checklists', task.checklistId);

    try {
        const updatedTasks = (checklist.tasks || []).map(t => {
            if (t.id === task.id) {
                return {
                    ...t,
                    status: 'done' as const,
                    completedAt: new Date().toISOString(),
                    completedBy: user.uid,
                    photoUrls: photoUrls,
                };
            }
            return t;
        });

        const updatePayload: any = { tasks: updatedTasks };
        
        const allTasksCompleted = updatedTasks.every(t => t.status === 'done');
        if (allTasksCompleted) {
            updatePayload.status = 'completed';
        } else if(updatedTasks.some(t => t.status === 'done')){
            updatePayload.status = 'in_progress';
        }

        await updateDoc(checklistRef, updatePayload);

        toast({
            title: "Tarefa concluída!",
            description: allTasksCompleted ? "Checklist finalizado! Parabéns!" : "Bom trabalho, continue assim!",
        });
    } catch (error) {
        console.error("Error completing task: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao concluir tarefa",
            description: "Não foi possível salvar a alteração. Tente novamente."
        });
    }
  };
  
  const handleOpenPhotoUpload = (task: EnrichedTask) => {
    setSelectedTask(task);
    setAttachedImages([]);
    setIsPhotoUploadOpen(true);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        const files = Array.from(event.target.files);
        const dataUrls = files.map(file => URL.createObjectURL(file));
        setAttachedImages(prev => [...prev, ...dataUrls]);
    }
  };

  const handleCaptureImage = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        setAttachedImages(prev => [...prev, dataUrl]);
    }
  }

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  }

  const handlePhotoUploadAndComplete = () => {
    if (selectedTask) {
        // In a real app, you would upload `attachedImages` to Firebase Storage
        // and get back an array of URLs to pass to handleCompleteTask.
        // For this mock, we just pass the local blob/data URLs.
        handleCompleteTask(selectedTask, attachedImages);
    }
    setIsPhotoUploadOpen(false);
    setSelectedTask(null);
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
          <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                  <DialogTitle>Anexar Evidência(s)</DialogTitle>
                  <DialogDescription>
                      Para a tarefa "{selectedTask?.title}", anexe uma ou mais fotos ou tire uma na hora.
                  </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="upload">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4" />Anexar Arquivo</TabsTrigger>
                      <TabsTrigger value="camera"><Video className="mr-2 h-4 w-4" />Tirar Foto</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="py-4">
                      <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="picture">Fotos</Label>
                          <Input id="picture" type="file" accept="image/*" multiple onChange={handleFileChange} ref={fileInputRef} />
                          <p className="text-sm text-muted-foreground">Você pode selecionar múltiplos arquivos.</p>
                      </div>
                  </TabsContent>
                  <TabsContent value="camera" className="py-4">
                      <div className="relative aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                          {hasCameraPermission === false && <p className="text-destructive-foreground">Câmera indisponível</p>}
                          <canvas ref={canvasRef} className="hidden" />
                      </div>
                      <Button onClick={handleCaptureImage} disabled={!hasCameraPermission} className="w-full mt-2">
                          <CameraIcon className="mr-2 h-4 w-4" /> Capturar Foto
                      </Button>
                  </TabsContent>
              </Tabs>
              
              {attachedImages.length > 0 && (
                  <div>
                      <h4 className="font-medium mb-2">Imagens Anexadas:</h4>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {attachedImages.map((imgSrc, index) => (
                              <div key={index} className="relative aspect-square">
                                  <Image src={imgSrc} alt={`Evidência ${index + 1}`} fill style={{ objectFit: 'cover' }} className="rounded-md" />
                                  <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 z-10" onClick={() => removeImage(index)}>
                                      <X className="h-4 w-4" />
                                  </Button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsPhotoUploadOpen(false)}>Cancelar</Button>
                  <Button type="submit" onClick={handlePhotoUploadAndComplete} disabled={attachedImages.length === 0}>
                      <Paperclip className="mr-2 h-4 w-4" />
                      Enviar e Concluir
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </main>
  );
}

    