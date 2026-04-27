'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CreditCard, Receipt, QrCode, ArrowRight, ShieldCheck, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { AceiteAssinatura, EmpresaAtualizada } from '@/lib/types/financeiro';

export default function PaginaAceite({ params }: { params: { token: string } }) {
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [aceite, setAceite] = useState<AceiteAssinatura | null>(null);
    const [empresa, setEmpresa] = useState<EmpresaAtualizada | null>(null);

    const [formaPagamento, setFormaPagamento] = useState<'CREDIT_CARD' | 'BOLETO' | 'PIX'>('CREDIT_CARD');
    const [aceitouTermos, setAceitouTermos] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const res = await fetch(`/api/asaas/aceite/${params.token}`);
                const data = await res.json();

                if (res.ok && data.sucesso && data.aceite) {
                    setAceite(data.aceite);
                    if (data.empresa) {
                        setEmpresa(data.empresa);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar token", error);
            } finally {
                setIsLoading(false);
            }
        };

        carregarDados();
    }, [params.token]);

    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20"><p>Validando link de segurança...</p></div>;
    }

    if (!aceite || !empresa || aceite.status !== 'PENDENTE') {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
                <Card className="max-w-md w-full text-center p-6 border-dashed border-2">
                    <div className="mx-auto bg-destructive/10 p-4 rounded-full inline-flex mb-4">
                        <FileCheck className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="mb-2">Link Inválido ou Expirado</CardTitle>
                    <CardDescription className="mb-6">
                        Este link de ativação já foi utilizado ou não é mais válido no sistema. Por favor, solicite um novo acesso ao suporte ou tente fazer Login diretamente.
                    </CardDescription>
                    <Button className="w-full" asChild>
                        <a href="/">Ir para o Login</a>
                    </Button>
                </Card>
            </div>
        );
    }

    const handleAceiteFinal = async () => {
        if (!aceitouTermos) {
            toast({ title: 'Aceite os termos', description: 'Você deve confirmar a leitura dos Termos e Condições para prosseguir.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/asaas/assinatura', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenAceite: params.token,
                    formaPagamento: formaPagamento
                })
            });

            const data = await res.json();

            if (res.ok && data.sucesso) {
                setSucesso(true);
                toast({ title: 'Assinatura confirmada!', description: 'Seu acesso foi efetivado com sucesso. Bem-vindo ao Restaurante360.' });
            } else {
                throw new Error(data.erro || 'Erro desconhecido');
            }
        } catch (error: any) {
            toast({ title: 'Falha na Ativação', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (sucesso) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-950/20">
                <Card className="max-w-md w-full text-center p-8 border-emerald-200">
                    <div className="mx-auto bg-emerald-100 dark:bg-emerald-900 p-4 rounded-full inline-flex mb-6">
                        <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <CardTitle className="text-2xl mb-2 text-emerald-800 dark:text-emerald-200">Serviço Ativado!</CardTitle>
                    <CardDescription className="mb-8 text-base">
                        As faturas de sua assinatura já estão programadas via {formaPagamento === 'CREDIT_CARD' ? 'Cartão de Crédito' : formaPagamento === 'PIX' ? 'PIX' : 'Boleto Bancário'}.
                        Um e-mail de confirmação foi enviado.
                    </CardDescription>
                    <Button className="w-full h-12 text-lg" asChild>
                        <a href="/">Acessar o sistema</a>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2">

                {/* Bloco Informativo - Esquerda */}
                <div>
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold font-headline mb-2 text-primary">Restaurante360</h1>
                        <h2 className="text-3xl font-extrabold tracking-tight mb-4">Finalize sua Ativação</h2>
                        <p className="text-muted-foreground text-lg">
                            Olá <strong>{empresa.responsavelNome}</strong>, você está a um passo de desbloquear o acesso total para a unidade <strong>{empresa.nome}</strong>.
                        </p>
                    </div>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-xl">Resumo do Plano</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                                <span className="text-muted-foreground font-medium">Produto / Plano</span>
                                <span className="font-bold text-lg">{empresa.planoNome || aceite.planoId}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                                <span className="text-muted-foreground font-medium">Ciclo de Faturamento</span>
                                <span className="font-semibold text-primary">{aceite.ciclo}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2">
                                <span className="text-muted-foreground font-medium">Investimento</span>
                                <span className="font-black text-2xl text-primary">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(aceite.valor)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-8 flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                        <Check className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                            Seu primeiro vencimento baseia-se no próximo ciclo. Todos os valores são processados por gateways homologados pelo Banco Central para sua total segurança (ASAAS Instituição de Pagamento).
                        </p>
                    </div>
                </div>

                {/* Formulário Interativo - Direita */}
                <div>
                    <Card className="shadow-xl">
                        <CardHeader className="bg-muted/30 pb-4 border-b">
                            <CardTitle className="text-xl">Como você prefere pagar?</CardTitle>
                            <CardDescription>Escolha a forma de pagamento que será ativada e gerada na recorrência do seu plano.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <RadioGroup
                                value={formaPagamento}
                                onValueChange={(val: any) => setFormaPagamento(val)}
                                className="space-y-4"
                            >
                                <div className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${formaPagamento === 'CREDIT_CARD' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                                    <RadioGroupItem value="CREDIT_CARD" id="cc" />
                                    <Label htmlFor="cc" className="flex-1 cursor-pointer font-medium flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                                            Cartão de Crédito
                                        </span>
                                        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full font-semibold">Recomendado</span>
                                    </Label>
                                </div>

                                <div className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${formaPagamento === 'PIX' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                                    <RadioGroupItem value="PIX" id="pix" />
                                    <Label htmlFor="pix" className="flex-1 cursor-pointer font-medium flex items-center gap-2">
                                        <QrCode className="h-5 w-5 text-muted-foreground" />
                                        PIX Copia e Cola / QR Code
                                    </Label>
                                </div>

                                <div className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${formaPagamento === 'BOLETO' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                                    <RadioGroupItem value="BOLETO" id="boleto" />
                                    <Label htmlFor="boleto" className="flex-1 cursor-pointer font-medium flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-muted-foreground" />
                                        Boleto Bancário Tradicional
                                    </Label>
                                </div>
                            </RadioGroup>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-start space-x-3 p-4 bg-muted/40 rounded-lg">
                                    <Checkbox
                                        id="termos"
                                        checked={aceitouTermos}
                                        onCheckedChange={(c) => setAceitouTermos(c === true)}
                                        className="mt-1"
                                    />
                                    <div className="grid leading-none gap-1.5">
                                        <Label htmlFor="termos" className="font-medium cursor-pointer leading-relaxed text-sm">
                                            Declaro que li e concordo com os <a href="/termos" className="text-primary hover:underline" target="_blank">Termos de Serviço</a> e <a href="/privacidade" className="text-primary hover:underline" target="_blank">Política de Privacidade (LGPD)</a>.
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Estou autorizando a emissão automática de faturas em nome de meu Cadastro de Contribuinte.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter className="pt-2 pb-6 px-6">
                            <Button
                                className="w-full h-12 text-lg shadow-lg relative overflow-hidden group"
                                disabled={!aceitouTermos || isSubmitting}
                                onClick={handleAceiteFinal}
                            >
                                {isSubmitting ? 'Gerando assinatura...' : 'Confirmar e Assinar'}
                                {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

            </div>
        </div>
    );
}
