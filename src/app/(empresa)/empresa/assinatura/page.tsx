'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Download, Receipt, AlertCircle, FileText, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

import { usePerfil } from '@/hooks/use-perfil';

export default function PaginaMinhaAssinatura() {
    const { toast } = useToast();
    const { perfil } = usePerfil();

    const [isLoading, setIsLoading] = useState(true);
    const [resumo, setResumo] = useState<any>(null);
    const [cobrancas, setCobrancas] = useState<any[]>([]);

    useEffect(() => {
        const carregarAssinatura = async () => {
            if (!perfil?.empresaId) return;

            try {
                // Fetch info API segura
                const resResumo = await fetch(`/api/empresa/assinatura/resumo?empresaId=${perfil.empresaId}`);
                if (resResumo.ok) {
                    setResumo(await resResumo.json());
                }

                // Fetch histórico financeiro API segura
                const resCobs = await fetch(`/api/empresa/assinatura/cobrancas?empresaId=${perfil.empresaId}`);
                if (resCobs.ok) {
                    const data = await resCobs.json();
                    setCobrancas(data.cobrancas || []);
                }
            } catch (error) {
                console.error("Erro carrega assinatura", error);
            } finally {
                setIsLoading(false);
            }
        };

        carregarAssinatura();
    }, [perfil]);

    if (isLoading) {
        return <div className="flex p-8 justify-center items-center"><div>Carregando faturas...</div></div>;
    }

    if (!resumo) {
        return <div className="p-8"><Card className="p-6 text-center text-muted-foreground">Ocorreu um erro ao localizar sua conta. Contate o suporte.</Card></div>;
    }

    const formatarStatusCobranca = (status: string) => {
        switch (status) {
            case 'RECEIVED':
            case 'CONFIRMED': return { label: 'Pago', class: 'bg-emerald-100 text-emerald-800' };
            case 'PENDING': return { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800' };
            case 'OVERDUE': return { label: 'Vencido', class: 'bg-destructive/10 text-destructive' };
            default: return { label: status, class: 'bg-muted text-muted-foreground' };
        }
    };

    const StatusEmpresaColor = () => {
        switch (resumo.status) {
            case 'ATIVO': return 'bg-emerald-500';
            case 'TRIAL_ATIVO': return 'bg-blue-500';
            case 'GRACE': return 'bg-yellow-500';
            case 'SUSPENSO': return 'bg-destructive';
            default: return 'bg-muted';
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 w-full max-w-[1200px] mx-auto">
            {/* Header / Titulo */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assinatura e Faturamento</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie o plano atual, histórico de cobranças e método de pagamento.
                    </p>
                </div>
            </div>

            {/* Painel Info Assinatura Ativa */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${StatusEmpresaColor()}`} />
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle>Plano Atual</CardTitle>
                            <Badge variant="outline" className={`ml-auto border-transparent font-semibold ${resumo.status === 'TRIAL_ATIVO' ? 'bg-blue-100 text-blue-700' :
                                resumo.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-700' :
                                    resumo.status === 'SUSPENSO' ? 'bg-destructive/10 text-destructive' :
                                        'bg-yellow-100 text-yellow-700'
                                }`}>
                                {resumo.status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <CardDescription>Cobrado {resumo.ciclo === 'ANUAL' ? 'Anualmente' : 'Mensalmente'} com base em Assinatura Automatizada.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-4xl font-extrabold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumo.valorAtual || 0)}</span>
                            <span className="text-muted-foreground">/ {resumo.ciclo === 'MENSAL' ? 'mês' : 'ano'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground mb-1">Produto Contratado</p>
                                <p className="font-semibold">{resumo.planoAtual?.nome || 'Licença Base'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">ID da Conta</p>
                                <p className="font-mono text-xs">{resumo.asaasCustomerId || 'Não provisionado no gateway'}</p>
                            </div>
                            {resumo.status === 'TRIAL_ATIVO' && resumo.trialFim && (
                                <div className="col-span-2 bg-blue-50 p-3 rounded-md text-blue-800 mt-2 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Seu período trial expira em <strong>{new Date(resumo.trialFim).toLocaleDateString('pt-BR')}</strong>. Finalize o aceite enviado caso ainda não tenha ativado oficialmente.</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 pt-4 flex gap-3">
                        <Button variant="outline" onClick={() => toast({ title: 'Em breve', description: 'Redirecionamento para tela do Asaas Check-out será feito aqui' })}>
                            <CreditCard className="mr-2 h-4 w-4" /> Atualizar Pagamento
                        </Button>
                        <Button variant="ghost" onClick={() => toast({ title: 'Upsell', description: 'Abriria modal de upgrade de licenças.' })}>
                            Mudar Plano
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Fatura Vigente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {cobrancas.length > 0 && cobrancas[0].status === 'PENDING' ? (
                            <>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Vencimento</p>
                                    <p className="font-medium text-lg flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        {new Date(cobrancas[0].vencimentoEm).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Valor do Boleto/Pix</p>
                                    <p className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobrancas[0].valor || 0)}</p>
                                </div>
                                <Button
                                    className="w-full mt-2"
                                    disabled={!cobrancas[0].links?.invoiceUrl}
                                    onClick={() => cobrancas[0].links?.invoiceUrl ? window.open(cobrancas[0].links.invoiceUrl, '_blank') : null}
                                >
                                    Pagar Fatura
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-6 h-full text-emerald-600 bg-emerald-50 rounded-lg">
                                <Receipt className="h-8 w-8 mb-2 opacity-50" />
                                <span className="font-medium">Nenhuma fatura pendente!</span>
                                <span className="text-xs mt-1 text-emerald-600/70">Você está em dia conosco.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Historico Listagem */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Cobranças</CardTitle>
                    <CardDescription>Todas as faturas emitidas e mensalidades anteriores desta unidade.</CardDescription>
                </CardHeader>
                <CardContent>
                    {cobrancas.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-md bg-muted/20">
                            Nenhum registro financeiro encontrado ainda.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Identificador</TableHead>
                                        <TableHead>Forma</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Boleto (PDF)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cobrancas.map((cob) => {
                                        const stat = formatarStatusCobranca(cob.status);
                                        return (
                                            <TableRow key={cob.id}>
                                                <TableCell className="font-medium">
                                                    {new Date(cob.vencimentoEm).toLocaleDateString('pt-BR')}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {cob.asaasPaymentId || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {cob.forma === 'CREDIT_CARD' ? 'Cartão' : cob.forma === 'PIX' ? 'PIX' : 'Boleto'}
                                                </TableCell>
                                                <TableCell>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cob.valor)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${stat.class}`}>
                                                        {stat.label}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {cob.links?.boletoPdfUrl ? (
                                                        <Button variant="ghost" size="icon" title="Baixar PDF" asChild>
                                                            <a href={cob.links.boletoPdfUrl} target="_blank" rel="noopener noreferrer">
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    ) : (
                                                        // Se não tiver PDF direto do asaas (ex cartão), permite ver Invoice 
                                                        cob.links?.invoiceUrl ? (
                                                            <Button variant="ghost" size="icon" title="Ver Recibo" asChild>
                                                                <a href={cob.links.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                                                </a>
                                                            </Button>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">-</span>
                                                        )
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
