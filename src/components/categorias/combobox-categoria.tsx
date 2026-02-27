"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useCategorias } from "@/hooks/use-categorias";
import type { TipoCategoria } from "@/lib/types/categorias";

interface ComboboxCategoriaProps {
    tipo: TipoCategoria;
    value?: string;
    onChange: (categoriaId: string) => void;
    onManageClick?: () => void;
}

export function ComboboxCategoria({ tipo, value, onChange, onManageClick }: ComboboxCategoriaProps) {
    const { categorias, criarCategoria, isCarregando } = useCategorias(tipo);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const categoriasAtivas = useMemo(() => categorias.filter(c => c.ativa), [categorias]);

    const filtered = useMemo(() => {
        if (!search.trim()) return categoriasAtivas;
        return categoriasAtivas.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));
    }, [categoriasAtivas, search]);

    const temMatchExato = useMemo(() => {
        if (!search.trim()) return true;
        return categoriasAtivas.some(c => c.nome.toLowerCase() === search.trim().toLowerCase());
    }, [categoriasAtivas, search]);

    const handleCreate = async () => {
        if (!search.trim() || temMatchExato) return;
        try {
            const nova = await criarCategoria(search.trim(), tipo);
            onChange(nova.id);
            setOpen(false);
            setSearch("");
        } catch (error) {
            console.error(error);
        }
    };

    const selecionada = categorias.find((c) => c.id === value);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                            disabled={isCarregando}
                        >
                            {selecionada ? selecionada.nome : isCarregando ? "Carregando..." : "Selecione uma categoria..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <div className="flex flex-col">
                            <div className="flex items-center border-b px-3">
                                <Input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar ou criar categoria..."
                                    className="border-0 focus-visible:ring-0 px-0 shadow-none"
                                />
                            </div>
                            <div className="max-h-[200px] overflow-y-auto p-1">
                                {filtered.length === 0 && temMatchExato && (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        Nenhuma categoria encontrada.
                                    </div>
                                )}
                                {filtered.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(cat.id);
                                            setOpen(false);
                                        }}
                                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", value === cat.id ? "opacity-100" : "opacity-0")} />
                                        {cat.nome}
                                    </button>
                                ))}
                                {!temMatchExato && search.trim().length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleCreate}
                                        className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary font-medium hover:bg-accent hover:text-accent-foreground mt-1"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        Criar categoria "{search.trim()}"
                                    </button>
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {onManageClick && (
                <div className="flex justify-end">
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={onManageClick}>
                        Gerenciar categorias
                    </Button>
                </div>
            )}
        </div>
    );
}
