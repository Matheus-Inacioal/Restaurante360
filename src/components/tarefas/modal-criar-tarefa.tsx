"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, ListTodo, FileText } from "lucide-react";
import type { TipoTarefa, ItemVerificacao } from "@/lib/types/tarefas";

interface ModalCriarTarefaProps {
    aberto: boolean;
    aoMudarEstado: (open: boolean) => void;
    tipoPadrao?: TipoTarefa;
    aoGravar: (data: any) => Promise<void>;
}

export function ModalCriarTarefa({ aberto, aoMudarEstado, tipoPadrao = "tarefa", aoGravar }: ModalCriarTarefaProps) {
    const [isGravando, setIsGravando] = useState(false);

    // States do formulário PtBR
    const [tipo, setTipo] = useState<TipoTarefa>(tipoPadrao);
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [responsavel, setResponsavel] = useState("");
    const [prazo, setPrazo] = useState("");
    const [prioridade, setPrioridade] = useState<"Alta" | "Média" | "Baixa">("Média");
    const [inputTags, setInputTags] = useState("");

    // States do Checklist Dinâmico
    const [itensVerificacao, setItensVerificacao] = useState<Omit<ItemVerificacao, "concluido">[]>([]);
    const [textoNovoItem, setTextoNovoItem] = useState("");

    // Resetar ao abrir
    useEffect(() => {
        if (aberto) {
            setTipo(tipoPadrao);
            setTitulo("");
            setDescricao("");
            setResponsavel("");
            setPrazo("");
            setPrioridade("Média");
            setInputTags("");
            setItensVerificacao(tipoPadrao === "checklist" ? [{ id: crypto.randomUUID(), texto: "" }] : []);
            setTextoNovoItem("");
        }
    }, [aberto, tipoPadrao]);

    const tentarAdicionarPasso = () => {
        if (!textoNovoItem.trim()) return;
        setItensVerificacao([...itensVerificacao, { id: crypto.randomUUID(), texto: textoNovoItem }]);
        setTextoNovoItem("");
    };

    const dispararFormulario = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo.trim()) return;

        setIsGravando(true);
        try {
            const tagsParseadas = inputTags.split(",").map(t => t.trim()).filter(t => t.length > 0);

            const cargaBase = {
                titulo,
                descricao,
                tipo,
                status: "pendente" as const, // Forçando compliance
                prioridade,
                responsavel: responsavel || undefined,
                prazo: prazo || undefined,
                tags: tagsParseadas.length > 0 ? tagsParseadas : undefined,
                itensVerificacao: tipo === "checklist" ? itensVerificacao.filter(i => i.texto.trim() !== "").map(i => ({ ...i, concluido: false })) : undefined,
            };

            await aoGravar(cargaBase);
            aoMudarEstado(false);
        } finally {
            setIsGravando(false);
        }
    };

    return (
        <Dialog open={aberto} onOpenChange={aoMudarEstado}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={dispararFormulario}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {tipo === "checklist" ? <ListTodo className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                            {tipo === "checklist" ? "Novo Checklist" : "Nova Tarefa"}
                        </DialogTitle>
                        <DialogDescription>
                            {tipo === "checklist"
                                ? "Crie procedimentos com passos de verificação obrigatórios para SOPs e rotinas contínuas."
                                : "Crie uma atividade de execução ou um lembrete."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">

                        {/* Toggle Switch */}
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Formato Checklist</Label>
                                <p className="text-xs text-muted-foreground">Converta em sistema de marcação e passos.</p>
                            </div>
                            <Switch
                                checked={tipo === "checklist"}
                                onCheckedChange={(checked) => setTipo(checked ? "checklist" : "tarefa")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="titulo">Título de Serviço <span className="text-destructive">*</span></Label>
                            <Input id="titulo" autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Fechar Caixas Tarde" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="responsavel">Designado</Label>
                                <Select value={responsavel} onValueChange={setResponsavel}>
                                    <SelectTrigger id="responsavel">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Ana Clara">Ana Clara</SelectItem>
                                        <SelectItem value="Carlos Gerente">Carlos Gerente</SelectItem>
                                        <SelectItem value="João Lima">João Lima</SelectItem>
                                        <SelectItem value="Maria Souza">Maria Souza</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="prioridade">Grau de Prioridade</Label>
                                <Select value={prioridade} onValueChange={(v: "Alta" | "Média" | "Baixa") => setPrioridade(v)}>
                                    <SelectTrigger id="prioridade">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Alta">Alta</SelectItem>
                                        <SelectItem value="Média">Média</SelectItem>
                                        <SelectItem value="Baixa">Baixa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="prazo">Prazo e Limites (Opcional)</Label>
                            <Input id="prazo" type="text" value={prazo} onChange={(e) => setPrazo(e.target.value)} placeholder="Ex: Hoje, 23:59" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Agrupadores (Tags)</Label>
                            <Input id="tags" value={inputTags} onChange={(e) => setInputTags(e.target.value)} placeholder="Rotina, Inspeção Sanitária..." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc">Instruções Complexas</Label>
                            <Textarea id="desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes textuais gigantes..." />
                        </div>

                        {/* Sub-itens Checklists UI */}
                        {tipo === "checklist" && (
                            <div className="mt-2 space-y-3 p-4 bg-muted/10 border border-dashed rounded-lg">
                                <Label className="text-sm font-semibold text-primary">Operações Descritivas (Check-in)</Label>

                                <div className="space-y-2">
                                    {itensVerificacao.map((item, index) => (
                                        <div key={item.id} className="flex gap-2 items-center">
                                            <Checkbox disabled />
                                            <Input
                                                value={item.texto}
                                                onChange={(e) => {
                                                    const iteracaoArray = [...itensVerificacao];
                                                    iteracaoArray[index].texto = e.target.value;
                                                    setItensVerificacao(iteracaoArray);
                                                }}
                                                placeholder={`Execução Passo ${index + 1}`}
                                                className="h-8 text-sm"
                                            />
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setItensVerificacao(itensVerificacao.filter(i => i.id !== item.id))}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2 items-center mt-2">
                                    <Input
                                        value={textoNovoItem}
                                        onChange={(e) => setTextoNovoItem(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); tentarAdicionarPasso(); } }}
                                        placeholder="Adicionar Passo..."
                                        className="h-8 text-sm"
                                    />
                                    <Button type="button" size="sm" variant="secondary" onClick={tentarAdicionarPasso} className="shrink-0 h-8">
                                        <Plus className="h-4 w-4 mr-1" /> Add
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => aoMudarEstado(false)} disabled={isGravando}>
                            Cancelar Ação
                        </Button>
                        <Button type="submit" disabled={isGravando || !titulo.trim()}>
                            {isGravando ? "Processando..." : "Salvar no Banco"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
