'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Plus,
    Building2,
    Search,
    AlertCircle,
    RefreshCw,
    Eye,
} from 'lucide-react';
import { ModalCriarEmpresa } from '@/components/sistema/modal-criar-empresa';
import { ModalEmpresaDetalhes } from '../components/empresas/ModalEmpresaDetalhes';
import { useEmpresasSistema } from '@/hooks/use-empresas-sistema';
import { StatusEmpresa } from '@/lib/types/financeiro';
import { formatarCNPJ } from '@/lib/formatadores/formato';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatarDataCurta = (value: any): string => {
    if (!value) return '—';
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '—';
    }
};

const badgeVariantPorStatus = (status: string) => {
    switch (status) {
        case 'ATIVO': return 'default' as const;
        case 'TRIAL_ATIVO': return 'secondary' as const;
        case 'SUSPENSO': return 'outline' as const;
        case 'CANCELADO': return 'destructive' as const;
        default: return 'outline' as const;
    }
};

const labelStatus = (status: string) => {
    switch (status) {
        case 'ATIVO': return 'Ativo';
        case 'TRIAL_ATIVO': return 'Trial Ativo';
        case 'SUSPENSO': return 'Suspenso';
        case 'CANCELADO': return 'Cancelado';
        case 'GRACE': return 'Grace';
        default: return status;
    }
};

// ─── Componente ─────────────────────────────────────────────────────────────

export default function EmpresasPage() {
    const {
        empresasFiltradas,
        estadoLista,
        erroLista,
        recarregar,
        busca,
        setBusca,
        filtroStatus,
        setFiltroStatus,
    } = useEmpresasSistema();

    const [isCriarOpen, setIsCriarOpen] = useState(false);
    const [empresaDetalheId, setEmpresaDetalheId] = useState<string | null>(null);
    const [isDetalheOpen, setIsDetalheOpen] = useState(false);

    const abrirDetalhes = (empresaId: string) => {
        setEmpresaDetalheId(empresaId);
        setIsDetalheOpen(true);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Gerencie as empresas (tenants) cadastradas no sistema.
                    </p>
                </div>
                <Button onClick={() => setIsCriarOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova empresa
                </Button>
            </div>

            {/* FILTROS */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="busca-empresas"
                        placeholder="Buscar por nome, responsável, e-mail ou CNPJ..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select
                    value={filtroStatus}
                    onValueChange={(val) => setFiltroStatus(val as StatusEmpresa | 'TODOS')}
                >
                    <SelectTrigger className="w-full sm:w-[180px]" id="filtro-status-empresas">
                        <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="TODOS">Todos os status</SelectItem>
                        <SelectItem value="ATIVO">Ativo</SelectItem>
                        <SelectItem value="TRIAL_ATIVO">Trial Ativo</SelectItem>
                        <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* ESTADO: CARREGANDO */}
            {estadoLista === 'carregando' && (
                <Card>
                    <CardContent className="p-6 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-4 w-[30%]" />
                                <Skeleton className="h-4 w-[20%]" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-4 w-[15%]" />
                                <Skeleton className="h-4 w-[10%]" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ESTADO: ERRO */}
            {estadoLista === 'erro' && (
                <Card className="border-destructive/50">
                    <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                        <h3 className="text-lg font-semibold text-destructive mb-2">Erro ao carregar empresas</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md">{erroLista}</p>
                        <Button variant="outline" onClick={recarregar}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Tentar novamente
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ESTADO: VAZIO */}
            {estadoLista === 'vazio' && (
                <Card className="border-dashed shadow-sm">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-muted/50 p-3 rounded-full mb-3 inline-flex">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-lg">Nenhuma empresa encontrada</CardTitle>
                        <CardDescription>
                            Nenhuma empresa cadastrada no sistema ainda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-6">
                        <Button onClick={() => setIsCriarOpen(true)} className="mt-2">
                            <Plus className="mr-2 h-4 w-4" />
                            Criar primeira empresa
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ESTADO: SUCESSO — TABELA */}
            {estadoLista === 'sucesso' && (
                <>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {empresasFiltradas.length} empresa{empresasFiltradas.length !== 1 ? 's' : ''} encontrada{empresasFiltradas.length !== 1 ? 's' : ''}
                        </span>
                        <Button variant="ghost" size="sm" onClick={recarregar}>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            Atualizar
                        </Button>
                    </div>

                    {empresasFiltradas.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                                <Search className="h-10 w-10 text-muted-foreground/30 mb-4" />
                                <p className="font-medium text-foreground/80">Nenhum resultado para os filtros aplicados</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Tente alterar a busca ou o filtro de status.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead className="hidden md:table-cell">CNPJ</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                                            <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {empresasFiltradas.map((empresa) => (
                                            <TableRow
                                                key={empresa.id}
                                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => abrirDetalhes(empresa.id)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        <span className="font-medium truncate max-w-[200px]" title={empresa.nome}>
                                                            {empresa.nome || '—'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-muted-foreground text-sm font-mono">
                                                    {empresa.cnpj ? formatarCNPJ(empresa.cnpj) : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={badgeVariantPorStatus(empresa.status)} className="whitespace-nowrap">
                                                        {labelStatus(empresa.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-[180px]" title={empresa.responsavelEmail}>
                                                    {empresa.responsavelNome || empresa.responsavelEmail || '—'}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                                                    {formatarDataCurta(empresa.criadoEm)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            abrirDetalhes(empresa.id);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1.5" />
                                                        Detalhes
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* MODAIS */}
            <ModalCriarEmpresa
                open={isCriarOpen}
                onOpenChange={setIsCriarOpen}
                onSuccess={recarregar}
            />

            <ModalEmpresaDetalhes
                empresaId={empresaDetalheId}
                open={isDetalheOpen}
                onOpenChange={setIsDetalheOpen}
                onUpdated={recarregar}
            />
        </div>
    );
}
