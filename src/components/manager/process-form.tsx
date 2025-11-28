'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { ActivityTemplate, Process, User, UserRole } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Switch } from '../ui/switch';


const taskSchema = z.object({
    title: z.string().min(3, "O título da tarefa deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    requiresPhoto: z.boolean(),
});

const formSchema = z.object({
  name: z.string().min(3, 'O nome da rotina deve ter pelo menos 3 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  tasks: z.array(taskSchema).min(1, 'Você precisa adicionar pelo menos uma tarefa à rotina.'),
});

type ProcessFormValues = z.infer<typeof formSchema>;

interface ProcessFormProps {
  onSuccess: () => void;
}

export function ProcessForm({ onSuccess }: ProcessFormProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [createdProcess, setCreatedProcess] = useState<Process | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // State for the assignment dialog
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [shift, setShift] = useState<'Manhã' | 'Tarde' | 'Noite'>('Manhã');
  const [date, setDate] = useState<Date | undefined>(new Date());

  const usersColRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersColRef);

  const form = useForm<ProcessFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      tasks: [{ title: '', description: '', requiresPhoto: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks"
  });


  async function onSubmit(values: ProcessFormValues) {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Não foi possível salvar a rotina.',
      });
      return;
    }

    try {
      const batch = writeBatch(firestore);
      const activityTemplateCollection = collection(firestore, `users/${user.uid}/activityTemplates`);
      
      const activityIds: string[] = [];
      const createdActivities: ActivityTemplate[] = [];

      // Create activity templates for each task
      for (const task of values.tasks) {
        const activityRef = doc(activityTemplateCollection);
        const newActivity: Omit<ActivityTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
            title: task.title,
            description: task.description || '',
            category: 'Outro',
            frequency: 'on-demand',
            isRecurring: true,
            requiresPhoto: task.requiresPhoto,
            status: 'active',
            createdBy: user.uid,
        };
        batch.set(activityRef, {
            ...newActivity,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        activityIds.push(activityRef.id);
        createdActivities.push({ ...newActivity, id: activityRef.id, createdAt: '', updatedAt: '' });
      }

      const processCollection = collection(firestore, 'processes');
      const processRef = doc(processCollection);
      const newProcessData = {
        name: values.name,
        description: values.description,
        activityIds,
        isActive: true,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(processRef, newProcessData);

      await batch.commit();

      toast({
        title: 'Rotina criada com sucesso!',
        description: `A rotina "${values.name}" foi salva. Agora atribua-a como um checklist.`,
      });
      
      const finalProcess: Process = { 
        id: processRef.id, 
        name: values.name,
        description: values.description,
        activityIds,
        isActive: true, 
        createdBy: user.uid, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };
      
      sessionStorage.setItem('createdActivities', JSON.stringify(createdActivities));
      setCreatedProcess(finalProcess);
      setIsAssignDialogOpen(true); // Open the assignment dialog
      form.reset();

    } catch (error) {
      console.error('Error saving process: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao salvar a rotina.',
      });
    }
  }

  const handleAssignChecklist = async () => {
    if (!firestore || !user || !createdProcess || !assignedTo || !date) {
        toast({ title: "Erro", description: "Por favor, preencha todos os campos para atribuir o checklist.", variant: "destructive" });
        return;
    }
    
    const createdActivitiesStr = sessionStorage.getItem('createdActivities');
    const activitiesToUse: ActivityTemplate[] = createdActivitiesStr ? JSON.parse(createdActivitiesStr) : [];
    
    if (activitiesToUse.length === 0) {
        toast({ title: "Erro", description: "Não foi possível encontrar as tarefas da rotina.", variant: "destructive" });
        return;
    }

    const tasks = activitiesToUse.map(activity => ({
        id: doc(collection(firestore, '_')).id,
        activityTemplateId: activity.id,
        title: activity.title,
        description: activity.description,
        requiresPhoto: activity.requiresPhoto,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }));

    const checklistData = {
        date: format(date, 'yyyy-MM-dd'),
        shift,
        assignedTo,
        processName: createdProcess.name,
        processId: createdProcess.id,
        status: 'open' as const,
        tasks: tasks,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
        await addDocumentNonBlocking(collection(firestore, 'checklists'), checklistData);
        toast({
            title: "Checklist Atribuído!",
            description: `A rotina "${createdProcess.name}" foi atribuída com sucesso.`
        });
        setIsAssignDialogOpen(false);
        setCreatedProcess(null);
        sessionStorage.removeItem('createdActivities');
        onSuccess();
    } catch (error) {
        console.error("Error assigning checklist: ", error);
        toast({ title: "Erro ao Atribuir", description: "Não foi possível criar o checklist.", variant: "destructive" });
    }
  };

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Rotina</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Rotina de Abertura da Cozinha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o objetivo desta rotina."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
            <FormLabel>Tarefas da Rotina</FormLabel>
            <FormDescription>Adicione as tarefas que fazem parte desta rotina.</FormDescription>
            <div className="space-y-4 mt-4">
                {fields.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-lg space-y-4 relative">
                        <FormField
                            control={form.control}
                            name={`tasks.${index}.title`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Título da Tarefa {index + 1}</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Verificar temperatura das geladeiras" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`tasks.${index}.description`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Descrição (Opcional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Detalhes sobre a tarefa..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`tasks.${index}.requiresPhoto`}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel>Exige foto como evidência</FormLabel>
                                </FormItem>
                            )}
                        />

                        {fields.length > 1 && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ title: '', description: '', requiresPhoto: false })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Tarefa
                </Button>
                <FormMessage>{form.formState.errors.tasks?.message}</FormMessage>
            </div>
        </div>


        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : 'Criar Rotina e Atribuir'}
          </Button>
        </div>
      </form>
    </Form>

    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Atribuir Checklist de Rotina</DialogTitle>
                <DialogDescription>
                    A rotina "{createdProcess?.name}" foi criada. Agora atribua-a como um checklist para um colaborador.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="assign-user">Colaborador</Label>
                    <Select onValueChange={setAssignedTo} value={assignedTo}>
                        <SelectTrigger id="assign-user">
                            <SelectValue placeholder="Selecione um colaborador" />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoadingUsers && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
                            {users?.filter(u => u.role !== 'gestor').map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="assign-shift">Turno</Label>
                    <Select onValueChange={(v) => setShift(v as 'Manhã' | 'Tarde' | 'Noite')} value={shift}>
                        <SelectTrigger id="assign-shift">
                            <SelectValue placeholder="Selecione o turno" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Manhã">Manhã</SelectItem>
                            <SelectItem value="Tarde">Tarde</SelectItem>
                            <SelectItem value="Noite">Noite</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Data</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Escolha uma data</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAssignDialogOpen(false); onSuccess(); }}>Pular</Button>
                <Button onClick={handleAssignChecklist}>Atribuir Checklist</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
