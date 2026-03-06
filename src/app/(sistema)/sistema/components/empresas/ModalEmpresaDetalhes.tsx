'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatarCNPJ, formatarTelefoneBR } from '@/lib/formatadores/formato';
import { fetchJSON, FetchJsonError } from '@/lib/http/fetch-json';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Phone, Calendar, Hash, Banknote, Edit2, ShieldAlert, CheckCircle2, XCircle, PauseCircle, Trash2, AlertCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

// ==========================================
// UTILS FORMATADORES
// ==========================================
const formatDateSafe = (value: any) => {
    if (!value) return "—";
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleDateString('pt-BR');
    } catch {
        return "—";
    }
};

const sanitizeDigits = (value: string) => value.replace(/\D/g, '');

// ==========================================
// SCHEMAS E TIPOS
// ==========================================
import { EmpresaAtualizada } from '@/lib/types/financeiro';

const formSchema = z.object({
    nomeEmpresa: z.string().trim().min(2, "Nome da empresa é obrigatório").max(120),
    cnpj: z.string().min(14, "CNPJ precisa ter no mínimo 14 números"),
    nomeResponsavel: z.string().trim().min(2, "Nome do responsável é obrigatório").max(80),
    emailResponsavel: z.string().trim().toLowerCase().email("Email inválido"),
    whatsappResponsavel: z.string().min(10, "WhatsApp precisa ter no mínimo 10 números"),
    planoId: z.string().min(1, "ID do plano é obrigatório"),
    status: z.enum(["ATIVO", "SUSPENSO", "CANCELADO", "TRIAL_ATIVO"])
});

type FormValues = z.infer<typeof formSchema>;

