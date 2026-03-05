'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEmpresasSistema, CriarEmpresaInput } from '@/hooks/use-empresas-sistema';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Aplicamos as máscaras visualmente, o valor real é raw
const tenantSchema = z.object({
    nome: z.string().min(2, "Nome é obrigatório"),
    cnpj: z.string().min(14, "CNPJ precisa ter no mínimo 14 números"),
    responsavelNome: z.string().min(2, "Nome do responsável é obrigatório"),
    email: z.string().email("Email inválido"),
    whatsappResponsavel: z.string().min(10, "WhatsApp incompleto"),
    planoId: z.string().min(1, "Plano é obrigatório"),
    diasTrial: z.number().int().min(0, "Dias trial devem ser válidos").default(7),
});

type FormValues = z.infer<typeof tenantSchema>;

interface ModalCriarEmpresaProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function ModalCriarEmpresa({ open, onOpenChange, onSuccess }: ModalCriarEmpresaProps) {
    const { criarEmpresa, isLoading, fieldErrors, globalError } = useEmpresasSistema();
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(tenantSchema),
        defaultValues: {
            nome: '',
            cnpj: '',
            responsavelNome: '',
            email: '',
            whatsappResponsavel: '',
            planoId: 'essential',
            diasTrial: 7,
        }
    });

    const onSubmit = async (data: FormValues) => {
        // Normalizar raw payload para envios
        const payload: CriarEmpresaInput = {
            ...data,
            cnpj: data.cnpj.replace(/\D/g, ''),
            whatsappResponsavel: data.whatsappResponsavel.replace(/\D/g, '')
        };

        const sucesso = await criarEmpresa(payload);
        if (sucesso) {
            toast({
                title: 'Empresa criada com sucesso!',
                description: 'Um e-mail foi enviado ao responsável.'
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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Nova Empresa</DialogTitle>
                    <DialogDescription>
                        Crie um novo tenant no sistema. Um e-mail será enviado com as instruções de acesso.
                    </DialogDescription>
                </DialogHeader>

                {globalError && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                        {globalError}
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Nome Fantasia */}
                            <FormField control={form.control} name="nome" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Empresa</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Restaurante do João" {...field} />
                                    </FormControl>
                                    {/* Exibe o erro do Zod (client) e/ou Issues vindos da API */}
                                    <FormMessage>{fieldErrors['nome']?.[0]}</FormMessage>
                                </FormItem>
                            )} />

                            {/* CNPJ */}
                            <FormField control={form.control} name="cnpj" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CNPJ</FormLabel>
                                    <FormControl>
                                        {/* No futuro: Aplicar máscara de CNPJ aqui */}
                                        <Input placeholder="00.000.000/0000-00" {...field} />
                                    </FormControl>
                                    <FormMessage>{fieldErrors['cnpj']?.[0]}</FormMessage>
                                </FormItem>
                            )} />

                            {/* Responsável Nome */}
                            <FormField control={form.control} name="responsavelNome" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Responsável</FormLabel>
                                    <FormControl>
                                        <Input placeholder="João da Silva" {...field} />
                                    </FormControl>
                                    <FormMessage>{fieldErrors['responsavelNome']?.[0]}</FormMessage>
                                </FormItem>
                            )} />

                            {/* Email */}
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-mail do Responsável</FormLabel>
                                    <FormControl>
                                        <Input placeholder="joao@gmail.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage>{fieldErrors['email']?.[0]}</FormMessage>
                                </FormItem>
                            )} />

                            {/* WhatsApp */}
                            <FormField control={form.control} name="whatsappResponsavel" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>WhatsApp</FormLabel>
                                    <FormControl>
                                        <Input placeholder="(11) 99999-9999" {...field} />
                                    </FormControl>
                                    <FormMessage>{fieldErrors['whatsappResponsavel']?.[0]}</FormMessage>
                                </FormItem>
                            )} />

                            {/* Plano e Trial combinados abaixo */}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Plano ID */}
                            <FormField control={form.control} name="planoId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plano de Assinatura</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um plano" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="essential">Essencial</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage>{fieldErrors['planoId']?.[0]}</FormMessage>
                                </FormItem>
                            )} />

                            {/* Dias Trial */}
                            <FormField control={form.control} name="diasTrial" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dias de Trial</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            {...field}
                                            onChange={e => field.onChange(parseInt(e.target.value, 10))}
                                        />
                                    </FormControl>
                                    <FormMessage>{fieldErrors['diasTrial']?.[0]}</FormMessage>
                                </FormItem>
                            )} />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Criando...' : 'Criar Empresa'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
