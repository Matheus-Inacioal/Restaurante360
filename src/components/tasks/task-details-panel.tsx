"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { X, Calendar, User, Tag, Clock, CheckCircle2, Paperclip, MessageSquare, FileText } from "lucide-react";
import type { Task } from "@/lib/types/tasks";

interface TaskDetailsPanelProps {
    task: Task | null;
    onClose?: () => void;
    onToggleChecklistItem?: (taskId: string, itemId: string, done: boolean) => void;
    onCompleteTask?: (taskId: string) => void;
}

export function TaskDetailsPanel({ task, onClose, onToggleChecklistItem, onCompleteTask }: TaskDetailsPanelProps) {
    if (!task) {
        return (
            <Card className="h-full bg-muted/5 border-dashed flex flex-col items-center justify-center p-8 text-center min-h-[500px]">
                <div className="p-4 bg-muted/20 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-medium text-lg text-muted-foreground">Detalhes da Tarefa</h3>
                <p className="text-muted-foreground/70 text-sm mt-1 max-w-[200px]">
                    Selecione uma tarefa na lista ao lado para visualizar os detalhes.
                </p>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col border shadow-sm overflow-hidden min-h-[600px] sticky top-4">

            {/* HEADER DO PAINEL */}
            <CardHeader className="px-5 py-4 border-b bg-card space-y-3 shrink-0">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 relative pr-4">
                        <Badge variant={task.status === "done" ? "default" : task.status === "delayed" ? "destructive" : "secondary"} className="mb-2">
                            {task.status === "done" ? "Concluída" : task.status === "in_progress" ? "Em andamento" : task.status === "delayed" ? "Atrasada" : "Pendente"}
                        </Badge>
                        <CardTitle className="text-xl leading-tight">{task.title}</CardTitle>
                    </div>
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0 md:hidden">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mt-4">
                    <div className="flex flex-col space-y-1">
                        <span className="text-muted-foreground text-xs flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Responsável</span>
                        <span className="font-medium">{task.assignee}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                        <span className="text-muted-foreground text-xs flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Prazo Final</span>
                        <span className="font-medium">{task.dueDate}</span>
                    </div>
                    <div className="flex flex-col space-y-1 col-span-2 mt-1">
                        <span className="text-muted-foreground text-xs flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Tags</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {task.tags?.map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] font-normal px-2 bg-muted/30">{tag}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>

            {/* ÁREA DE SCROLL (CONTEÚDO) */}
            <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="p-5 space-y-6">

                    {/* Descrição */}
                    {task.description && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Descrição
                            </h4>
                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap rounded-md bg-muted/20 p-3">
                                {task.description}
                            </p>
                        </div>
                    )}

                    <Separator />

                    {/* Área de Checklist Interativo (se type === 'checklist') */}
                    {task.type === "checklist" && task.checklistItems && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                Itens de Verificação
                                <span className="text-xs font-normal text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded-full">
                                    {task.checklistItems.filter(i => i.done).length} / {task.checklistItems.length}
                                </span>
                            </h4>

                            <div className="space-y-2.5">
                                {task.checklistItems.map((item) => (
                                    <div key={item.id} className="flex items-start space-x-3 bg-muted/10 p-2.5 rounded-lg border border-transparent hover:border-border transition-colors group">
                                        <Checkbox
                                            id={item.id}
                                            checked={item.done}
                                            onCheckedChange={(checked) => onToggleChecklistItem?.(task.id, item.id, checked as boolean)}
                                            className="mt-0.5"
                                        />
                                        <label
                                            htmlFor={item.id}
                                            className={`text-sm leading-tight cursor-pointer ${item.done ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}
                                        >
                                            {item.text}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(task.type === "checklist" && task.checklistItems) && <Separator />}

                    {/* Anexos Placeholder */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Paperclip className="h-4 w-4 text-muted-foreground" /> Anexos
                            </h4>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">Adicionar Anexo</Button>
                        </div>
                        <div className="border border-dashed rounded-lg p-4 text-center bg-muted/10">
                            <p className="text-xs text-muted-foreground">Nenhuma imagem de evidência fornecida.</p>
                        </div>
                    </div>

                    {/* Comentários Placeholder */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" /> Comentários
                        </h4>
                        <div className="space-y-4">
                            <Textarea placeholder="Adicione instruções ou comunique um atraso..." className="text-sm min-h-[80px]" />
                            <Button size="sm" className="w-full">Enviar Comentário</Button>
                        </div>
                    </div>

                </div>
            </CardContent>

            {/* FOOTER FIXO */}
            <div className="p-4 border-t bg-muted/10 shrink-0">
                {task.status === "done" ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium py-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Concluída em {new Date(task.updatedAt).toLocaleDateString('pt-BR')}
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">Pausar</Button>
                        <Button className="flex-1" onClick={() => onCompleteTask?.(task.id)}>Concluir {task.type === 'checklist' ? 'Checklist' : 'Tarefa'}</Button>
                    </div>
                )}
            </div>

        </Card>
    );
}
