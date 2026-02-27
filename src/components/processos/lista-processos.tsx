"use client";

import { useState } from "react";
import { Search, FileText, MoreVertical, Edit2, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Processo } from "@/lib/types/processos";
import { useCategorias } from "@/hooks/use-categorias";

interface ListaProcessosProps {
    processos: Processo[];
    processoSelecionadoId: string | null;
    aoSelecionar: (id: string) => void;
    aoEditar: (processo: Processo) => void;
    aoExcluir: (processo: Processo) => void;
}

export function ListaProcessos({ processos, processoSelecionadoId, aoSelecionar, aoEditar, aoExcluir }: ListaProcessosProps) {
    const [busca, setBusca] = useState("");
    const { categorias } = useCategorias("processos");

    const obterNomeCategoria = (id: string) => {
        const cat = categorias.find(c => c.id === id);
        return cat ? cat.nome : "Sem Categoria";
    };

    const filtrados = processos.filter(p =>
        p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        obterNomeCategoria(p.categoriaId).toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="p-4 border-b space-y-4 shrink-0 bg-muted/10">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou categoria..."
                        className="pl-9 bg-background"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 custom-scrollbar">
                <div className="p-2 space-y-1">
                    {filtrados.length === 0 ? (
                        <div className="text-center py-10 px-4 text-muted-foreground flex flex-col items-center">
                            <FileText className="h-10 w-10 opacity-20 mb-3" />
                            <p className="text-sm">Nenhum processo encontrado.</p>
                        </div>
                    ) : (
                        filtrados.map((processo) => {
                            const isSelecionado = processoSelecionadoId === processo.id;

                            return (
                                <div
                                    key={processo.id}
                                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-2 relative group
                                        ${isSelecionado
                                            ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20 shadow-sm'
                                            : 'bg-background hover:bg-muted/50 border-transparent hover:border-border'
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => aoSelecionar(processo.id)}
                                        className="absolute inset-0 z-0 rounded-lg"
                                        aria-label={`Selecionar ${processo.titulo}`}
                                    />
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className={`font-medium line-clamp-1 flex-1 z-10 pointer-events-none ${!processo.ativo && 'text-muted-foreground line-through'}`}>
                                            {processo.titulo}
                                        </h3>
                                        <div className="flex items-center gap-2 z-10 shrink-0">
                                            <Badge variant="outline" className="text-[10px] font-mono tracking-tighter">
                                                v{processo.versao}
                                            </Badge>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); aoEditar(processo); }}>
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        <span>Editar</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                        onClick={(e) => { e.stopPropagation(); aoExcluir(processo); }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Excluir</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="text-[10px] truncate max-w-[120px]">
                                            {obterNomeCategoria(processo.categoriaId)}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <span className={`w-2 h-2 rounded-full ${processo.ativo ? 'bg-emerald-500' : 'bg-destructive'}`} />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                                {processo.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
