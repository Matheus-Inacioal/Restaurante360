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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { ActivityTemplate, User, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  // Section for the task details
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  requiresPhoto: z.boolean(),
  // Section for assignment
  assignedTo: z.string().min(1, "Você deve atribuir a tarefa a um colaborador."),
  date: z.date({ required_error: "A data é obrigatória." }),
  shift: z.enum(['Manhã', 'Tarde', 'Noite']),
});

type ActivityFormValues = z.infer<typeof formSchema>;

interface ActivityFormProps {
  activity?: ActivityTemplate; // This can be used to pre-fill if editing a template to create a one-off task
  onSuccess: () => void;
}

export function ActivityForm({ activity, onSuccess }: ActivityFormProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const usersColRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersColRef);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: activity?.title || '',
      description: activity?.description || '',
      requiresPhoto: activity?.requiresPhoto || false,
      assignedTo: '',
      date: new Date(),
      shift: 'Manhã',
    },
  });

  async function onSubmit(values: ActivityFormValues) {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Erro de autenticação",
            description: "Não foi possível salvar a tarefa."
        });
        return;
    }
    
    try {
        // Create a single-task checklist
        const taskData = {
            id: doc(collection(firestore, '_')).id,
            activityTemplateId: 'one-off', // Indicates it's not from a template
            title: values.title,
            description: values.description,
            requiresPhoto: values.requiresPhoto,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const checklistData = {
            date: format(values.date, 'yyyy-MM-dd'),
            shift: values.shift,
            assignedTo: values.assignedTo,
            processName: `Tarefa Avulsa: ${values.title}`,
            status: 'open' as const,
            tasks: [taskData],
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await addDocumentNonBlocking(collection(firestore, 'checklists'), checklistData);

        toast({
            title: `Tarefa atribuída!`,
            description: `A tarefa "${values.title}" foi enviada para o colaborador.`,
        });
        onSuccess();
    } catch (error) {
        console.error("Error saving one-off task: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao salvar",
            description: "Ocorreu um problema ao criar e atribuir a tarefa."
        })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Detalhes da Tarefa</h3>
            <div className="space-y-4">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Título da Tarefa</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Comprar mais sacos de lixo" {...field} />
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
                        placeholder="Descreva em detalhes o que precisa ser feito."
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="requiresPhoto"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Exigir Foto como Evidência</FormLabel>
                        <FormDescription>
                        O colaborador deverá anexar uma foto para concluir.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    </FormItem>
                )}
                />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Atribuição</h3>
            <div className="space-y-4">
                 <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Atribuir para</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um colaborador" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {isLoadingUsers && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
                                {users?.filter(u => u.role !== 'gestor').map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Data de Entrega</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Escolha uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="shift"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Turno</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o turno" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Manhã">Manhã</SelectItem>
                                    <SelectItem value="Tarde">Tarde</SelectItem>
                                    <SelectItem value="Noite">Noite</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
            </div>
        </div>

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Atribuindo...' : 'Criar e Atribuir Tarefa'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
