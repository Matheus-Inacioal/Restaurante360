import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckSquare } from "lucide-react";

interface CabecalhoTarefasProps {
    metricas: {
        atrasadas: number;
        hoje: number;
        pendentes: number;
        concluidas: number;
    };
    aoClicarNovaTarefa: () => void;
    aoClicarNovoChecklist: () => void;
}

export function CabecalhoTarefas({ metricas, aoClicarNovaTarefa, aoClicarNovoChecklist }: CabecalhoTarefasProps) {
    return (
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 pb-4 border-b">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Tarefas e Checklists</h2>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-muted-foreground font-normal border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10">
                        {metricas.atrasadas} Atrasadas
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground font-normal">
                        {metricas.hoje} Para Hoje
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground font-normal">
                        {metricas.pendentes} Pendentes
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground font-normal border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
                        {metricas.concluidas} Concluídas
                    </Badge>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button onClick={aoClicarNovaTarefa} variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                </Button>
                <Button onClick={aoClicarNovoChecklist}>
                    <CheckSquare className="mr-2 h-4 w-4" /> Novo Checklist
                </Button>
            </div>
        </div>
    );
}
