'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { ActivityTemplate, Process, User, UserRole } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';


const formSchema = z.object({
  name: z.string().min(3, 'O nome da rotina deve ter pelo menos 3 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  activityIds: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Você precisa selecionar pelo menos uma tarefa.',
  }),
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

  const activitiesColRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/activityTemplates`);
  }, [user, firestore]);

  const usersColRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: activities, isLoading: isLoadingActivities } = useCollection<ActivityTemplate>(activitiesColRef);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersColRef);

  const form = useForm<ProcessFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      activityIds: [],
    },
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
      const processesCollection = collection(firestore, 'processes');
      const newProcessData = {
        ...values,
        isActive: true,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDocumentNonBlocking(processesCollection, newProcessData);

      toast({
        title: 'Rotina criada com sucesso!',
        description: `A rotina "${values.name}" foi salva. Agora atribua-a como um checklist.`,
      });
      
      setCreatedProcess({ id: docRef.id, ...values, isActive: true, createdBy: user.uid, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
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

    // 1. Get the full activity objects for the selected IDs
    const selectedActivities = activities?.filter(a => createdProcess.activityIds.includes(a.id)) || [];

    // 2. Transform activities into task instances
    const tasks = selectedActivities.map(activity => ({
        id: doc(collection(firestore, '_')).id,
        activityTemplateId: activity.id,
        title: activity.title,
        description: activity.description,
        requiresPhoto: activity.requiresPhoto,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }));

    // 3. Create the checklist instance
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
        <FormField
          control={form.control}
          name="activityIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Tarefas da Rotina</FormLabel>
                <FormDescription>
                  Selecione os modelos de tarefas que compõem esta rotina.
                </FormDescription>
              </div>
               <ScrollArea className="h-72 w-full rounded-md border">
                <div className="p-4">
              {isLoadingActivities && <p>Carregando modelos de tarefas...</p>}
              {activities?.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="activityIds"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0 py-2"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item.id
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.title}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              </div>
              </ScrollArea>
              <FormMessage />
            </FormItem>
          )}
        />

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
