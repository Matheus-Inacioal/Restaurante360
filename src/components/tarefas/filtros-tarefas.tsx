import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FiltrosTarefas() {
    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-center p-3 rounded-lg border bg-muted/40">

            {/* Search Input Principal */}
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar pelo título, tag ou responsável..."
                    className="pl-8 bg-background border-muted-foreground/20"
                />
            </div>

            {/* Row de Filtros (Selects) */}
            <div className="flex flex-wrap items-center gap-2">
                <Select defaultValue="todos">
                    <SelectTrigger className="w-[130px] h-9 bg-background border-muted-foreground/20">
                        <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos Status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_progresso">Em andamento</SelectItem>
                        <SelectItem value="atrasada">Atrasada</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                    </SelectContent>
                </Select>

                <Select defaultValue="todos">
                    <SelectTrigger className="w-[120px] h-9 bg-background border-muted-foreground/20">
                        <SelectValue placeholder="Responsável" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Qualquer um</SelectItem>
                        <SelectItem value="minhas">Apenas Minhas</SelectItem>
                        <SelectItem value="cozinha">Equipe Cozinha</SelectItem>
                    </SelectContent>
                </Select>

                <Select defaultValue="hoje">
                    <SelectTrigger className="w-[110px] h-9 bg-background border-muted-foreground/20">
                        <SelectValue placeholder="Prazo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos prazos</SelectItem>
                        <SelectItem value="hoje">Para hoje</SelectItem>
                        <SelectItem value="semana">Nesta semana</SelectItem>
                    </SelectContent>
                </Select>

                <Select defaultValue="todas">
                    <SelectTrigger className="w-[120px] h-9 bg-background border-muted-foreground/20">
                        <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todas">Qualquer priori.</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" title="Limpar filtros">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

        </div>
    );
}
