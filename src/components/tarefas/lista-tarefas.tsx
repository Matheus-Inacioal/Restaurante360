import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle2, Circle, Clock, FileText, Check, Copy, AlertTriangle, Loader2, PartyPopper } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Tarefa } from "@/lib/types/tarefas";

interface ListaTarefasProps {
    tarefas: Tarefa[];
    idTarefaSelecionada: string | null;
    isCarregando: boolean; // Estado de rede 
    erro: string | null; // Estado de rede
    vazio: boolean;
    aoSelecionarTarefa: (id: string) => void;
    aoDuplicarTarefa?: (tarefa: Tarefa) => void;
    aoConcluirTarefa?: (id: string) => void;
    aoExcluirTarefa?: (id: string) => void;
}

export function ListaTarefas({ tarefas, idTarefaSelecionada, isCarregando, erro, vazio, aoSelecionarTarefa, aoDuplicarTarefa, aoConcluirTarefa, aoExcluirTarefa }: ListaTarefasProps) {

    /** =========================
     * INJEÇÃO DOS 4 ESTADOS UI 
     * ========================= **/

    if (isCarregando) {
        return (
            <Card className="h-full bg-muted/10 border-none flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60 mb-4" />
                <p className="text-muted-foreground font-medium">Buscando tarefas no servidor...</p>
            </Card>
        );
    }

    if (erro) {
        return (
            <Card className="h-full bg-destructive/5 border-destructive/20 border-dashed flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <div className="p-4 bg-destructive/10 rounded-full mb-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="font-medium text-lg text-foreground mb-1">Falha de Instância</h3>
                <p className="text-muted-foreground text-sm max-w-[250px]">{erro}</p>
                <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>Tentar Novamente</Button>
            </Card>
        );
    }

    if (vazio) {
        return (
            <Card className="h-full bg-muted/10 border-dashed flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <PartyPopper className="h-8 w-8 text-primary/80" />
                </div>
                <h3 className="font-medium text-lg text-foreground mb-1">Tudo Limpo!</h3>
                <p className="text-muted-foreground text-sm max-w-[250px]">Nenhuma operação pendente nesta aba ou filtro.</p>
            </Card>
        );
    }


    /** =========================
     * RENDERIZAÇÃO DE TAREFA ATIVA
     * ========================= **/

    // Helper para renderizar Badge de Status Pt-BR
    const renderBadgeStatus = (status: string) => {
        switch (status) {
            case "atrasada":
                return <Badge variant="destructive" className="text-[10px] h-5">Atrasada</Badge>;
            case "concluida":
                return <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">Concluída</Badge>;
            case "em_progresso":
                return <Badge variant="secondary" className="text-[10px] h-5 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400">Em progresso</Badge>;
            default:
                return <Badge variant="secondary" className="text-[10px] h-5 text-muted-foreground">Pendente</Badge>;
        }
    };

    // Helper para renderizar a prioridade
    const renderPrioridade = (prioridade: string) => {
        switch (prioridade) {
            case "Alta":
                return <div className="flex items-center text-xs text-destructive font-medium"><div className="w-1.5 h-1.5 rounded-full bg-destructive mr-1.5" />Alta</div>;
            case "Média":
                return <div className="flex items-center text-xs text-orange-500 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5" />Média</div>;
            default:
                return <div className="flex items-center text-xs text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-1.5" />Baixa</div>;
        }
    };

    return (
        <div className="space-y-3">
            {tarefas.map((tarefa) => (
                <Card
                    key={tarefa.id}
                    className={`cursor-pointer transition-all hover:bg-muted/40 ${idTarefaSelecionada === tarefa.id ? "ring-2 ring-primary border-primary bg-muted/20" : "bg-card"
                        }`}
                    onClick={() => aoSelecionarTarefa(tarefa.id)}
                >
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                        {/* Lado Esquerdo do Card */}
                        <div className="flex items-start gap-4">
                            <div className="mt-1 shrink-0">
                                {tarefa.status === "concluida" ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                ) : tarefa.status === "atrasada" ? (
                                    <Clock className="h-5 w-5 text-destructive" />
                                ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h4 className={`font-semibold text-base leading-none ${tarefa.status === "concluida" && "line-through text-muted-foreground/60"}`}>
                                        {tarefa.titulo}
                                    </h4>
                                    {tarefa.tipo === "checklist" && (
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-muted/30">
                                            <FileText className="h-3 w-3 mr-1" /> Checklist ({tarefa.itensVerificacao?.length || 0})
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    {renderBadgeStatus(tarefa.status)}
                                    {renderPrioridade(tarefa.prioridade)}

                                    {tarefa.prazo && (
                                        <div className="flex items-center gap-1 font-medium bg-muted/50 px-1.5 rounded-md text-foreground">
                                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <span className="truncate max-w-[120px]">{tarefa.prazo}</span>
                                        </div>
                                    )}
                                    <div className="hidden sm:block opacity-60">•</div>
                                    <span className="font-medium text-foreground/80 truncate max-w-[100px]">{tarefa.responsavel || "Sem responsável"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Ações (Lado Direito do Card) */}
                        <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-4" onClick={(e) => e.stopPropagation()}>
                            {tarefa.status !== "concluida" && (
                                <Button variant="ghost" size="sm" className="hidden sm:flex h-8 w-8 p-0" title="Marcar como Concluída" onClick={() => aoConcluirTarefa?.(tarefa.id)}>
                                    <Check className="h-4 w-4 text-primary" />
                                </Button>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuItem>Editar</DropdownMenuItem>
                                    <DropdownMenuItem>Reatribuir</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => aoDuplicarTarefa?.(tarefa)}>
                                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => aoExcluirTarefa?.(tarefa.id)}>
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
