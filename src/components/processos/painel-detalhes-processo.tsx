"use client";

import { CheckSquare, ListChecks, CalendarSync, Activity, Tag as TagIcon, Hash, Camera, ShieldAlert, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Processo } from "@/lib/types/processos";
import { useCategorias } from "@/hooks/use-categorias";
import { EmptyState } from "@/components/empty-state";

interface PainelDetalhesProcessoProps {
    processo: Processo | null;
    aoEditar: (p: Processo) => void;
    aoExcluir: (p: Processo) => void;
}

export function PainelDetalhesProcesso({ processo, aoEditar, aoExcluir }: PainelDetalhesProcessoProps) {
    const { categorias } = useCategorias("processos");

    if (!processo) {
        return (
            <div className="h-full flex items-center justify-center bg-card rounded-xl border border-border shadow-sm p-8 text-center">
                <EmptyState
                    icon={ListChecks}
                    title="Nenhum Objeto Selecionado"
                    description="Selecione um processo na lista à esquerda para ver os detalhes, ou crie um novo."
                />
            </div>
        );
    }

    const nomeCategoria = categorias.find(c => c.id === processo.categoriaId)?.nome || "Sem Categoria";

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in duration-200">
            {/* Cabecalho */}
            <div className="flex-none p-5 border-b bg-muted/10">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary`}>
                            <ListChecks className="w-5 h-5" />
                        </span>
                        <div>
                            <h2 className="text-xl font-bold leading-tight">{processo.titulo}</h2>
                            <div className="flex gap-2 mt-1.5">
                                <Badge variant="secondary" className="font-normal text-xs">{nomeCategoria}</Badge>
                                <Badge variant={processo.ativo ? "outline" : "secondary"} className={processo.ativo ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-muted-foreground"}>
                                    {processo.ativo ? "Ativo" : "Inativo"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => aoEditar(processo)} className="h-8 shadow-sm">
                            <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => aoExcluir(processo)} className="h-8 shadow-sm text-destructive hover:bg-destructive/5 hover:text-destructive border-transparent hover:border-destructive/20">
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                        </Button>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-5 space-y-6">
                    {processo.descricao && (
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-2">Descrição</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {processo.descricao}
                            </p>
                        </div>
                    )}

                    <Separator />

                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" /> Passos Operacionais ({processo.passos.length})
                        </h3>

                        <div className="space-y-3">
                            {processo.passos.map((passo, index) => (
                                <div key={passo.id} className="flex gap-4 p-4 border rounded-xl bg-card hover:bg-accent/50 transition-colors group">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm">
                                            {index + 1}
                                        </div>
                                        {index < processo.passos.length - 1 && (
                                            <div className="h-full w-px bg-border group-hover:bg-primary/20 transition-colors" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-medium text-sm text-foreground">{passo.titulo}</h4>
                                            {passo.exigeFoto && (
                                                <Badge variant="outline" className="shrink-0 bg-blue-50 text-blue-600 border-blue-200 gap-1 flex items-center text-[10px] h-5 py-0">
                                                    <Camera className="w-3 h-3" /> Exige Foto
                                                </Badge>
                                            )}
                                        </div>
                                        {passo.descricao && (
                                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                                {passo.descricao}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Meta Info */}
                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CalendarSync className="w-3.5 h-3.5" />
                                <span>Criado em {format(new Date(processo.criadoEm), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                                V{processo.versao}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Hash className="w-3.5 h-3.5" />
                            <span className="font-mono uppercase tracking-wider text-[10px]">ID: {processo.id.split('-')[0]}</span>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
