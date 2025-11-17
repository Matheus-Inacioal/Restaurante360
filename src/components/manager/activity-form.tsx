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
import type { ActivityTemplate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const formSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  category: z.enum(['Higiene', 'Cozinha', 'Atendimento', 'Segurança', 'Outro']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'on-demand']),
  isRecurring: z.boolean(),
  requiresPhoto: z.boolean(),
  status: z.enum(['active', 'inactive']),
});

type ActivityFormValues = z.infer<typeof formSchema>;

interface ActivityFormProps {
  activity?: ActivityTemplate;
  onSuccess: () => void;
}

export function ActivityForm({ activity, onSuccess }: ActivityFormProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: activity ? {
        ...activity,
        status: activity.status || 'active',
    } : {
      title: '',
      description: '',
      category: 'Cozinha',
      frequency: 'daily',
      isRecurring: true,
      requiresPhoto: false,
      status: 'active',
    },
  });

  async function onSubmit(values: ActivityFormValues) {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Erro de autenticação",
            description: "Não foi possível salvar a atividade."
        });
        return;
    }
    
    try {
        if (activity) {
            // Update existing activity
            const activityRef = doc(firestore, `users/${user.uid}/activityTemplates`, activity.id);
            setDocumentNonBlocking(activityRef, {
                ...values,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        } else {
            // Create new activity
            const activitiesCollection = collection(firestore, `users/${user.uid}/activityTemplates`);
            addDocumentNonBlocking(activitiesCollection, {
                ...values,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }

        toast({
        title: `Atividade ${activity ? 'atualizada' : 'criada'}!`,
        description: `A atividade "${values.title}" foi salva com sucesso.`,
        });
        onSuccess();
    } catch (error) {
        console.error("Error saving activity: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao salvar",
            description: "Ocorreu um problema ao salvar a atividade."
        })
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
              <FormLabel>Título da Atividade</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Limpar a chapa" {...field} />
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
                  placeholder="Descreva os passos e o padrão esperado para esta atividade."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Higiene">Higiene</SelectItem>
                        <SelectItem value="Cozinha">Cozinha</SelectItem>
                        <SelectItem value="Atendimento">Atendimento</SelectItem>
                        <SelectItem value="Segurança">Segurança</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Frequência</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="on-demand">Sob Demanda</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="space-y-4">
            <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel>Tarefa Recorrente</FormLabel>
                    <FormDescription>
                    Esta tarefa se repete na frequência definida.
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
            <FormField
            control={form.control}
            name="requiresPhoto"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel>Exige Foto como Evidência</FormLabel>
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

        <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : (activity ? 'Salvar Alterações' : 'Criar Atividade')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
