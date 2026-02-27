"use client";

import { useState, useEffect } from "react";
import { Plus, X, ListChecks, CheckSquare, GripVertical, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Rotina, FrequenciaRotina } from "@/lib/types/rotinas";

interface ModalRotinaProps {
    aberto: boolean;
    aoMudarEstado: (aberto: boolean) => void;
    rotinaEdicao?: Rotina | null;
    aoGravar: (dados: Omit<Rotina, "id" | "criadoEm" | "atualizadoEm" | "empresaId" | "criadoPor">) => Promise<void>;
}

export function ModalRotina({ aberto, aoMudarEstado, rotinaEdicao, aoGravar }: ModalRotinaProps) {
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [ativa, setAtiva] = useState(true);
    const [frequencia, setFrequencia] = useState<FrequenciaRotina>("diaria");
    const [diasSemana, setDiasSemana] = useState<number[]>([]);
    const [diaDoMes, setDiaDoMes] = useState<string>("");
    const [tipoTarefaGerada, setTipoTarefaGerada] = useState<"tarefa" | "checklist">("tarefa");
    const [horarioPreferencial, setHorarioPreferencial] = useState("");
    const [responsavelPadraoId, setResponsavelPadraoId] = useState("");
    const [tagsTexto, setTagsTexto] = useState("");
    const [checklistItems, setChecklistItems] = useState<{ id: string; texto: string }[]>([]);
    const [novoItem, setNovoItem] = useState("");

    const [isSubmetendo, setIsSubmetendo] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // Carregar dados de edição se for o caso
    useEffect(() => {
        if (aberto && rotinaEdicao) {
            setTitulo(rotinaEdicao.titulo);
            setDescricao(rotinaEdicao.descricao || "");
            setAtiva(rotinaEdicao.ativa ?? true);
            setFrequencia(rotinaEdicao.frequencia || "diaria");
            setDiasSemana(rotinaEdicao.diasSemana || []);
            setDiaDoMes(rotinaEdicao.diaDoMes ? rotinaEdicao.diaDoMes.toString() : "");
            setTipoTarefaGerada(rotinaEdicao.tipoTarefaGerada);
            setHorarioPreferencial(rotinaEdicao.horarioPreferencial || "");
            setResponsavelPadraoId(rotinaEdicao.responsavelPadraoId || "");
            setTagsTexto(rotinaEdicao.tags?.join(", ") || "");
            setChecklistItems(rotinaEdicao.checklistModelo || []);
        } else if (aberto && !rotinaEdicao) {
            // Resetar formulário
            setTitulo("");
            setDescricao("");
            setAtiva(true);
            setFrequencia("diaria");
            setDiasSemana([]);
            setDiaDoMes("");
            setTipoTarefaGerada("tarefa");
            setHorarioPreferencial("");
            setResponsavelPadraoId("");
            setTagsTexto("");
            setChecklistItems([]);
            setNovoItem("");
            setErro(null);
        }
    }, [aberto, rotinaEdicao]);

    const handleAdicionarItemValido = () => {
        const textoLimpado = novoItem.trim();
        if (!textoLimpado) return;
        setChecklistItems(prev => [...prev, { id: crypto.randomUUID(), texto: textoLimpado }]);
        setNovoItem("");
    };

    const handleRemoverItem = (id: string) => {
        setChecklistItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = async () => {
        setErro(null);

        if (!titulo.trim()) {
            setErro("O título da rotina é obrigatório.");
            return;
        }

        if (tipoTarefaGerada === "checklist" && checklistItems.length === 0 && !novoItem.trim()) {
            setErro("O checklist precisa ter pelo menos um item.");
            return;
        }

        if (frequencia === "semanal" && diasSemana.length === 0) {
            setErro("Para frequência semanal, selecione pelo menos um dia da semana.");
            return;
        }

        if (frequencia === "mensal") {
            const diaNum = Number(diaDoMes);
            if (!diaDoMes || isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
                setErro("Para frequência mensal, informe um dia válido (entre 1 e 31).");
                return;
            }
        }

        // Se o usuario digitou mas nao clicou em + (Ux fail safe)
        const checkItemsFinais = [...checklistItems];
        if (tipoTarefaGerada === "checklist" && novoItem.trim()) {
            checkItemsFinais.push({ id: crypto.randomUUID(), texto: novoItem.trim() });
        }

        const tagsProcessadas = tagsTexto
            .split(",")
            .map(t => t.trim())
            .filter(t => t.length > 0);

        setIsSubmetendo(true);
        try {
            await aoGravar({
                titulo: titulo.trim(),
                descricao: descricao.trim() || undefined,
                ativa: ativa,
                frequencia: frequencia,
                diasSemana: frequencia === "semanal" ? diasSemana : undefined,
                diaDoMes: frequencia === "mensal" ? Number(diaDoMes) : undefined,
                tipoTarefaGerada,
                horarioPreferencial: horarioPreferencial || undefined,
                responsavelPadraoId: responsavelPadraoId && responsavelPadraoId !== "nenhum" ? responsavelPadraoId : undefined,
                tags: tagsProcessadas.length > 0 ? tagsProcessadas : undefined,
                checklistModelo: tipoTarefaGerada === "checklist" ? checkItemsFinais : undefined,
                // responsavelPadraoId: omitido p/ simplificar a prop de MOCK
            });
            aoMudarEstado(false);
        } catch (error: any) {
            setErro(error.message || "Erro desconhecido ao gravar.");
        } finally {
            setIsSubmetendo(false);
        }
    };

    return (
        <Dialog open={aberto} onOpenChange={aoMudarEstado}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b shrink-0 bg-muted/30">
                    <DialogTitle className="text-xl">{rotinaEdicao ? "Editar Rotina" : "Nova Rotina Diária"}</DialogTitle>
                    <DialogDescription>
                        Configure uma execução automática recorrente. As tarefas serão geradas baseadas neste modelo.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    {erro && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 animate-in fade-in zoom-in-95 duration-200">
                            {erro}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="titulo" className="text-foreground after:content-['*'] after:ml-0.5 after:text-destructive">
                                Título Desmonstrativo
                            </Label>
                            <Input
                                id="titulo"
                                placeholder="Ex: Higienização da Máquina de Gelo"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                autoFocus
                                className="h-10 border-muted-foreground/30 focus-visible:ring-primary/40 focus-visible:border-primary"
                            />
                        </div>

                        <div className="flex gap-6 border rounded-xl p-4 bg-background shadow-sm">
                            <div className="flex flex-1 items-center justify-between pr-4">
                                <div className="space-y-0.5 max-w-[200px]">
                                    <Label className="text-foreground">Rotina Ativa?</Label>
                                    <p className="text-xs text-muted-foreground leading-snug">Rotinas ativas geram tarefas automaticamente nos dias programados.</p>
                                </div>
                                <Switch checked={ativa} onCheckedChange={setAtiva} />
                            </div>
                            <div className="flex-1 flex flex-col justify-center border-l pl-6 gap-1.5">
                                <Label className="text-foreground">Frequência</Label>
                                <Select value={frequencia} onValueChange={(v) => setFrequencia(v as FrequenciaRotina)}>
                                    <SelectTrigger className="w-full h-9 border-muted-foreground/30 focus:ring-primary/40">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="diaria">Diária</SelectItem>
                                        <SelectItem value="semanal">Semanal</SelectItem>
                                        <SelectItem value="mensal">Mensal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {frequencia === "semanal" && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200 p-4 border rounded-xl bg-muted/5">
                                <Label className="text-foreground">Dias da Semana <span className="text-destructive">*</span></Label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { v: 0, l: "Dom" },
                                        { v: 1, l: "Seg" },
                                        { v: 2, l: "Ter" },
                                        { v: 3, l: "Qua" },
                                        { v: 4, l: "Qui" },
                                        { v: 5, l: "Sex" },
                                        { v: 6, l: "Sáb" }
                                    ].map(dia => {
                                        const isSel = diasSemana.includes(dia.v);
                                        return (
                                            <Button
                                                key={dia.v}
                                                type="button"
                                                variant={isSel ? "default" : "outline"}
                                                size="sm"
                                                className={`h-9 px-3 transition-all ${isSel ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                                                onClick={() => {
                                                    setDiasSemana(prev =>
                                                        prev.includes(dia.v) ? prev.filter(d => d !== dia.v) : [...prev, dia.v]
                                                    );
                                                }}
                                            >
                                                {dia.l}
                                            </Button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {frequencia === "mensal" && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200 p-4 border rounded-xl bg-muted/5">
                                <Label className="text-foreground">Dia do Mês <span className="text-destructive">*</span></Label>
                                <Select value={diaDoMes} onValueChange={setDiaDoMes}>
                                    <SelectTrigger className="w-40 h-10 border-muted-foreground/30 focus:ring-primary/40">
                                        <SelectValue placeholder="Dia 1 ao 31" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[220px]">
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                            <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="descricao" className="text-foreground flex items-center justify-between">
                                Contexto e Orientações Opcionais
                                <span className="text-xs text-muted-foreground font-normal">Sempre exibido na tarefa</span>
                            </Label>
                            <Textarea
                                id="descricao"
                                placeholder="Especifique produtos, C.A's de maquinário ou processos que devem ser acompanhados na execução..."
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                className="resize-none h-20 border-muted-foreground/30 focus-visible:ring-primary/40 focus-visible:border-primary"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2 bg-muted/20 p-4 rounded-xl border border-muted-foreground/10">
                                <Label className="text-foreground">O que esta rotina gera todo dia?</Label>
                                <RadioGroup value={tipoTarefaGerada} onValueChange={(v) => setTipoTarefaGerada(v as any)} className="space-y-2 mt-1">
                                    <div className={`flex items-start space-x-3 p-2.5 rounded-lg border transition-colors ${tipoTarefaGerada === 'tarefa' ? 'bg-background border-primary shadow-sm' : 'border-transparent hover:bg-muted/50 cursor-pointer'}`}>
                                        <RadioGroupItem value="tarefa" id="t-tarefa" className="mt-1" />
                                        <div className="space-y-1" onClick={() => setTipoTarefaGerada("tarefa")}>
                                            <Label htmlFor="t-tarefa" className="flex items-center gap-2 cursor-pointer font-medium">
                                                <CheckSquare className="w-4 h-4 text-emerald-500" /> Tarefa Direta
                                            </Label>
                                            <p className="text-xs text-muted-foreground cursor-pointer">Uma ação simples que é dada como "Feita" usando apenas status.</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-start space-x-3 p-2.5 rounded-lg border transition-colors ${tipoTarefaGerada === 'checklist' ? 'bg-background border-primary shadow-sm' : 'border-transparent hover:bg-muted/50 cursor-pointer'}`}>
                                        <RadioGroupItem value="checklist" id="t-check" className="mt-1" />
                                        <div className="space-y-1" onClick={() => setTipoTarefaGerada("checklist")}>
                                            <Label htmlFor="t-check" className="flex items-center gap-2 cursor-pointer font-medium">
                                                <ListChecks className="w-4 h-4 text-blue-500" /> Checklist Múltiplo
                                            </Label>
                                            <p className="text-xs text-muted-foreground cursor-pointer">Uma lista de itens que devem ser checados (tick) individualmente.</p>
                                        </div>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="horario">
                                        Horário Preferencial <span className="text-xs text-muted-foreground font-normal">(Definirá o Prazo)</span>
                                    </Label>
                                    <Input
                                        id="horario"
                                        type="time"
                                        value={horarioPreferencial}
                                        onChange={(e) => setHorarioPreferencial(e.target.value)}
                                        className="w-32"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="responsavel">Responsável Padrão <span className="text-xs text-muted-foreground font-normal">(Opcional)</span></Label>
                                    <Select value={responsavelPadraoId} onValueChange={setResponsavelPadraoId}>
                                        <SelectTrigger id="responsavel" className="w-full h-10 border-muted-foreground/30 focus:ring-primary/40">
                                            <SelectValue placeholder="Sem designação" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nenhum">Sem designação</SelectItem>
                                            <SelectItem value="user_matheus_99">Matheus (Atendente)</SelectItem>
                                            <SelectItem value="user_gerente_01">Gerente Geral</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tags">Tags <span className="text-xs text-muted-foreground font-normal">(Separadas por vírgula)</span></Label>
                                    <Input
                                        id="tags"
                                        placeholder="Ex: cozinha, matinal, estoque"
                                        value={tagsTexto}
                                        onChange={(e) => setTagsTexto(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {tipoTarefaGerada === "checklist" && (
                            <div className="mt-6 space-y-3 pt-6 border-t animate-in slide-in-from-bottom-2 fade-in">
                                <div className="flex items-center justify-between">
                                    <Label className="text-foreground font-semibold flex items-center gap-2">
                                        <ListChecks className="w-4 h-4" />
                                        Modelo Interativo do Checklist
                                    </Label>
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                                        {checklistItems.length} {checklistItems.length === 1 ? 'passo definido' : 'passos definidos'}
                                    </span>
                                </div>

                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {checklistItems.map((item, i) => (
                                        <div key={item.id} className="flex items-center gap-2 group p-1 -ml-1 rounded-md hover:bg-muted/50 transition-colors">
                                            <div className="w-6 flex justify-center opacity-40 cursor-grab hover:opacity-100">
                                                <GripVertical className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 text-sm bg-background border px-3 py-2 rounded-md font-medium text-foreground">
                                                {item.texto}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8 text-muted-foreground opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoverItem(item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <Input
                                        placeholder="Digite uma nova etapa/validação aqui..."
                                        value={novoItem}
                                        onChange={(e) => setNovoItem(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAdicionarItemValido();
                                            }
                                        }}
                                        className="h-10 bg-background/50 border-dashed border-2 hover:border-primary/50 hover:bg-background focus:bg-background focus:border-solid transition-colors"
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleAdicionarItemValido}
                                        disabled={!novoItem.trim()}
                                        className="shrink-0 h-10 w-10 p-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 border-t bg-muted/10 shrink-0">
                    <Button variant="outline" onClick={() => aoMudarEstado(false)} disabled={isSubmetendo}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmetendo} className="min-w-[120px]">
                        {isSubmetendo ? "Registrando..." : "Salvar Rotina"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
