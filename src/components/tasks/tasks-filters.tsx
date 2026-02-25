"use client"

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function TasksFilters() {
    return (
        <div className="flex flex-col space-y-3 p-4 bg-muted/20 border rounded-lg">
            <div className="flex flex-col md:flex-row gap-3">
                {/* Barra de Busca principal */}
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por título, tag ou responsável..."
                        className="pl-9 w-full bg-background"
                    />
                </div>

                {/* Filtros em linha lado a lado no Desktop */}
                <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-full md:w-[130px] bg-background">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="pending">Pendentes</SelectItem>
                            <SelectItem value="progress">Em progresso</SelectItem>
                            <SelectItem value="completed">Concluídas</SelectItem>
                            <SelectItem value="delayed">Atrasadas</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select>
                        <SelectTrigger className="w-full md:w-[130px] bg-background">
                            <SelectValue placeholder="Prazo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="tomorrow">Amanhã</SelectItem>
                            <SelectItem value="week">Nesta semana</SelectItem>
                            <SelectItem value="none">Sem prazo</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select>
                        <SelectTrigger className="w-full md:w-[130px] bg-background">
                            <SelectValue placeholder="Prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="low">Baixa</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Botão de limpar formatado como fantasma (ghost) */}
                    <Button variant="ghost" size="icon" className="shrink-0" title="Limpar Filtros">
                        <X className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <Button variant="outline" size="icon" className="md:hidden shrink-0" title="Filtros Avançados">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
