'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { formatarCNPJ, formatarTelefoneBR, normalizarCNPJ, normalizarWhatsApp } from '@/lib/formatadores/formato';
import { fetchJSON } from '@/lib/http/fetch-json';
import {
    Building2,
    Users,
    ShieldCheck,
    AlertCircle,
    Plus,
    Activity,
    Settings,
    FileText,
    TrendingUp,
    ServerCrash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { EmpresaAtualizada } from '@/lib/types/financeiro';
import { useFirebase } from '@/firebase/provider';
import { repositorioEmpresasFirestore } from '@/lib/repositories/repositorio-empresas-firestore';

// 1. DADOS MOCKADOS
const mockMétricas = {
    empresasAtivas: 12,
    usuariosAtivos7d: 184,
    assinaturasEmDia: 10,
    pendencias: 2,
};

const mockEmpresasIniciais: EmpresaAtualizada[] = [];

export default function PortalSistemaDashboard() {
    const { toast } = useToast();
    const { firestore } = useFirebase();

    // Lista de empresas com estado para suportar o mock de criação
    const [empresas, setEmpresas] = useState<EmpresaAtualizada[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const carregaLista = async () => {
            if (!firestore) return;
            try {
                const results = await repositorioEmpresasFirestore.listarTodas(firestore);
                // sort latest first
                setEmpresas(results.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()));
            } catch (err) {
                console.error("Erro ao listar", err);
            } finally {
                setIsLoading(false);
            }
        };
        carregaLista();
    }, [firestore]);

    // Estados do Formulario (MVP de criação)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoNome, setNovoNome] = useState('');
    const [novoCnpj, setNovoCnpj] = useState('');
    const [novoResponsavel, setNovoResponsavel] = useState('');
    const [novoEmail, setNovoEmail] = useState('');
    const [novoWhatsapp, setNovoWhatsapp] = useState('');
    const [novoDiasTrial, setNovoDiasTrial] = useState<number>(7);

    const getDefaultDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };
    const [novoVencimentoPrimeiraCobranca, setNovoVencimentoPrimeiraCobranca] = useState(getDefaultDate());

    const [novoPlano, setNovoPlano] = useState<'Starter' | 'Pro' | 'Enterprise'>('Starter');
    const [novoStatus, setNovoStatus] = useState<'Ativa' | 'Suspensa'>('Ativa');

    const formRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errosForm, setErrosForm] = useState<Record<string, string>>({});

    const handleCriarEmpresa = async (e: React.FormEvent) => {
        e.preventDefault();

        const cnpjNormalizado = normalizarCNPJ(novoCnpj);
        const whatsappNormalizado = normalizarWhatsApp(novoWhatsapp);

        const erros: Record<string, string> = {};

        if (!novoNome.trim())
            erros.nome = "Nome é obrigatório.";

        if (cnpjNormalizado.length !== 14)
            erros.cnpj = "CNPJ inválido (precisa ter 14 dígitos).";

        if (!novoResponsavel.trim())
            erros.responsavel = "Responsável é obrigatório.";

        if (!novoEmail.trim())
            erros.email = "E-mail é obrigatório.";
        else if (!/\S+@\S+\.\S+/.test(novoEmail.trim()))
            erros.email = "E-mail inválido.";

        if (!(whatsappNormalizado.length >= 10 && whatsappNormalizado.length <= 13))
            erros.whatsappResponsavel = "WhatsApp inválido (deve ter entre 10 e 13 números com DDD).";

        if (Object.keys(erros).length > 0) {
            setErrosForm(erros);
            return;
        }

        setErrosForm({});
        setIsSubmitting(true);

        try {
            const payload = {
                nome: novoNome.trim(),
                cnpj: cnpjNormalizado,
                responsavel: novoResponsavel.trim(),
                email: novoEmail.trim().toLowerCase(),
                whatsappResponsavel: whatsappNormalizado,
                planoId: novoPlano,
                status: novoStatus,
                diasTrial: novoDiasTrial,
                vencimentoPrimeiraCobrancaEm: novoVencimentoPrimeiraCobranca
            };

            type CriarEmpresaResponse = {
                ok: true;
                empresaId: string;
                aceiteToken?: string;
                linkAceite?: string;
            };

            const data = await fetchJSON<CriarEmpresaResponse>('/api/sistema/empresas/criar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Fake append immediately without waiting global state sync to avoid reload
            const dataAtual = new Date();
            const trialFim = new Date();
            trialFim.setDate(dataAtual.getDate() + 7);

            const novaEmpresa: EmpresaAtualizada = {
                id: data.empresaId,
                nome: novoNome.trim(),
                cnpj: cnpjNormalizado,
                responsavelNome: novoResponsavel.trim(),
                responsavelEmail: novoEmail.trim().toLowerCase(),
                whatsappResponsavel: whatsappNormalizado,
                planoId: novoPlano,
                planoNome: novoPlano,
                cicloPagamento: 'MENSAL',
                valorAtual: novoPlano === 'Starter' ? 97 : (novoPlano === 'Pro' ? 197 : 497),
                status: 'TRIAL_ATIVO',
                diasTrial: novoDiasTrial,
                vencimentoPrimeiraCobrancaEm: novoVencimentoPrimeiraCobranca,
                trialInicio: dataAtual.toISOString(),
                trialFim: trialFim.toISOString(),
                criadoEm: dataAtual.toISOString(),
                atualizadoEm: dataAtual.toISOString()
            };

            setEmpresas([novaEmpresa, ...empresas]);
            setIsModalOpen(false);
            resetForm();

            toast({
                title: "Tenant Criado com Sucesso!",
                description: `A empresa entrou em modo Trial e o link de ativação foi encaminhado.`,
            });
        } catch (error: any) {
            console.error('Falha ao instanciar tenant:', error);
            const msg = error?.message || 'Erro sistêmico ao criar empresa. Verifique os campos e tente novamente.';
            toast({ title: 'Erro sistêmico', description: msg, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setNovoNome('');
        setNovoCnpj('');
        setNovoResponsavel('');
        setNovoEmail('');
        setNovoWhatsapp('');
        setNovoDiasTrial(7);
        setNovoVencimentoPrimeiraCobranca(getDefaultDate());
        setNovoPlano('Starter');
        setNovoStatus('Ativa');
        setErrosForm({});
    };

    return (
        <div className="flex flex-col gap-8">
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Visão Geral do Sistema</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Acompanhe métricas do produto e a saúde das empresas (tenants).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/sistema/empresas">
                            Ver Empresas
                        </Link>
                    </Button>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nova empresa
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <form ref={formRef} onSubmit={handleCriarEmpresa} noValidate>
                                <DialogHeader>
                                    <DialogTitle>Criar Nova Empresa</DialogTitle>
                                    <DialogDescription>
                                        Provisione um novo tenant no sistema. Os dados do administrador principal serão gerados.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <Label htmlFor="nome" className="text-right mt-3">
                                            Nome *
                                        </Label>
                                        <div className="col-span-3">
                                            <Input
                                                id="nome"
                                                value={novoNome}
                                                onChange={(e) => setNovoNome(e.target.value)}
                                                placeholder="Nome fantasia da empresa"
                                            />
                                            {errosForm.nome && <p className="text-xs text-destructive mt-1">{errosForm.nome}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <Label htmlFor="cnpj" className="text-right mt-3">
                                            CNPJ *
                                        </Label>
                                        <div className="col-span-3">
                                            <Input
                                                id="cnpj"
                                                value={novoCnpj}
                                                onChange={(e) => setNovoCnpj(formatarCNPJ(e.target.value))}
                                                placeholder="00.000.000/0000-00"
                                                inputMode="numeric"
                                                autoComplete="off"
                                            />
                                            {errosForm.cnpj && <p className="text-xs text-destructive mt-1">{errosForm.cnpj}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-start gap-4 mt-2">
                                        <Label htmlFor="responsavel" className="text-right mt-3">
                                            Resp. *
                                        </Label>
                                        <div className="col-span-3">
                                            <Input
                                                id="responsavel"
                                                value={novoResponsavel}
                                                onChange={(e) => setNovoResponsavel(e.target.value)}
                                                placeholder="Nome do administrador"
                                            />
                                            {errosForm.responsavel && <p className="text-xs text-destructive mt-1">{errosForm.responsavel}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <Label htmlFor="email" className="text-right mt-3">
                                            E-mail *
                                        </Label>
                                        <div className="col-span-3">
                                            <Input
                                                id="email"
                                                type="email"
                                                value={novoEmail}
                                                onChange={(e) => setNovoEmail(e.target.value)}
                                                placeholder="email@empresa.com"
                                            />
                                            {errosForm.email && <p className="text-xs text-destructive mt-1">{errosForm.email}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <Label htmlFor="whatsapp" className="text-right text-xs mt-3">
                                            WhatsApp *
                                        </Label>
                                        <div className="col-span-3">
                                            <Input
                                                id="whatsapp"
                                                type="tel"
                                                value={novoWhatsapp}
                                                onChange={(e) => setNovoWhatsapp(formatarTelefoneBR(e.target.value))}
                                                placeholder="+55 (61) 99999-9999"
                                                inputMode="tel"
                                                autoComplete="tel"
                                            />
                                            {errosForm.whatsappResponsavel && <p className="text-xs text-destructive mt-1">{errosForm.whatsappResponsavel}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4 mt-2">
                                        <Label htmlFor="diasTrial" className="text-right text-xs">
                                            Dias de Trial
                                        </Label>
                                        <Input
                                            id="diasTrial"
                                            type="number"
                                            min="0"
                                            value={novoDiasTrial}
                                            onChange={(e) => setNovoDiasTrial(parseInt(e.target.value) || 0)}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="vencimento" className="text-right text-xs">
                                            Vencimento 1ª
                                        </Label>
                                        <Input
                                            id="vencimento"
                                            type="date"
                                            value={novoVencimentoPrimeiraCobranca}
                                            onChange={(e) => setNovoVencimentoPrimeiraCobranca(e.target.value)}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4 mt-2">
                                        <Label htmlFor="plano" className="text-right">
                                            Plano
                                        </Label>
                                        <div className="col-span-3">
                                            <Select value={novoPlano} onValueChange={(v: any) => setNovoPlano(v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o plano" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Starter">Starter</SelectItem>
                                                    <SelectItem value="Pro">Pro</SelectItem>
                                                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="status" className="text-right">
                                            Status
                                        </Label>
                                        <div className="col-span-3">
                                            <Select value={novoStatus} onValueChange={(v: any) => setNovoStatus(v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Status inicial" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Ativa">Ativa</SelectItem>
                                                    <SelectItem value="Suspensa">Suspensa</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Provisionando...' : 'Criar empresa'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPI CARDS (2x2 ou 4 col) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Empresas ativas</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockMétricas.empresasAtivas}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-emerald-500 font-medium">+2</span> esta semana
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Usuários ativos (7 dias)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockMétricas.usuariosAtivos7d}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-emerald-500 font-medium">+15%</span> em relação ao último período
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Assinaturas em dia</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockMétricas.assinaturasEmDia}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            83% de conversão base
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-warning/50 bg-warning/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-warning-foreground">Atenção / Pendências</CardTitle>
                        <AlertCircle className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-warning-foreground">{mockMétricas.pendencias}</div>
                        <p className="text-xs text-warning-foreground/80 mt-1">
                            Contas suspensas requerem ação
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* AÇÕES RÁPIDAS (Atalhos) */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setIsModalOpen(true)}>
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                            <div className="bg-primary/10 p-3 rounded-full mb-3 text-primary">
                                <Plus className="h-6 w-6" />
                            </div>
                            <span className="font-medium text-sm">Criar empresa</span>
                        </CardContent>
                    </Card>
                    <Link href="/sistema/empresas" className="h-full">
                        <Card className="hover:border-primary/50 transition-colors h-full">
                            <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                                <div className="bg-muted p-3 rounded-full mb-3 text-muted-foreground">
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <span className="font-medium text-sm">Gerenciar empresas</span>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/sistema/assinaturas" className="h-full">
                        <Card className="hover:border-primary/50 transition-colors h-full">
                            <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                                <div className="bg-muted p-3 rounded-full mb-3 text-muted-foreground">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <span className="font-medium text-sm">Assinaturas</span>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/sistema/usuarios" className="h-full">
                        <Card className="hover:border-primary/50 transition-colors h-full">
                            <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
                                <div className="bg-muted p-3 rounded-full mb-3 text-muted-foreground">
                                    <Users className="h-6 w-6" />
                                </div>
                                <span className="font-medium text-sm">Usuários do sistema</span>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-3">
                {/* LISTA DE EMPRESAS (Esquerda / Principal) */}
                <Card className="md:col-span-4 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Empresas recentes</CardTitle>
                        <CardDescription>
                            Os últimos locatários adicionados à plataforma.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {empresas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-lg border border-dashed">
                                <Building2 className="h-8 w-8 text-muted-foreground mb-3" />
                                <p className="text-sm font-medium text-foreground">Nenhuma empresa encontrada</p>
                                <Button variant="link" onClick={() => setIsModalOpen(true)}>Criar primeira empresa</Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Empresa</TableHead>
                                            <TableHead>Plano</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="hidden md:table-cell">Criada em</TableHead>
                                            <TableHead className="text-right">Ação</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {empresas.map((emp) => (
                                            <TableRow key={emp.id}>
                                                <TableCell className="font-medium">
                                                    <div>{emp.nome}</div>
                                                    <div className="text-xs text-muted-foreground hidden sm:block">{emp.responsavelEmail}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={emp.planoId === 'Enterprise' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                                                        {emp.planoNome || emp.planoId}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${['ATIVO', 'TRIAL_ATIVO'].includes(emp.status) ? 'bg-emerald-500' : (emp.status === 'GRACE' ? 'bg-warning' : 'bg-destructive')}`} />
                                                        <span className="text-sm">{emp.status.replace('_', ' ')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                                    {new Date(emp.criadoEm).toLocaleDateString('pt-BR')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/sistema/empresas?filtro=${emp.id}`}>
                                                            Ver
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* PAINEL SAÚDE PRODUTO (Direita / Menor) */}
                <Card className="md:col-span-3 lg:col-span-1 border-primary/10 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Saúde do Produto
                        </CardTitle>
                        <CardDescription>
                            Diagnóstico e telemetria da aplicação matriz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                    Uptime (30 dias)
                                </span>
                                <span className="font-bold text-emerald-600">99,99%</span>
                            </div>
                            <div className="w-full bg-emerald-100 rounded-full h-1.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '99%' }}></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium flex items-center gap-2">
                                    <ServerCrash className="h-4 w-4 text-warning" />
                                    Erros (24h)
                                </span>
                                <span className="font-bold text-warning-foreground">3</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    Fila de suporte
                                </span>
                                <span className="font-bold text-blue-600">1</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            className="w-full bg-background"
                            onClick={() => toast({ title: 'Em breve', description: 'Log de telemetria base será acoplado.' })}
                        >
                            Ver auditoria
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
