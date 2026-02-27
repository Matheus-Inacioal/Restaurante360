"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCategorias } from "@/hooks/use-categorias";
import type { TipoCategoria, Categoria } from "@/lib/types/categorias";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Search } from "lucide-react";

interface ModalGerenciarCategoriasProps {
    aberto: boolean;
    aoMudarEstado: (abto: boolean) => void;
    tipo: TipoCategoria;
}

export function ModalGerenciarCategorias({ aberto, aoMudarEstado, tipo }: ModalGerenciarCategoriasProps) {
    const { categorias, alternarStatus, atualizarCategoria } = useCategorias(tipo);
    const [busca, setBusca] = useState("");
    const [idEditando, setIdEditando] = useState<string | null>(null);
    const [novoNome, setNovoNome] = useState("");

    const filtradas = categorias.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));

    const comecarEdicao = (cat: Categoria) => {
        setIdEditando(cat.id);
        setNovoNome(cat.nome);
    };

    const salvarEdicao = async (cat: Categoria) => {
        if (!novoNome.trim() || novoNome.trim() === cat.nome) {
            setIdEditando(null);
            return;
        }
        await atualizarCategoria(cat.id, { nome: novoNome.trim() });
        setIdEditando(null);
    };

    return (
        <Dialog open={aberto} onOpenChange={aoMudarEstado}>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col pt-6 pb-2 px-2">
                <DialogHeader className="px-4 shrink-0 space-y-3">
                    <DialogTitle>Gerenciar Categorias</DialogTitle>
                    <DialogDescription>
                        Ative, inative ou edite as categorias deste módulo.
                    </DialogDescription>

                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar categorias..."
                            className="pl-9 bg-muted/20"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto mt-2 px-4 space-y-2 pb-6 custom-scrollbar">
                    {filtradas.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8 italic">
                            Nenhuma categoria encontrada.
                        </div>
                    ) : (
                        filtradas.map(cat => (
                            <div key={cat.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${cat.ativa ? 'bg-background' : 'bg-muted/30 border-dashed'}`}>
                                <div className="flex-1 mr-3 min-w-0">
                                    {idEditando === cat.id ? (
                                        <div className="flex gap-2">
                                            <Input
                                                value={novoNome}
                                                onChange={e => setNovoNome(e.target.value)}
                                                autoFocus
                                                className="h-8"
                                                onKeyDown={e => e.key === "Enter" && salvarEdicao(cat)}
                                            />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => salvarEdicao(cat)}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400" onClick={() => setIdEditando(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium truncate ${cat.ativa ? 'text-foreground' : 'text-muted-foreground line-through decoration-muted-foreground/40'}`}>
                                                {cat.nome}
                                            </span>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 opacity-40 hover:opacity-100" onClick={() => comecarEdicao(cat)}>
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Criada em {format(new Date(cat.criadoEm), "dd/MM/yyyy", { locale: ptBR })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs text-muted-foreground cursor-pointer" htmlFor={`switch-${cat.id}`}>
                                        {cat.ativa ? "Ativo" : "Inativo"}
                                    </Label>
                                    <Switch
                                        id={`switch-${cat.id}`}
                                        checked={cat.ativa}
                                        onCheckedChange={() => alternarStatus(cat)}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