export interface ModalEmpresaDetalhesProps {
    empresaId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdated: () => void;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function ModalEmpresaDetalhes({ empresaId, open, onOpenChange, onUpdated }: ModalEmpresaDetalhesProps) {
    const { toast } = useToast();

    // States Vitais
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [empresa, setEmpresa] = useState<EmpresaAtualizada | null>(null);

    // States Secundários Operacionais
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isStatusChanging, setIsStatusChanging] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [alertExcluirOpen, setAlertExcluirOpen] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);

    // States da Senha Temporária
    const [isDialogSenhaOpen, setIsDialogSenhaOpen] = useState(false);
    const [isSavingSenha, setIsSavingSenha] = useState(false);
    const [novaSenhaTemporaria, setNovaSenhaTemporaria] = useState("");
    const [confirmarSenhaTemporaria, setConfirmarSenhaTemporaria] = useState("");
    const [forcarTrocaSenha, setForcarTrocaSenha] = useState(true);
    const [erroSenha, setErroSenha] = useState("");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nomeEmpresa: '',
            cnpj: '',
            nomeResponsavel: '',
            emailResponsavel: '',
            whatsappResponsavel: '',
            planoId: '',
            status: 'ATIVO'
        }
    });

    const carregarEmpresa = async () => {
        if (!empresaId) return;

        setErro(null);
        setCarregando(true);
        if (process.env.NODE_ENV === 'development') {
            console.log("[ModalEmpresaDetalhes] carregando empresa:", empresaId);
        }

        try {
            const res = await fetchJSON<EmpresaAtualizada>(`/api/sistema/empresas/${empresaId}`);

            if (res.ok && res.data) {
                setEmpresa(res.data);
                form.reset({
                    nomeEmpresa: res.data.nome || '',
                    cnpj: formatarCNPJ(res.data.cnpj || ''),
                    nomeResponsavel: res.data.responsavelNome || '',
                    emailResponsavel: res.data.responsavelEmail || '',
                    whatsappResponsavel: formatarTelefoneBR(res.data.whatsappResponsavel || ''),
                    planoId: res.data.planoId || 'Starter',
                    status: (res.data.status as any) || 'ATIVO',
                });
            } else {
                setErro("Falha ao carregar empresa.");
                setEmpresa(null);
            }
        } catch (error: any) {
            console.error("[ModalEmpresaDetalhes] Catch Erro:", error);
            setErro(error.message || "Erro de conexão ao carregar detalhes da empresa.");
            setEmpresa(null);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        if (open && empresaId) {
            carregarEmpresa();
        } else if (!open) {
            // Limpa estado para não poluir proxima abertura
            setEmpresa(null);
            setErro(null);
            setCarregando(false);
            setIsEditing(false);
            setIsDialogSenhaOpen(false);
            setNovaSenhaTemporaria("");
            setConfirmarSenhaTemporaria("");
            setErroSenha("");
            form.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, empresaId]);

    const handleSalvar = async (data: FormValues) => {
        setIsSaving(true);
        try {
            // Limpa antes de enviar (mas z.string já envia puro, aqui ajudamos a garantir dígitos puros)
            const payloadLimpo = {
                nome: data.nomeEmpresa,
                responsavelNome: data.nomeResponsavel,
                responsavelEmail: data.emailResponsavel,
                planoId: data.planoId,
                status: data.status,
                cnpj: sanitizeDigits(data.cnpj),
                whatsappResponsavel: sanitizeDigits(data.whatsappResponsavel)
            };

            await fetchJSON(`/api/sistema/empresas/${empresaId}`, {
                method: 'PUT',
                body: JSON.stringify(payloadLimpo)
            });

            toast({ title: 'Sucesso', description: 'Empresa atualizada com sucesso.' });
            setIsEditing(false);
            carregarEmpresa();
            onUpdated();
        } catch (error: any) {
            const err = error as FetchJsonError;
            if (err.issues) {
                const detalhes = err.issues as Record<string, string[]>;
                Object.keys(detalhes).forEach((key) => {
                    form.setError(key as keyof FormValues, { message: detalhes[key][0] });
                });
            } else {
                toast({
                    title: 'Erro ao salvar',
                    description: err.message || 'Falha na atualização.',
                    variant: 'destructive'
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleMudarStatus = async (novoStatus: string) => {
        setIsStatusChanging(true);
        try {
            await fetchJSON(`/api/sistema/empresas/${empresaId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: novoStatus })
            });

            toast({ title: 'Status Atualizado', description: `O status mudou para ${novoStatus.replace('_', ' ')}.` });
            carregarEmpresa();
            onUpdated();
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message || 'Falha ao mudar status', variant: 'destructive' });
        } finally {
            setIsStatusChanging(false);
        }
    };

    const handleExcluir = async () => {
        setIsDeleting(true);
        try {
            await fetchJSON(`/api/sistema/empresas/${empresaId}`, {
                method: 'DELETE'
            });

            toast({ title: 'Excluída', description: 'Empresa removida (ou cancelada) com sucesso.' });
            setAlertExcluirOpen(false);
            onOpenChange(false);
            onUpdated();
        } catch (error: any) {
            toast({ title: 'Erro ao excluir', description: error.message || 'Falha na exclusão.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEnviarReset = async () => {
        if (!empresa || !empresaId) return;
        setIsSendingReset(true);
        try {
            const res = await fetchJSON<{ debugLink?: string }>('/api/sistema/empresas/enviar-reset-senha', {
                method: 'POST',
                body: JSON.stringify({
                    empresaId,
                    emailLogin: empresa.responsavelEmail,
                    nomeEmpresa: empresa.nome,
                    nomeResponsavel: empresa.responsavelNome,
                }),
            });

            if (!res.ok) {
                toast({ title: 'Erro', description: (res as any).message || 'Não foi possível enviar o e-mail.', variant: 'destructive' });
                return;
            }

            const debugLink = (res as any).debugLink;
            if (debugLink) {
                toast({
                    title: 'DEV — Link de redefinição',
                    description: 'Nenhum provedor de e-mail configurado. Copie o link abaixo.',
                    action: (
                        <button className="text-xs underline" onClick={() => navigator.clipboard.writeText(debugLink)}>Copiar link</button>
                    ) as any,
                    duration: 30000,
                });
                console.log(`\n[DEV RESET LINK para '${empresa.responsavelEmail}']:\n${debugLink}\n`);
            } else {
                toast({ title: 'E-mail enviado', description: `Link de redefinição enviado para ${empresa.responsavelEmail}.` });
            }
        } catch (error: any) {
            toast({ title: 'Erro inesperado', description: error?.message || 'Falha ao enviar.', variant: 'destructive' });
        } finally {
            setIsSendingReset(false);
        }
    };

    const handleSalvarSenhaTemporaria = async () => {
        setErroSenha("");
        if (novaSenhaTemporaria.length < 8) {
            setErroSenha("A senha precisa ter no mínimo 8 caracteres.");
            return;
        }
        if (novaSenhaTemporaria !== confirmarSenhaTemporaria) {
            setErroSenha("As senhas não coincidem.");
            return;
        }

        setIsSavingSenha(true);
        try {
            await fetchJSON('/api/sistema/empresas/definir-senha-temporaria', {
                method: 'POST',
                body: JSON.stringify({
                    empresaId,
                    novaSenha: novaSenhaTemporaria,
                    forcarTrocaSenha
                })
            });

            toast({
                title: "Senha temporária definida",
                description: "O usuário deverá alterar a senha no próximo login.",
                action: (
                    <button className="text-xs underline bg-background/50 p-1 rounded font-mono" onClick={() => navigator.clipboard.writeText(novaSenhaTemporaria)}>
                        Copiar Senha
                    </button>
                ) as any,
                duration: 20000,
            });
            setIsDialogSenhaOpen(false);
            setNovaSenhaTemporaria("");
            setConfirmarSenhaTemporaria("");
            setForcarTrocaSenha(true);
        } catch (error: any) {
            setErroSenha(error.message || "Erro ao definir senha temporária.");
        } finally {
            setIsSavingSenha(false);
        }
    };

    const badgeVariant = (status: string) => {
        if (['ATIVO', 'TRIAL_ATIVO'].includes(status)) return 'default';
        if (status === 'SUSPENSO') return 'secondary';
        return 'destructive'; // CANCELADO
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[980px] w-[95vw] p-0 overflow-hidden flex flex-col max-h-[90vh]">

                    {/* 1 - HEADER FIXO */}
                    <div className="px-6 py-4 border-b flex flex-row items-center justify-between bg-card text-card-foreground shrink-0 shadow-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl m-0 leading-none">
                                <Building2 className="h-6 w-6 text-primary flex-shrink-0" />
                                <span className="truncate">
                                    {carregando ? 'Carregando detalhes...' : (empresa?.nome || 'Detalhes da Empresa')}
                                </span>
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Visualização e edição dos detalhes da empresa (ID: {empresaId})
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {/* 2 - BODY COM SCROLL INTERNAL */}
                    <div className="px-6 py-5 overflow-y-auto flex-1 bg-muted/10 relative">
                        {carregando ? (
                            <div className="space-y-4 max-w-lg">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-[85%]" />
                                <Skeleton className="h-4 w-[70%]" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                                    <Skeleton className="h-32 w-full rounded-lg" />
                                    <Skeleton className="h-32 w-full rounded-lg" />
                                </div>
                            </div>
                        ) : erro ? (
                            <div className="flex justify-center py-6">
                                <Card className="border-destructive/50 bg-destructive/5 shadow-sm max-w-sm w-full">
                                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                                        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                                        <h3 className="text-lg font-semibold text-destructive mb-2 leading-tight">Não foi possível carregar</h3>
                                        <p className="text-sm text-destructive/80 mb-6">{erro}</p>
                                        <Button variant="outline" size="sm" onClick={carregarEmpresa}>Tentar Novamente</Button>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : !empresa ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground w-full h-full">
                                <Building2 className="h-16 w-16 mb-4 opacity-10" />
                                <p className="font-medium text-lg text-foreground/80">Empresa não identificada</p>
                                <p className="text-sm mt-1">Este ID não retornou resultados. Talvez já tenha sido excluído.</p>
                            </div>
                        ) : (
                            // Renderização do CONTEÚDO REAL DA EMPRESA
                            !isEditing ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* GRID de 2 colunas para organização massiva de dados */}
                                    <div className="grid gap-6 md:grid-cols-2">

                                        {/* SEÇÃO GERAL */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Geral</h4>
                                            <div className="space-y-4 text-sm bg-card p-4 rounded-lg border shadow-sm">
                                                <div>
                                                    <p className="text-muted-foreground mb-1 text-xs">Nome Fantasia</p>
                                                    <p className="font-semibold text-base text-foreground truncate">{empresa.nome}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs"><Hash className="h-3 w-3" /> CNPJ</p>
                                                        <p className="font-medium">{formatarCNPJ(empresa.cnpj || '')}</p>
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs"><Hash className="h-3 w-3" /> ID do Sistema</p>
                                                        <p className="font-mono text-[11px] truncate text-muted-foreground p-1 bg-muted rounded inline-block max-w-full" title={empresa.id}>{empresa.id}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SEÇÃO RESPONSÁVEL */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 flex items-center gap-1.5"><Mail className="h-4 w-4" /> Contato & Responsável</h4>
                                            <div className="space-y-4 text-sm bg-card p-4 rounded-lg border shadow-sm">
                                                <div>
                                                    <p className="text-muted-foreground mb-1 text-xs">Nome do Administrador</p>
                                                    <p className="font-semibold text-base">{empresa.responsavelNome || "—"}</p>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="overflow-hidden">
                                                        <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs"><Mail className="h-3 w-3" /> E-mail (Login)</p>
                                                        <p className="font-medium text-primary hover:underline cursor-pointer truncate" title={empresa.responsavelEmail}>{empresa.responsavelEmail || "—"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs"><Phone className="h-3 w-3" /> WhatsApp</p>
                                                        <p className="font-medium">{formatarTelefoneBR(empresa.whatsappResponsavel || '') || "—"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SEÇÃO PLANO / STATUS */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> Assinatura Atual</h4>
                                            <div className="space-y-4 text-sm bg-card p-4 rounded-lg border shadow-sm">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">Status do Tenant</p>
                                                        <Badge variant={badgeVariant(empresa.status)} className="font-semibold">{empresa.status.replace('_', ' ')}</Badge>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs"><Banknote className="h-3 w-3" /> Plano</p>
                                                        <p className="font-bold text-base">{empresa.planoNome || empresa.planoId || "—"}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground mb-1 text-xs">Licença / Expiração Trial</p>
                                                    <p className="font-medium text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded border border-emerald-100">{empresa.diasTrial || 0} dias restantes</p>
                                                </div>

                                                <div className="pt-3 mt-1 border-t border-dashed">
                                                    <p className="text-[10px] text-muted-foreground mb-2 uppercase font-medium">Controle de Status Rápido</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 h-8 px-3 text-xs"
                                                            onClick={() => handleMudarStatus('ATIVO')}
                                                            disabled={isStatusChanging || empresa.status === 'ATIVO'}
                                                        >
                                                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Ativar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-warning text-warning hover:bg-warning/10 h-8 px-3 text-xs"
                                                            onClick={() => handleMudarStatus('SUSPENSO')}
                                                            disabled={isStatusChanging || empresa.status === 'SUSPENSO'}
                                                        >
                                                            <PauseCircle className="mr-1.5 h-3.5 w-3.5" /> Suspender
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-destructive text-destructive hover:bg-destructive/10 h-8 px-3 text-xs"
                                                            onClick={() => handleMudarStatus('CANCELADO')}
                                                            disabled={isStatusChanging || empresa.status === 'CANCELADO'}
                                                        >
                                                            <XCircle className="mr-1.5 h-3.5 w-3.5" /> Cancelar
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SEÇÃO DATAS */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Sistema Log</h4>
                                            <div className="space-y-4 text-sm bg-card p-4 rounded-lg border shadow-sm">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">Provisionamento</p>
                                                        <p className="font-medium text-base">{formatDateSafe(empresa.criadoEm)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">Último Update</p>
                                                        <p className="font-medium text-base">{formatDateSafe(empresa.atualizadoEm)}</p>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                        {/* SEÇÃO ACESSO / SEGURANÇA */}
                                        <div className="space-y-4 md:col-span-2">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 flex items-center gap-1.5"><KeyRound className="h-4 w-4" /> Acesso / Segurança</h4>
                                            <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                                                <div>
                                                    <p className="text-sm font-medium">Redefinição de Senha</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Envia um link de redefinição para o e-mail do responsável: <strong>{empresa.responsavelEmail || "—"}</strong></p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleEnviarReset}
                                                    disabled={isSendingReset || !empresa.responsavelEmail}
                                                    className="shrink-0 ml-4"
                                                >
                                                    <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                                                    {isSendingReset ? 'Enviando...' : 'Enviar redefinição'}
                                                </Button>
                                            </div>

                                            <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                                                <div>
                                                    <p className="text-sm font-medium">Definir Senha Temporária</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Use apenas em situações de suporte ou primeiro acesso. O usuário Master (<strong title={empresa.responsavelEmail}>{empresa.responsavelNome || "—"}</strong>) será forçado a trocá-la logo após entrar.</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setIsDialogSenhaOpen(true)}
                                                    className="shrink-0 ml-4 border"
                                                >
                                                    Definir senha
                                                </Button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ) : (
                                // MODO DE EDIÇÃO DO FORMULÁRIO (PUT)
                                <div className="animate-in fade-in slide-in-from-right-2 duration-300 relative">
                                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-semibold text-primary">Modo de Edição</p>
                                            <p className="text-muted-foreground mt-1">Altere apenas os dados necessários. O perfil de administrador associado não terá a senha trocada por aqui, apenas o e-mail formal.</p>
                                        </div>
                                    </div>

                                    <form id="form-editar-empresa" onSubmit={form.handleSubmit(handleSalvar)} className="space-y-5 bg-card border rounded-lg p-5 shadow-sm">
                                        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="nomeEmpresa">Nome Fantasia / Entidade Legal</Label>
                                                <Input id="nomeEmpresa" {...form.register('nomeEmpresa')} placeholder="Minha Loja..." />
                                                {form.formState.errors.nomeEmpresa && <p className="text-xs text-destructive font-medium">{form.formState.errors.nomeEmpresa.message}</p>}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="cnpj">CNPJ Oficial</Label>
                                                <Input
                                                    id="cnpj"
                                                    placeholder="00.000.000/0000-00"
                                                    value={form.watch('cnpj')}
                                                    onChange={(e) => form.setValue('cnpj', formatarCNPJ(e.target.value))}
                                                />
                                                {form.formState.errors.cnpj && <p className="text-xs text-destructive font-medium">{form.formState.errors.cnpj.message}</p>}
                                            </div>
                                            <div className="md:col-span-2 border-t pt-2 my-1"></div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="nomeResponsavel">Nome do Proprietário/Responsável</Label>
                                                <Input id="nomeResponsavel" {...form.register('nomeResponsavel')} />
                                                {form.formState.errors.nomeResponsavel && <p className="text-xs text-destructive font-medium">{form.formState.errors.nomeResponsavel.message}</p>}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="whatsappResponsavel">Número do WhatsApp (Contato Oficial)</Label>
                                                <Input
                                                    id="whatsappResponsavel"
                                                    placeholder="(00) 00000-0000"
                                                    value={form.watch('whatsappResponsavel')}
                                                    onChange={(e) => form.setValue('whatsappResponsavel', formatarTelefoneBR(e.target.value))}
                                                />
                                                {form.formState.errors.whatsappResponsavel && <p className="text-xs text-destructive font-medium">{form.formState.errors.whatsappResponsavel.message}</p>}
                                            </div>
                                            <div className="grid gap-2 md:col-span-2">
                                                <Label htmlFor="emailResponsavel">E-mail de Login do Administrador</Label>
                                                <Input id="emailResponsavel" type="email" {...form.register('emailResponsavel')} />
                                                {form.formState.errors.emailResponsavel && <p className="text-xs text-destructive font-medium">{form.formState.errors.emailResponsavel.message}</p>}
                                            </div>
                                            <div className="md:col-span-2 border-t pt-2 my-1"></div>
                                            <div className="grid gap-2">
                                                <Label>Aceleração / Status Base (Manual)</Label>
                                                <Select value={form.watch('status')} onValueChange={(val: any) => form.setValue('status', val)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Estado atual" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="TRIAL_ATIVO">Trial Ativo</SelectItem>
                                                        <SelectItem value="ATIVO">Conta Paga e Ativa</SelectItem>
                                                        <SelectItem value="SUSPENSO">Pagamento Suspenso</SelectItem>
                                                        <SelectItem value="CANCELADO">Cancelado / Rompido</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Degrau do Plano Vinculado</Label>
                                                <Select value={form.watch('planoId')} onValueChange={(val) => form.setValue('planoId', val)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Nível da licença" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Starter">Starter (Básico)</SelectItem>
                                                        <SelectItem value="Pro">Pro (Intermediário)</SelectItem>
                                                        <SelectItem value="Enterprise">Enterprise (Avançado)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )
                        )}
                    </div>

                    {/* 3 - FOOTER FIXO */}
                    <div className="px-6 py-4 border-t flex flex-col-reverse sm:flex-row justify-between items-center bg-muted/30 shrink-0 gap-3 sm:gap-0 mt-auto z-10">
                        <div className="w-full sm:w-auto">
                            {empresa && !isEditing && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                                    onClick={() => setAlertExcluirOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Esquecer Conta
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            {isEditing ? (
                                <>
                                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none">
                                        Descartar
                                    </Button>
                                    <Button type="submit" form="form-editar-empresa" disabled={isSaving} className="flex-1 sm:flex-none">
                                        {isSaving ? 'Aplicando...' : 'Aplicar Alterações'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {empresa ? (
                                        <>
                                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                                                Dispensar
                                            </Button>
                                            <Button type="button" onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none bg-primary text-primary-foreground">
                                                <Edit2 className="h-4 w-4 mr-2" />
                                                Corrigir Dados
                                            </Button>
                                        </>
                                    ) : (
                                        <Button type="button" onClick={() => onOpenChange(false)} className="w-full">
                                            Fechar
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CONFIRMAR EXCLUSÃO CRÍTICA (Soft-delete ou Hard-delete) */}
            <AlertDialog open={alertExcluirOpen} onOpenChange={setAlertExcluirOpen}>
                <AlertDialogContent className="border-destructive/30">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" /> Você tem certeza absoluta?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-foreground/80">
                            A remoção (ou inativação lógica) suspende a empresa <strong className="text-foreground">{empresa?.nome}</strong>. Dívidas correntes podem ser arquivadas ou perdidas. Confirme que deseja isolar este locatário e impedir o fluxo financeiro atrelado à conta original.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={isDeleting}>Recuar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleExcluir}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Erradicando...' : 'Excluir definitivamente'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* MODAL DEFINIR SENHA TEMPORARIA */}
            <Dialog open={isDialogSenhaOpen} onOpenChange={setIsDialogSenhaOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Definir Senha Temporária</DialogTitle>
                        <DialogDescription>
                            Configure uma senha provisória de acesso. O Gestor será obrigado a alterá-la obrigatoriamente no próximo acesso à plataforma.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="novaSenha">Nova Senha Temporária</Label>
                            <Input
                                id="novaSenha"
                                type="text"
                                value={novaSenhaTemporaria}
                                onChange={(e) => setNovaSenhaTemporaria(e.target.value)}
                                placeholder="Mínimo de 8 caracteres alfanuméricos"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                            <Input
                                id="confirmarSenha"
                                type="text"
                                value={confirmarSenhaTemporaria}
                                onChange={(e) => setConfirmarSenhaTemporaria(e.target.value)}
                                placeholder="Mínimo de 8 caracteres alfanuméricos"
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="forcarTroca"
                                checked={forcarTrocaSenha}
                                onCheckedChange={(checked) => setForcarTrocaSenha(checked as boolean)}
                            />
                            <Label htmlFor="forcarTroca" className="font-normal cursor-pointer text-sm">
                                Obrigar troca de senha no próximo login
                            </Label>
                        </div>

                        {erroSenha && <p className="text-sm font-medium text-destructive">{erroSenha}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="ghost" onClick={() => setIsDialogSenhaOpen(false)}>Cancelar</Button>
                        <Button disabled={isSavingSenha} onClick={handleSalvarSenhaTemporaria}>
                            {isSavingSenha ? "Salvando..." : "Salvar senha"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
