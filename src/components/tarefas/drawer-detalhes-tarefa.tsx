"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTarefas } from "@/hooks/use-tarefas";
import type { Tarefa, StatusTarefa } from "@/lib/types/tarefas";
import { CheckCircle2, Copy, ExternalLink, Calendar as CalendarIcon, User, Tag, LayoutList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DrawerDetalhesTarefaProps {
    aberta: boolean;
    aoFechar: () => void;
    tarefaSelecionada: Tarefa | null;
}

const MOCK_USUARIOS = [
    { id: "user_matheus_99", nome: "Matheus Almeida" },
    { id: "user_joao_12", nome: "João Silva" },
    { id: "user_maria_34", nome: "Maria Oliveira" },
];

export function DrawerDetalhesTarefa({ aberta, aoFechar, tarefaSelecionada: tarefa }: DrawerDetalhesTarefaProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { atualizarTarefa, atualizarStatusTarefa, adicionarTarefa } = useTarefas();

    if (!tarefa) {
        return (
            <Sheet open={aberta} onOpenChange={(open) => !open && aoFechar()}>
                <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Detalhes da Tarefa</SheetTitle>
                        <SheetDescription>Nenhuma tarefa está selecionada no momento.</SheetDescription>
                    </SheetHeader>
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Nenhuma tarefa selecionada.</p>
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    const { itensVerificacao = [] } = tarefa;
    const itensConcluidos = itensVerificacao.filter(i => i.concluido).length;
    const totalItens = itensVerificacao.length;
    const progressoChecklist = totalItens > 0 ? (itensConcluidos / totalItens) * 100 : 0;

    const handleAtualizarStatus = async (novoStatus: string) => {
        try {
            await atualizarStatusTarefa(tarefa.id, novoStatus as StatusTarefa);
        } catch (error) {
            // Erro já é tratado no hook
        }
    };

    const handleAtualizarPrioridade = async (novaPrioridade: string) => {
        try {
            await atualizarTarefa(tarefa.id, { prioridade: novaPrioridade as "Alta" | "Média" | "Baixa" });
            toast({ title: "Prioridade atualizada", description: "A prioridade da tarefa foi alterada." });
        } catch (error) { }
    };

    const handleAtualizarResponsavel = async (novoResponsavel: string) => {
        try {
            await atualizarTarefa(tarefa.id, { responsavel: novoResponsavel });
            toast({ title: "Responsável atualizado", description: "O responsável pela tarefa foi alterado." });
        } catch (error) { }
    };

    const handleAtualizarPrazo = async (novoPrazo: string) => {
        try {
            // Se o usuário apagar o input de data, ele enviará string vazia
            await atualizarTarefa(tarefa.id, { prazo: novoPrazo || undefined });
            toast({ title: "Prazo atualizado", description: "O prazo da tarefa foi alterado." });
        } catch (error) { }
    };

    const handleConcluir = async () => {
        try {
            await atualizarStatusTarefa(tarefa.id, "concluida");
            aoFechar(); // Opcional fechar após concluir
        } catch (error) { }
    };

    const handleDuplicar = async () => {
        try {
            await adicionarTarefa({
                titulo: `[Cópia] ${tarefa.titulo}`,
                descricao: tarefa.descricao,
                tipo: tarefa.tipo,
                status: "pendente",
                prioridade: tarefa.prioridade,
                responsavel: tarefa.responsavel,
                prazo: tarefa.prazo,
                tags: tarefa.tags,
                itensVerificacao: tarefa.itensVerificacao?.map(i => ({ ...i, concluido: false })),
            });
            aoFechar(); // Pode fechar pra focar na nova (que vai aparecer no dashboard se for pra hoje)
        } catch (error) { }
    };

    const handleAbrirTelaTarefas = () => {
        // Redireciona e opcionalmente pode passar query param pra abrir a task lá
        router.push(`/dashboard/tarefas?tarefaId=${tarefa.id}`);
        aoFechar();
    };

    // Atualiza um item do checklist
    const handleToggleChecklistItem = async (itemId: string, concluido: boolean) => {
        const novosItens = tarefa.itensVerificacao?.map(item =>
            item.id === itemId ? { ...item, concluido } : item
        );
        try {
            await atualizarTarefa(tarefa.id, { itensVerificacao: novosItens });
        } catch (error) { }
    };

    const corStatus = {
        pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        em_progresso: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        concluida: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        atrasada: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };

    const corPrioridade = {
        Alta: "border-red-500 text-red-600",
        Média: "border-orange-500 text-orange-600",
        Baixa: "border-blue-500 text-blue-600",
    };

    return (
        <Sheet open={aberta} onOpenChange={(open) => !open && aoFechar()}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <SheetTitle className="text-xl pr-6">{tarefa.titulo}</SheetTitle>
                            <SheetDescription className="mt-1 flex items-center gap-2">
                                <Badge variant="outline" className={`font-normal ${corStatus[tarefa.status]}`}>
                                    {tarefa.status.replace("_", " ")}
                                </Badge>
                                <Badge variant="outline" className={`font-normal ${corPrioridade[tarefa.prioridade]}`}>
                                    {tarefa.prioridade}
                                </Badge>
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="space-y-6 py-4">
                        {/* AÇÕES PRINCIPAIS */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="default"
                                className="w-full"
                                onClick={handleConcluir}
                                disabled={tarefa.status === "concluida"}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {tarefa.status === "concluida" ? "Concluída" : "Concluir"}
                            </Button>
                            <Button variant="outline" className="w-full" onClick={handleAbrirTelaTarefas}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Tela cheia
                            </Button>
                        </div>

                        {/* DETALHES GERAIS */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                                <LabelIcon icon={LayoutList} label="Status" />
                                <Select value={tarefa.status} onValueChange={handleAtualizarStatus}>
                                    <SelectTrigger className="h-8 text-sm">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="em_progresso">Em Progresso</SelectItem>
                                        <SelectItem value="concluida">Concluída</SelectItem>
                                        <SelectItem value="atrasada">Atrasada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                                <LabelIcon icon={Tag} label="Prioridade" />
                                <Select value={tarefa.prioridade} onValueChange={handleAtualizarPrioridade}>
                                    <SelectTrigger className="h-8 text-sm">
                                        <SelectValue placeholder="Prioridade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Alta">Alta</SelectItem>
                                        <SelectItem value="Média">Média</SelectItem>
                                        <SelectItem value="Baixa">Baixa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                                <LabelIcon icon={User} label="Responsável" />
                                <Select value={tarefa.responsavel || ""} onValueChange={handleAtualizarResponsavel}>
                                    <SelectTrigger className="h-8 text-sm">
                                        <SelectValue placeholder="Atribuir..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MOCK_USUARIOS.map(u => (
                                            <SelectItem key={u.id} value={u.nome}>{u.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                                <LabelIcon icon={CalendarIcon} label="Prazo" />
                                {/* Renderizando o date input como um calendário nativo simplificado */}
                                <Input
                                    type="date"
                                    value={tarefa.prazo ? tarefa.prazo.substring(0, 10) : ""}
                                    onChange={(e) => handleAtualizarPrazo(e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>

                        {/* DESCRIÇÃO */}
                        {tarefa.descricao && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Descrição</h4>
                                <div className="text-sm text-muted-foreground p-3 bg-muted/40 rounded-md border whitespace-pre-wrap">
                                    {tarefa.descricao}
                                </div>
                            </div>
                        )}

                        {/* ORIGEM */}
                        {tarefa.origem && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Origem: {tarefa.origem.tipo === 'rotina' ? 'Rotina Diária' : 'Processo'}
                                </h4>
                            </div>
                        )}

                        {/* CHECKLIST */}
                        {tarefa.tipo === "checklist" && totalItens > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Itens ({itensConcluidos}/{totalItens})</h4>
                                    <span className="text-xs text-muted-foreground">{Math.round(progressoChecklist)}%</span>
                                </div>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                                    {itensVerificacao.map((item) => (
                                        <div key={item.id} className="flex items-start space-x-2 p-2 rounded hover:bg-muted/50 transition-colors">
                                            <Checkbox
                                                id={`item-${item.id}`}
                                                checked={item.concluido}
                                                onCheckedChange={(checked) => handleToggleChecklistItem(item.id, checked as boolean)}
                                            />
                                            <label
                                                htmlFor={`item-${item.id}`}
                                                className={`text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mt-0.5 ${item.concluido ? 'line-through text-muted-foreground' : ''}`}
                                            >
                                                {item.texto}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAGS */}
                        {tarefa.tags && tarefa.tags.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Tags</h4>
                                <div className="flex flex-wrap gap-1">
                                    {tarefa.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs font-normal">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-muted/10 shrink-0">
                    <Button variant="outline" className="w-full text-muted-foreground" onClick={handleDuplicar}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar Tarefa
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Helper componente
function LabelIcon({ icon: Icon, label }: { icon: any, label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </div>
    );
}
