'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Por favor, insira um email válido.'),
  papel: z.enum(['gestor', 'bar', 'pia', 'cozinha', 'producao', 'garcon']),
});

type UserFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  onSuccess: () => void;
}

export function UserForm({ onSuccess }: UserFormProps) {
  const { toast } = useToast();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      papel: 'garcon',
    },
  });

  async function onSubmit(values: UserFormValues) {
    setGlobalError(null);
    try {
      const res = await fetch('/api/empresa/usuarios/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.issues) {
          // Exibir issues do ZD no form (opcional map)
          Object.entries(data.issues).forEach(([field, messages]) => {
            form.setError(field as any, { message: (messages as string[])[0] });
          });
          throw new Error("Verifique os campos inválidos.");
        }
        throw new Error(data.message || 'Ocorreu um erro.');
      }

      toast({
        title: 'Usuário adicionado!',
        description: `O colaborador foi vinculado à sua equipe.`,
      });
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error(error);
      setGlobalError(error.message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {globalError && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {globalError}
          </div>
        )}
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="joao.silva@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="papel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="pia">Pia</SelectItem>
                  <SelectItem value="cozinha">Cozinha</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                  <SelectItem value="garcon">Garçom</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
