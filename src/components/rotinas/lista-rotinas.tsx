"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, CalendarDays, Loader2, ListChecks, CheckSquare, MoreHorizontal, Power, Copy, Trash2, Edit2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Rotina } from "@/lib/types/rotinas";

interface ListaRotinasProps {
    rotinas: Rotina[];
    rotinaSelecionadaId: string | null;
    isCarregando: boolean;
    erro: string | null;
    vazio: boolean;
    aoSelecionarRotina: (id: string | null) => void;
    aoAlternarStatus: (rotina: Rotina) => void;
    aoDuplicarRotina: (rotina: Rotina) => void;
    aoExcluirRotina: (id: string) => void;
    aoEditarRotina: (rotina: Rotina) => void;
}

export function ListaRotinas({
    rotinas, rotinaSelecionadaId, isCarregando, erro, vazio,
    aoSelecionarRotina, aoAlternarStatus, aoDuplicarRotina, aoExcluirRotina, aoEditarRotina
}: ListaRotinasProps) {
    const [busca, setBusca] = useState("");
    const [filtroStatus, setFiltroStatus] = useState<"todas" | "ativas" | "inativas">("todas");

    const rotinasExibidas = useMemo(() => {
        let filtradas = rotinas;

        if (filtroStatus === "ativas") filtradas = filtradas.filter(r => r.ativa);
        if (filtroStatus === "inativas") filtradas = filtradas.filter(r => !r.ativa);

        if (busca.trim() !== "") {
            const termo = busca.toLowerCase();
            filtradas = filtradas.filter(r => r.titulo.toLowerCase().includes(termo));
        }

        return filtradas.sort((a, b) => {
            // Rotinas ativas primeiro, depois por horário preferencial
            if (a.ativa && !b.ativa) return -1;
            if (!a.ativa && b.ativa) return 1;
            if (a.horarioPreferencial && !b.horarioPreferencial) return -1;
            if (!a.horarioPreferencial && b.horarioPreferencial) return 1;
            if (a.horarioPreferencial && b.horarioPreferencial) {
                return a.horarioPreferencial.localeCompare(b.horarioPreferencial);
            }
            return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
        });
    }, [rotinas, busca, filtroStatus]);

    if (isCarregando) {
        return (
            <div className="flex flex-col items-center justify-center h-48 space-y-4 rounded-xl border border-dashed border-border/50 bg-muted/20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Sincronizando rotinas...</p>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Power className="w-6 h-6 text-destructive" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-destructive">Falha Operacional</h3>
                    <p className="text-sm text-destructive/80 max-w-[280px] mt-1">{erro}</p>
                </div>
            </div>
        );
    }

    if (vazio) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center rounded-xl border border-dashed bg-muted/20 space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-border">
                    <CalendarDays className="w-8 h-8 text-muted-foreground/60" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Ainda não há rotinas.</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Crie sua primeira rotina diária para padronizar a execução do seu negócio. As tarefas serão geradas automaticamente.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="Buscar rotina..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="flex-1"
                />
                <Select value={filtroStatus} onValueChange={(v: "todas" | "ativas" | "inativas") => setFiltroStatus(v)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="ativas">Ativas</SelectItem>
                        <SelectItem value="inativas">Inativas</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                {rotinasExibidas.map((rotina) => (
                    <div
                        key={rotina.id}
                        onClick={() => aoSelecionarRotina(rotina.id)}
                        className={`
                            group relative flex flex-col p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden
                            hover:shadow-md hover:border-primary/30
                            ${rotinaSelecionadaId === rotina.id
                                ? "bg-primary/5 border-primary shadow-sm"
                                : "bg-card border-border shadow-sm"}
                            ${!rotina.ativa && "opacity-75 bg-muted/30 hover:opacity-100"}
                        `}
                    >
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h4 className="font-semibold text-base text-card-foreground truncate group-hover:text-primary transition-colors">
                                        {rotina.titulo}
                                    </h4>
                                    {rotina.ativa ? (
                                        <span className="shrink-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                            Ativa
                                        </span>
                                    ) : (
                                        <span className="shrink-0 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                            Inativa
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                                    <span className="flex items-center gap-1.5 line-clamp-1">
                                        {rotina.tipoTarefaGerada === "checklist" ? (
                                            <><ListChecks className="w-3.5 h-3.5 text-blue-500" /> Checklist · {rotina.checklistModelo?.length || 0} itens</>
                                        ) : (
                                            <><CheckSquare className="w-3.5 h-3.5 text-emerald-500" /> Tarefa Simples</>
                                        )}
                                    </span>
                                    {rotina.horarioPreferencial && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {rotina.horarioPreferencial}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 pt-0.5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => aoAlternarStatus(rotina)}>
                                            <Power className="w-4 h-4 mr-2" />
                                            {rotina.ativa ? "Desativar Rotina" : "Ativar Rotina"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => aoEditarRotina(rotina)}>
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => aoDuplicarRotina(rotina)}>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Duplicar
                                        </DropdownMenuItem>
                                        <div className="h-px bg-border my-1" />
                                        <DropdownMenuItem onClick={() => aoExcluirRotina(rotina.id)} className="text-destructive focus:bg-destructive/10">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Cessar & Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                ))}

                {rotinasExibidas.length === 0 && !isCarregando && !erro && !vazio && (
                    <div className="text-center py-8 text-muted-foreground text-sm border bg-muted/10 border-dashed rounded-lg">
                        Nenhuma rotina atende aos filtros atuais.
                    </div>
                )}
            </div>
        </div>
    );
}
