"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, PlayCircle, Clock, CheckSquare, ListChecks, CalendarSync, Activity, Tag as TagIcon, Hash, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Rotina, GeracaoRotinaDiaria } from "@/lib/types/rotinas";

interface PainelDetalhesRotinaProps {
    rotina: Rotina | null;
    aoFechar: () => void;
    aoGerarTarefaManual: (rotina: Rotina) => void;
    isGerando: boolean; // para feedback de loading no botão
    historico?: GeracaoRotinaDiaria[];
}

export function PainelDetalhesRotina({ rotina, aoFechar, aoGerarTarefaManual, isGerando, historico = [] }: PainelDetalhesRotinaProps) {
    if (!rotina) return null;

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden ring-1 ring-border/50 animate-in slide-in-from-right-8 duration-300">
            {/* Cabecalho do Painel */}
            <div className="flex-none flex items-center justify-between p-4 border-b bg-muted/10 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-primary/10" />

                <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg ${rotina.ativa ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-500"}`}>
                        <Activity className="w-4 h-4" />
                    </span>
                    <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            Detalhes da Rotina
                            <Badge variant={rotina.ativa ? "default" : "secondary"} className={rotina.ativa ? "bg-emerald-500 hover:bg-emerald-600 text-[10px] h-4 py-0" : "text-[10px] h-4 py-0"}>
                                {rotina.ativa ? "ATIVA" : "INATIVA"}
                            </Badge>
                        </h2>
                    </div>
                </div>

                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0" onClick={aoFechar}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-5 space-y-6">
                    {/* Infos Primárias */}
                    <div className="space-y-2">
                        <h1 className="text-xl md:text-2xl font-bold leading-tight flex items-start gap-2">
                            {rotina.titulo}
                        </h1>
                        {rotina.descricao && (
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {rotina.descricao}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-background flex items-center gap-1.5 py-1">
                            {rotina.tipoTarefaGerada === "checklist" ? (
                                <><ListChecks className="w-3.5 h-3.5 text-blue-500" /> Gera Checklist</>
                            ) : (
                                <><CheckSquare className="w-3.5 h-3.5 text-emerald-500" /> Gera Tarefa</>
                            )}
                        </Badge>
                        <Badge variant="outline" className="bg-background flex items-center gap-1.5 py-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {rotina.horarioPreferencial ? `Preferencial: ${rotina.horarioPreferencial}` : "Sem horário fixo"}
                        </Badge>
                        <Badge variant="outline" className="bg-background flex items-center gap-1.5 py-1">
                            <CalendarSync className="w-3.5 h-3.5 text-muted-foreground" />
                            {rotina.frequencia === "diaria" && "Diária"}
                            {rotina.frequencia === "semanal" && `Semanal (${rotina.diasSemana?.length || 0} dias)`}
                            {rotina.frequencia === "mensal" && `Mensal (Dia ${rotina.diaDoMes})`}
                        </Badge>
                        <Badge variant="outline" className="bg-background flex items-center gap-1.5 py-1">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {rotina.responsavelPadraoId ? (rotina.responsavelPadraoId === "user_matheus_99" ? "Matheus" : "Gerente") : "Sem designação"}
                        </Badge>
                    </div>

                    <Separator />

                    {/* Tags */}
                    {(rotina.tags && rotina.tags.length > 0) && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                                <TagIcon className="w-3.5 h-3.5" /> Tags Atribuídas
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {rotina.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="bg-secondary/50 text-secondary-foreground text-[11px] hover:bg-secondary/70">
                                        <Hash className="w-3 h-3 mr-0.5 opacity-50" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Modelo de Checklist */}
                    {rotina.tipoTarefaGerada === "checklist" && rotina.checklistModelo && rotina.checklistModelo.length > 0 && (
                        <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-dashed border-border/60">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-primary" /> Modelo do Checklist
                            </h3>
                            <div className="space-y-2.5 pl-1">
                                {rotina.checklistModelo.map((item, index) => (
                                    <div key={item.id} className="flex gap-3 items-start group">
                                        <div className="w-5 h-5 shrink-0 rounded border bg-background flex items-center justify-center text-[10px] text-muted-foreground select-none">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm leading-tight text-foreground/90 mt-0.5 group-hover:text-foreground transition-colors">
                                            {item.texto}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Acompanhamento de Gerações */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            Acompanhamento de Gerações
                        </h3>
                        {historico.length === 0 ? (
                            <div className="text-sm text-muted-foreground bg-background rounded-lg p-3 text-center border border-dashed">
                                Nenhuma tarefa gerada recentemente.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {historico.map((g) => (
                                    <div key={g.id} className="text-sm flex justify-between items-center bg-background rounded-md p-2 border">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">Data: {format(new Date(g.dataReferencia), "dd/MM/yyyy", { locale: ptBR })}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">ID Gerado: {g.taskIdGerada.split('-')[0]}</span>
                                        </div>
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Sucesso</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Meta-dados de auditoria */}
                    <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg flex flex-col gap-1">
                        <p>Criada em: {format(new Date(rotina.criadoEm), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}</p>
                        {rotina.atualizadoEm !== rotina.criadoEm && (
                            <p>Última alteração: {format(new Date(rotina.atualizadoEm), "dd/MM/yyyy HH:mm")}</p>
                        )}
                        <p>ID Referencial: <span className="font-mono text-[10px]">{rotina.id.split('-')[0]}</span></p>
                    </div>
                </div>
            </ScrollArea>

            {/* Ações Inferiores Fixas */}
            <div className="flex-none p-4 border-t bg-card/50 backdrop-blur-sm">
                <Button
                    className="w-full font-medium"
                    variant={rotina.ativa ? "default" : "secondary"}
                    disabled={!rotina.ativa || isGerando}
                    onClick={() => aoGerarTarefaManual(rotina)}
                >
                    <PlayCircle className={`w-4 h-4 mr-2 ${isGerando && "animate-spin"}`} />
                    {isGerando ? "Gerando..." : (!rotina.ativa ? "Rotina Inativa" : "Gerar Tarefa Agora")}
                </Button>
                {rotina.ativa && (
                    <p className="text-[10px] text-center mt-2 text-muted-foreground">
                        Isto forçará a geração de uma nova tarefa de execução para a data de hoje.
                    </p>
                )}
            </div>
        </div>
    );
}
