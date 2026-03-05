'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePlanosSistema, CriarPlanoInput } from '@/hooks/use-planos-sistema';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

const planoSchema = z.object({
    nome: z.string().min(2, "Nome é obrigatório"),
    descricao: z.string().optional(),
    precoMensalReais: z.number().min(0, "Preço inválido"),
    maxUsuarios: z.number().int().min(1, "Mínimo de 1 usuário"),
    ativo: z.boolean().default(true),
});

type FormValues = z.infer<typeof planoSchema>;

interface ModalCriarPlanoProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function ModalCriarPlano({ open, onOpenChange, onSuccess }: ModalCriarPlanoProps) {
    const { criarPlano, isLoading, fieldErrors, globalError } = usePlanosSistema();
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(planoSchema),
        defaultValues: {
            nome: '',
            descricao: '',
            precoMensalReais: 0,
            maxUsuarios: 10,
            ativo: true,
        }
    });

    const onSubmit = async (data: FormValues) => {
        // Convertemos Reais para Centavos ao enviar pro backend
        const payload: CriarPlanoInput = {
            nome: data.nome,
            descricao: data.descricao,
            precoMensal: Math.round(data.precoMensalReais * 100),
            maxUsuarios: data.maxUsuarios,
            ativo: data.ativo
        };

        const sucesso = await criarPlano(payload);
        if (sucesso) {
            toast({
                title: 'Plano criado com sucesso!',
                description: 'O novo plano já está disponível para uso.'
            });
            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } else {
            toast({
                title: 'Erro ao criar',
                description: 'Verifique os dados preenchidos e tente novamente.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo Plano de Assinatura</DialogTitle>
                    <DialogDescription>
                        Defina o pacote de recursos limitados para novos tenants.
                    </DialogDescription>
                </DialogHeader>

                {globalError && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                        {globalError}
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Nome */}
                        <FormField control={form.control} name="nome" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Plano</FormLabel>
                                <FormControl>
                                    <Input placeholder="Essential, Pro, Enterprise..." {...field} />
                                </FormControl>
                                <FormMessage>{fieldErrors['nome']?.[0]}</FormMessage>
                            </FormItem>
                        )} />

                        {/* Descrição */}
                        <FormField control={form.control} name="descricao" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                    <Input placeholder="Para pequenas equipes..." {...field} />
                                </FormControl>
                                <FormMessage>{fieldErrors['descricao']?.[0]}</FormMessage>
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Preco */}
                            <FormField control={form.control} name="precoMensalReais" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preço Mensal (R$)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number" step="0.01"
                                            {...field}
                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage>{fieldErrors['precoMensal']?.[0]}</FormMessage>
                                </FormItem>
                            )} />

                            {/* Usuarios Max */}
                            <FormField control={form.control} name="maxUsuarios" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Usuários Inclusos</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={e => field.onChange(parseInt(e.target.value, 10))}
                                        />
                                    </FormControl>
                                    <FormMessage>{fieldErrors['maxUsuarios']?.[0]}</FormMessage>
                                </FormItem>
                            )} />
                        </div>

                        {/* Ativo */}
                        <FormField control={form.control} name="ativo" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Plano Ativo</FormLabel>
                                    <FormDescription>Se ficar inativo, ninguém poderá contratá-lo.</FormDescription>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Salvando...' : 'Salvar Plano'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
