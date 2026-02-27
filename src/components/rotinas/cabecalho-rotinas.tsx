"use client";

import { Plus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CabecalhoRotinasProps {
    metricas: {
        ativas: number;
        inativas: number;
        geradasHoje: number;
    };
    aoClicarNovaRotina: () => void;
    aoClicarGerarTarefas: () => void;
}

export function CabecalhoRotinas({ metricas, aoClicarNovaRotina, aoClicarGerarTarefas }: CabecalhoRotinasProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-6">
            <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Rotinas</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    Crie rotinas diárias que geram tarefas automaticamente.
                </p>
                <div className="flex items-center gap-2 mt-2 pt-2 text-xs font-medium text-muted-foreground">
                    <span className="bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {metricas.ativas} Ativas
                    </span>
                    <span className="bg-slate-500/10 text-slate-600 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        {metricas.inativas} Inativas
                    </span>
                    <span className="bg-blue-500/10 text-blue-600 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {metricas.geradasHoje} Geradas hoje
                    </span>
                </div>
            </div>

            <div className="flex w-full md:w-auto flex-col xs:flex-row gap-3">
                <Button
                    variant="outline"
                    className="w-full xs:w-auto"
                    onClick={aoClicarGerarTarefas}
                    title="Forçar validação e geração das tarefas de rotinas ativas para a data de hoje"
                >
                    <Play className="w-4 h-4 mr-2 text-blue-500" />
                    Gerar tarefas do dia
                </Button>

                <Button
                    className="w-full xs:w-auto shadow-sm"
                    onClick={aoClicarNovaRotina}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova rotina
                </Button>
            </div>
        </div>
    );
}
