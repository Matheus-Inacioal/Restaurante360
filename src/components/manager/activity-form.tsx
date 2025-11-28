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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { ActivityTemplate, UserRole } from '@/lib/types';
import { useFirebase, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const formSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
  category: z.enum(['Higiene', 'Cozinha', 'Atendimento', 'Segurança', 'Outro']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'on-demand']),
  assignedRole: z.enum(['manager', 'collaborator', 'gestor', 'bar', 'pia', 'cozinha', 'producao', 'garcon']).optional(),
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
        description: activity.description || '',
        assignedRole: activity.assignedRole,
    } : {
      title: '',
      description: '',
      category: 'Outro',
      frequency: 'on-demand',
      requiresPhoto: false,
      status: 'active',
    },
  });

  async function onSubmit(values: ActivityFormValues) {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Não foi possível salvar a atividade.',
      });
      return;
    }

    try {
        const data = {
            ...values,
            updatedAt: serverTimestamp(),
        };

        if (activity) {
            // Update existing activity
            const activityRef = doc(firestore, `users/${user.uid}/activityTemplates`, activity.id);
            updateDocumentNonBlocking(activityRef, data);
            toast({
                title: 'Modelo de Tarefa Atualizado!',
                description: 'As alterações foram salvas com sucesso.',
            });
        } else {
            // Create new activity
            const collectionRef = collection(firestore, `users/${user.uid}/activityTemplates`);
            addDocumentNonBlocking(collectionRef, {
                ...data,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({
                title: 'Modelo de Tarefa Criado!',
                description: 'O novo modelo de tarefa foi salvo com sucesso.',
            });
        }
      onSuccess();
    } catch (error) {
      console.error('Error saving activity: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao salvar a tarefa.',
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
              <FormLabel>Título do Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Limpar chapa da cozinha" {...field} />
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
                  placeholder="Descreva a tarefa em detalhes. Inclua passos se necessário."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assignedRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Direcionar para Função (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função para direcionar" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="pia">Pia</SelectItem>
                  <SelectItem value="cozinha">Cozinha</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                  <SelectItem value="garcon">Garçom</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Se selecionado, ajuda a filtrar tarefas ao criar checklists.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
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
        
        <FormField
            control={form.control}
            name="requiresPhoto"
            render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                    <Checkbox
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
                {form.formState.isSubmitting ? 'Salvando...' : (activity ? 'Salvar Alterações' : 'Criar Modelo')}
            </Button>
        </div>

      </form>
    </Form>
  );
}
