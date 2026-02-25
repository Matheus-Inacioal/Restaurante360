import { X, Calendar, User, Tag, Clock, CheckCircle2, Paperclip, MessageSquare, FileText } from "lucide-react";
import type { Tarefa } from "@/lib/types/tarefas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface PainelDetalhesTarefaProps {
    tarefa: Tarefa | null;
    aoFechar?: () => void;
    aoAlternarItemChecklist?: (idTarefa: string, idItem: string, concluido: boolean) => void;
    aoConcluirTarefa?: (idTarefa: string) => void;
}

export function PainelDetalhesTarefa({ tarefa, aoFechar, aoAlternarItemChecklist, aoConcluirTarefa }: PainelDetalhesTarefaProps) {
    if (!tarefa) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-muted/10 border border-dashed rounded-xl">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Nenhuma tarefa em foco</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                    Selecione um item na lista ao lado para ver operações e detalhes.
                </p>
            </div>
        );
    }

    // Calcula andamento se for checklist
    const totalItens = tarefa.itensVerificacao?.length || 0;
    const itensConcluidos = tarefa.itensVerificacao?.filter((i) => i.concluido).length || 0;
    const progresso = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;

    return (
        <div className="h-full bg-card border rounded-xl shadow-sm flex flex-col overflow-hidden relative">

            {/* TOPO FIXO (HEADER DO PAINEL) */}
            <div className="p-4 border-b flex items-start justify-between bg-muted/5 sticky top-0 z-10">
                <div className="space-y-1 pr-4">
                    <Badge variant={tarefa.status === "concluida" ? "default" : tarefa.status === "atrasada" ? "destructive" : "secondary"} className="mb-2">
                        {tarefa.status === "concluida" ? "Concluída" : tarefa.status === "em_progresso" ? "Em andamento" : tarefa.status === "atrasada" ? "Atrasada" : "Pendente"}
                    </Badge>
                    <h2 className="text-xl font-bold leading-tight">{tarefa.titulo}</h2>
                </div>
                {aoFechar && (
                    <Button variant="ghost" size="icon" onClick={aoFechar} className="h-8 w-8 shrink-0 hover:bg-muted" title="Fechar painel">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* ÁREA DE SCROLL (CONTEÚDO) */}
            <ScrollArea className="flex-1">
                <div className="p-4 md:p-5 space-y-6">

                    {/* Metadados: Responsável, Prazo, Prioridade, Tags */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-foreground/80">
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-medium">Responsável</span>
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <User className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="font-medium truncate">{tarefa.responsavel || "Não atribuído"}</span>
                            </div>
                        </div>

                        {tarefa.prazo && (
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs font-medium">Prazo Estimado</span>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="font-medium truncate">{tarefa.prazo}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs font-medium">Criado Em</span>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="">{new Date(tarefa.criadoEm).toLocaleDateString("pt-BR")}</span>
                            </div>
                        </div>

                        {tarefa.tags && tarefa.tags.length > 0 && (
                            <div className="flex flex-col gap-1 col-span-2 mt-1">
                                <span className="text-muted-foreground text-xs font-medium flex items-center gap-1.5 mb-1">
                                    <Tag className="h-3.5 w-3.5" /> Contexto (Tags)
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {tarefa.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="font-normal text-xs bg-muted/60">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator className="opacity-60" />

                    {/* Descrição Longa */}
                    {tarefa.descricao && (
                        <div className="space-y-2.5">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" /> Detalhes ou SOP
                            </h3>
                            <div className="text-sm text-muted-foreground leading-relaxed bg-muted/10 p-3 rounded-lg border border-transparent hover:border-border/50 transition-colors">
                                {tarefa.descricao}
                            </div>
                        </div>
                    )}

                    {/* Checklist Interativo */}
                    {tarefa.tipo === "checklist" && tarefa.itensVerificacao && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                    Critérios de Execução
                                </h3>
                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {itensConcluidos} de {totalItens}
                                </span>
                            </div>

                            {/* Barra de Progresso visual */}
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500 ease-in-out"
                                    style={{ width: `${progresso}%` }}
                                />
                            </div>

                            <div className="space-y-2.5 mt-2">
                                {tarefa.itensVerificacao.map((item) => (
                                    <div key={item.id} className="flex items-start space-x-3 bg-muted/10 p-2.5 rounded-lg border border-transparent hover:border-border transition-colors group">
                                        <Checkbox
                                            id={item.id}
                                            checked={item.concluido}
                                            onCheckedChange={(checked) => aoAlternarItemChecklist?.(tarefa.id, item.id, checked as boolean)}
                                            className="mt-0.5"
                                        />
                                        <label
                                            htmlFor={item.id}
                                            className={`text-sm font-medium leading-tight select-none cursor-pointer flex-1 transition-all ${item.concluido ? 'text-muted-foreground line-through opacity-70' : 'text-foreground group-hover:text-primary'}`}
                                        >
                                            {item.texto}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Áreas Placeholders (Anexos e Comentários do plano futuro) */}
                    <Separator className="opacity-60" />

                    <div className="grid grid-cols-2 gap-4 pb-4">
                        <Button variant="outline" className="w-full justify-start h-9 text-muted-foreground hover:text-foreground">
                            <Paperclip className="h-4 w-4 mr-2" /> Anexar Prova
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-9 text-muted-foreground hover:text-foreground">
                            <MessageSquare className="h-4 w-4 mr-2" /> Adicionar Nota
                        </Button>
                    </div>

                </div>
            </ScrollArea>

            {/* FOOTER FIXO (AÇÃO PRINCIPAL) */}
            <div className="p-4 border-t bg-muted/10 shrink-0">
                {tarefa.status === "concluida" ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium py-2 bg-green-500/10 rounded-lg">
                        <CheckCircle2 className="h-4 w-4" />
                        Validada em {new Date(tarefa.atualizadoEm).toLocaleDateString('pt-BR')}
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 bg-background hover:bg-muted">Suspender</Button>
                        <Button className="flex-1" onClick={() => aoConcluirTarefa?.(tarefa.id)} disabled={progresso < 100 && tarefa.tipo === "checklist"}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Finalizar {tarefa.tipo === 'checklist' ? 'Checklist' : 'Tarefa'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
