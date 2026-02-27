"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useProcessos } from "@/hooks/use-processos";
import { ComboboxCategoria } from "@/components/categorias/combobox-categoria";
import { ModalGerenciarCategorias } from "@/components/categorias/modal-gerenciar-categorias";
import type { PassoProcesso, Processo } from "@/lib/types/processos";

interface ModalCriarProcessoProps {
    aberto: boolean;
    aoMudarEstado: (abto: boolean) => void;
    aoSucesso: (novoId: string) => void;
    processoInicial?: Processo | null;
}

export function ModalCriarProcesso({ aberto, aoMudarEstado, aoSucesso, processoInicial }: ModalCriarProcessoProps) {
    const { criarProcesso, editarProcesso } = useProcessos();

    // Estados do Formulário
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [passos, setPassos] = useState<Omit<PassoProcesso, "id">[]>([
        { titulo: "", exigeFoto: false }
    ]);

    // UI Auxiliar
    const [erro, setErro] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);
    const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

    // Resetar ao abrir
    useEffect(() => {
        if (aberto) {
            setErro(null);
            if (processoInicial) {
                setTitulo(processoInicial.titulo);
                setDescricao(processoInicial.descricao || "");
                setCategoriaId(processoInicial.categoriaId);
                // Deep copy dos passos originais omitindo propriedades de banco se necessário
                const ps = processoInicial.passos.length > 0
                    ? processoInicial.passos.map(p => ({ titulo: p.titulo, descricao: p.descricao, exigeFoto: p.exigeFoto }))
                    : [{ titulo: "", exigeFoto: false }];
                setPassos(ps);
            } else {
                setTitulo("");
                setDescricao("");
                setCategoriaId("");
                setPassos([{ titulo: "", exigeFoto: false }]);
            }
        }
    }, [aberto, processoInicial]);

    const handleAddPasso = () => {
        setPassos([...passos, { titulo: "", exigeFoto: false }]);
    };

    const handleRemovePasso = (index: number) => {
        if (passos.length > 1) {
            setPassos(passos.filter((_, i) => i !== index));
        }
    };

    const handleAtualizarPasso = (index: number, campo: keyof Omit<PassoProcesso, "id">, valor: any) => {
        const novosPassos = [...passos];
        novosPassos[index] = { ...novosPassos[index], [campo]: valor };
        setPassos(novosPassos);
    };

    const handleSalvar = async () => {
        setErro(null);

        if (titulo.trim().length < 3) {
            setErro("O título do processo deve ter pelo menos 3 caracteres.");
            return;
        }

        if (!categoriaId) {
            setErro("Uma categoria precisa ser selecionada.");
            return;
        }

        const passosValidos = passos.filter(p => p.titulo.trim() !== "");
        if (passosValidos.length === 0) {
            setErro("O processo precisa ter ao menos 1 passo preenchido.");
            return;
        }

        setSalvando(true);
        try {
            const finalPassos = passosValidos.map(p => ({
                id: crypto.randomUUID(),
                titulo: p.titulo.trim(),
                descricao: p.descricao?.trim() || undefined,
                exigeFoto: p.exigeFoto
            }));

            if (processoInicial) {
                const up = await editarProcesso(processoInicial.id, {
                    titulo: titulo.trim(),
                    descricao: descricao.trim() || undefined,
                    categoriaId,
                    passos: finalPassos
                });
                aoSucesso(up.id);
            } else {
                const novo = await criarProcesso({
                    titulo: titulo.trim(),
                    descricao: descricao.trim() || undefined,
                    categoriaId,
                    passos: finalPassos
                });
                aoSucesso(novo.id);
            }

            aoMudarEstado(false);
        } catch (e: any) {
            setErro(e.message || "Falha ao salvar processo.");
        } finally {
            setSalvando(false);
        }
    };

    return (
        <>
            <Dialog open={aberto} onOpenChange={aoMudarEstado}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                    <DialogHeader className="p-6 pb-4 border-b bg-muted/5 shrink-0">
                        <DialogTitle className="text-xl">
                            {processoInicial ? "Editar Processo" : "Novo Processo Padrão (POP)"}
                        </DialogTitle>
                        <DialogDescription>
                            {processoInicial
                                ? "Atualize as informações operacionais deste guia e modifique os passos de execução conforme o novo padrão."
                                : "Crie um Procedimento Operacional Padrão detalhado. Adicione cada passo que deve ser executado para concluí-lo."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 custom-scrollbar">
                        <div className="p-6 space-y-8">
                            {/* Seção 1: Infos Básicas */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-foreground/80 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
                                    Informações Principais
                                </h3>

                                <div className="grid gap-4 md:grid-cols-2 pl-8">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="titulo">Título do Processo <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="titulo"
                                            placeholder="Ex: Recebimento e Conferência de Estoque"
                                            value={titulo}
                                            onChange={(e) => setTitulo(e.target.value)}
                                            className="bg-card"
                                        />
                                    </div>

                                    <div className="space-y-2 col-span-2 md:col-span-1">
                                        <Label>Categoria <span className="text-destructive">*</span></Label>
                                        <ComboboxCategoria
                                            tipo="processos"
                                            value={categoriaId}
                                            onChange={setCategoriaId}
                                            onManageClick={() => setIsCategoriesModalOpen(true)}
                                        />
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="descricao">Descrição Expandida (Opcional)</Label>
                                        <Textarea
                                            id="descricao"
                                            placeholder="Descreva o propósito geral deste procedimento e em quais situações ele se aplica..."
                                            value={descricao}
                                            onChange={(e) => setDescricao(e.target.value)}
                                            className="resize-none h-20 bg-card"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            {/* Seção 2: Passos */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-foreground/80 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
                                    Cronologia de Passos
                                </h3>
                                <p className="text-sm text-muted-foreground pl-8 mt-0">
                                    Descreva sequencialmente as ações que o colaborador precisará realizar.
                                </p>

                                <div className="space-y-3 pl-8">
                                    {passos.map((passo, index) => (
                                        <div key={index} className="p-4 border border-border bg-card rounded-xl space-y-4 relative group hover:border-border/80 transition-colors">
                                            <div className="absolute -left-3 -top-3 w-6 h-6 rounded-md bg-muted text-muted-foreground border flex items-center justify-center text-xs font-mono font-medium shadow-sm">
                                                {index + 1}
                                            </div>

                                            <div className="pt-1">
                                                <Label>Instrução do Passo <span className="text-destructive">*</span></Label>
                                                <Input
                                                    placeholder="Ex: Verificar temperatura interna da câmara central..."
                                                    value={passo.titulo}
                                                    onChange={(e) => handleAtualizarPasso(index, "titulo", e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Dicas / Avisos Auxiliares (Opcional)</Label>
                                                    <Textarea
                                                        placeholder="Lembre-se de anotar na prancheta logo em seguida."
                                                        value={passo.descricao || ""}
                                                        onChange={(e) => handleAtualizarPasso(index, "descricao", e.target.value)}
                                                        className="mt-1 h-16 resize-none"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-3 justify-center bg-muted/20 p-3 rounded-lg border border-dashed">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <Label className="text-foreground font-medium">Exige Evidência Fotográfica?</Label>
                                                            <p className="text-[10px] text-muted-foreground">O colaborador precisará enviar uma foto para avançar.</p>
                                                        </div>
                                                        <Switch
                                                            checked={passo.exigeFoto}
                                                            onCheckedChange={(checked) => handleAtualizarPasso(index, "exigeFoto", checked)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {passos.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleRemovePasso(index)}
                                                    className="absolute top-2 right-2 w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-transparent hover:border-destructive/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleAddPasso}
                                        className="w-full border-dashed bg-card/50 hover:bg-card mt-2"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                                        Adicionar Passo ao Fluxograma
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t bg-muted/10 shrink-0 flex items-center justify-between">
                        <div>
                            {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" type="button" onClick={() => aoMudarEstado(false)}>
                                Cancelar
                            </Button>
                            <Button type="button" onClick={handleSalvar} disabled={salvando}>
                                {salvando ? "Salvando..." : "Salvar Processo"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Instancia do sub-modal de categorias */}
            <ModalGerenciarCategorias
                tipo="processos"
                aberto={isCategoriesModalOpen}
                aoMudarEstado={setIsCategoriesModalOpen}
            />
        </>
    );
}
