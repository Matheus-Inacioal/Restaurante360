"use client";

import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CabecalhoProcessosProps {
    aoCriarNovo: () => void;
    totalProcessos: number;
}

export function CabecalhoProcessos({ aoCriarNovo, totalProcessos }: CabecalhoProcessosProps) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Processos (POP/SOP)</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Catálogo de Procedimentos Operacionais Padrão. Total: {totalProcessos}
                </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button onClick={aoCriarNovo} className="w-full sm:w-auto shadow-sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Processo
                </Button>
            </div>
        </div>
    );
}
