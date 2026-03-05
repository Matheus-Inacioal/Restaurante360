'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUsuariosSistema, CriarUsuarioSistemaInput } from '@/hooks/use-usuarios-sistema';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const usuarioSchema = z.object({
    nome: z.string().min(2, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    papel: z.enum(["SUPERADMIN", "SUPORTE_N1", "SUPORTE_N2"]),
});

type FormValues = z.infer<typeof usuarioSchema>;

interface ModalCriarUsuarioSistemaProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function ModalCriarUsuarioSistema({ open, onOpenChange, onSuccess }: ModalCriarUsuarioSistemaProps) {
    const { criarUsuario, isLoading, fieldErrors, globalError } = useUsuariosSistema();
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(usuarioSchema),
        defaultValues: {
            nome: '',
            email: '',
            papel: 'SUPORTE_N1',
        }
    });

    const onSubmit = async (data: FormValues) => {
        const payload: CriarUsuarioSistemaInput = data;

        const sucesso = await criarUsuario(payload);
        if (sucesso) {
            toast({
                title: 'Usuário do sistema criado!',
                description: 'Um e-mail enviado com dados de acesso provisórios.'
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
                    <DialogTitle>Novo Usuário do Sistema</DialogTitle>
                    <DialogDescription>
                        Adicione um membro ao painel administrativo Master (Team/Support/Admins).
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
                                <FormLabel>Nome Completo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome do colaborador" {...field} />
                                </FormControl>
                                <FormMessage>{fieldErrors['nome']?.[0]}</FormMessage>
                            </FormItem>
                        )} />

                        {/* Email */}
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>E-mail Corporativo</FormLabel>
                                <FormControl>
                                    <Input placeholder="nome@sys.com.br" type="email" {...field} />
                                </FormControl>
                                <FormMessage>{fieldErrors['email']?.[0]}</FormMessage>
                            </FormItem>
                        )} />

                        {/* Papel */}
                        <FormField control={form.control} name="papel" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nível de Acesso Global</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="SUPERADMIN">Super Administrador (Tudo)</SelectItem>
                                        <SelectItem value="SUPORTE_N2">Suporte N2 (Manutenção e Processos)</SelectItem>
                                        <SelectItem value="SUPORTE_N1">Suporte N1 (Apenas visualização)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage>{fieldErrors['papel']?.[0]}</FormMessage>
                            </FormItem>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Criando...' : 'Criar Usuário'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
