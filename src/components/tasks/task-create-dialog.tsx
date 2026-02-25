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
import type { TaskType, ChecklistItem } from "@/lib/types/tasks";

interface TaskCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultType?: TaskType;
    onSubmit: (data: any) => Promise<void>;
}

export function TaskCreateDialog({ open, onOpenChange, defaultType = "task", onSubmit }: TaskCreateDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States do formulário
    const [type, setType] = useState<TaskType>(defaultType);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignee, setAssignee] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState<"Alta" | "Média" | "Baixa">("Média");
    const [tagsInput, setTagsInput] = useState("");

    // States do Checklist
    const [checklistItems, setChecklistItems] = useState<Omit<ChecklistItem, "done">[]>([]);
    const [newItemText, setNewItemText] = useState("");

    // Resetar ao abrir
    useEffect(() => {
        if (open) {
            setType(defaultType);
            setTitle("");
            setDescription("");
            setAssignee("");
            setDueDate("");
            setPriority("Média");
            setTagsInput("");
            setChecklistItems(defaultType === "checklist" ? [{ id: crypto.randomUUID(), text: "" }] : []);
            setNewItemText("");
        }
    }, [open, defaultType]);

    const handleAddChecklistItem = () => {
        if (!newItemText.trim()) return;
        setChecklistItems([...checklistItems, { id: crypto.randomUUID(), text: newItemText }]);
        setNewItemText("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            const parsedTags = tagsInput.split(",").map(t => t.trim()).filter(t => t.length > 0);

            const payload = {
                title,
                description,
                type,
                status: "pending" as const, // O TypeScript exige tipagem fixa aqui com o const
                priority,
                assignee: assignee || undefined,
                dueDate: dueDate || undefined,
                tags: parsedTags.length > 0 ? parsedTags : undefined,
                checklistItems: type === "checklist" ? checklistItems.filter(i => i.text.trim() !== "").map(i => ({ ...i, done: false })) : undefined,
            };

            await onSubmit(payload);
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {type === "checklist" ? <ListTodo className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                            {type === "checklist" ? "Novo Checklist" : "Nova Tarefa"}
                        </DialogTitle>
                        <DialogDescription>
                            {type === "checklist"
                                ? "Crie uma atividade estruturada com passos de verificação obrigatórios."
                                : "Crie uma atividade de execução rápida ou pontual."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">

                        {/* Toggle Tipo Dinâmico */}
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Formato Checklist</Label>
                                <p className="text-xs text-muted-foreground">Converta esta tarefa em múltiplos passos.</p>
                            </div>
                            <Switch
                                checked={type === "checklist"}
                                onCheckedChange={(checked) => setType(checked ? "checklist" : "task")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Título <span className="text-destructive">*</span></Label>
                            <Input id="title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Higienização da Máquina" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="assignee">Responsável</Label>
                                <Select value={assignee} onValueChange={setAssignee}>
                                    <SelectTrigger id="assignee">
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
                                <Label htmlFor="priority">Prioridade</Label>
                                <Select value={priority} onValueChange={(v: "Alta" | "Média" | "Baixa") => setPriority(v)}>
                                    <SelectTrigger id="priority">
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
                            <Label htmlFor="dueDate">Prazo (opcional)</Label>
                            <Input id="dueDate" type="text" value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="Ex: Hoje, 18:00" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                            <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Cozinha, Limpeza, Diário..." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc">Descrição</Label>
                            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes opcionais sobre a atividade..." />
                        </div>

                        {/* Sub-itens Específicos do Checklist */}
                        {type === "checklist" && (
                            <div className="mt-2 space-y-3 p-4 bg-muted/10 border border-dashed rounded-lg">
                                <Label className="text-sm font-semibold">Itens de Verificação</Label>

                                <div className="space-y-2">
                                    {checklistItems.map((item, index) => (
                                        <div key={item.id} className="flex gap-2 items-center">
                                            <Checkbox disabled />
                                            <Input
                                                value={item.text}
                                                onChange={(e) => {
                                                    const newItems = [...checklistItems];
                                                    newItems[index].text = e.target.value;
                                                    setChecklistItems(newItems);
                                                }}
                                                placeholder={`Passo ${index + 1}`}
                                                className="h-8 text-sm"
                                            />
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setChecklistItems(checklistItems.filter(i => i.id !== item.id))}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2 items-center mt-2">
                                    <Input
                                        value={newItemText}
                                        onChange={(e) => setNewItemText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                                        placeholder="Adicionar novo passo..."
                                        className="h-8 text-sm"
                                    />
                                    <Button type="button" size="sm" variant="secondary" onClick={handleAddChecklistItem} className="shrink-0 h-8">
                                        <Plus className="h-4 w-4 mr-1" /> Add
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !title.trim()}>
                            {isSubmitting ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
