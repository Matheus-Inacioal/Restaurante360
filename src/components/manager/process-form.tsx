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
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { ActivityTemplate } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  name: z.string().min(3, 'O nome do processo deve ter pelo menos 3 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  activityIds: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'Você precisa selecionar pelo menos uma atividade.',
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

  const activitiesColRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/activityTemplates`);
  }, [user, firestore]);

  const { data: activities, isLoading } = useCollection<ActivityTemplate>(activitiesColRef);

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
        description: 'Não foi possível salvar o processo.',
      });
      return;
    }

    try {
      const processesCollection = collection(firestore, 'processes');
      addDocumentNonBlocking(processesCollection, {
        ...values,
        isActive: true,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Processo criado com sucesso!',
        description: `O processo "${values.name}" foi salvo.`,
      });
      onSuccess();
    } catch (error) {
      console.error('Error saving process: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um problema ao salvar o processo.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Processo</FormLabel>
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
                  placeholder="Descreva o objetivo deste processo."
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
                <FormLabel className="text-base">Atividades</FormLabel>
                <FormDescription>
                  Selecione as atividades que compõem este processo.
                </FormDescription>
              </div>
               <ScrollArea className="h-72 w-full rounded-md border">
                <div className="p-4">
              {isLoading && <p>Carregando atividades...</p>}
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
            {form.formState.isSubmitting ? 'Salvando...' : 'Criar Processo'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
