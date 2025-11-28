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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { User, UserRole } from '@/lib/types';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';


const formSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
  assignedTo: z.string().min(1, 'Você deve selecionar um colaborador.'),
  shift: z.enum(['Manhã', 'Tarde', 'Noite']),
  date: z.date(),
  requiresPhoto: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface OneOffTaskFormProps {
  onSuccess: () => void;
}

export function OneOffTaskForm({ onSuccess }: OneOffTaskFormProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const usersColRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersColRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      requiresPhoto: false,
      shift: 'Manhã',
      date: new Date(),
    },
  });

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Não foi possível salvar a tarefa.',
      });
      return;
    }

    try {
        const singleTask = {
            id: doc(collection(firestore, '_')).id, // Generate a random ID
            activityTemplateId: 'one-off', // Mark as a one-off task
            title: values.title,
            description: values.description || '',
            requiresPhoto: values.requiresPhoto,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        const checklistData = {
            date: format(values.date, 'yyyy-MM-dd'),
            shift: values.shift,
            assignedTo: values.assignedTo,
            processName: `Tarefa Pontual: ${values.title}`,
            status: 'open' as const,
            tasks: [singleTask],
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await addDocumentNonBlocking(collection(firestore, 'checklists'), checklistData);

        toast({
            title: 'Tarefa Pontual Atribuída!',
            description: 'A tarefa já está visível para o colaborador.',
        });
      onSuccess();
    } catch (error) {
      console.error('Error saving one-off task: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao criar a tarefa pontual.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Tarefa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Comprar mais guardanapos" {...field} />
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
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Se necessário, adicione mais detalhes sobre a tarefa."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Atribuir Para</FormLabel>
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

         <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Data de Execução</FormLabel>
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
                            disabled={(date) =>
                                date < new Date(new Date().setDate(new Date().getDate() - 1))
                            }
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
            name="requiresPhoto"
            render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                    <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                    <FormLabel>
                        Exigir foto como evidência
                    </FormLabel>
                    <FormDescription>
                        O colaborador precisará anexar uma foto para concluir esta tarefa.
                    </FormDescription>
                    </div>
                </FormItem>
            )}
        />

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Atribuindo...' : 'Atribuir Tarefa'}
            </Button>
        </div>

      </form>
    </Form>
  );
}
