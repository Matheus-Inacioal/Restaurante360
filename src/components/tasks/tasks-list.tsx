import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle2, Circle, Clock, FileText, Check, Copy } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Task } from "@/lib/types/tasks";

interface TasksListProps {
    tasks: Task[];
    selectedTaskId: string | null;
    onSelectTask: (id: string) => void;
    onDuplicateTask?: (task: Task) => void;
    onCompleteTask?: (id: string) => void;
    onDeleteTask?: (id: string) => void;
}

export function TasksList({ tasks, selectedTaskId, onSelectTask, onDuplicateTask, onCompleteTask, onDeleteTask }: TasksListProps) {
    if (tasks.length === 0) {
        return (
            <Card className="h-full bg-muted/10 border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="font-semibold text-lg">Nenhuma tarefa encontrada</h3>
                    <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                        Experimente alterar os filtros acima ou crie uma nova tarefa/checklist.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Helper para renderizar Badge de Status
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "delayed":
                return <Badge variant="destructive" className="text-[10px] h-5">Atrasada</Badge>;
            case "done":
                return <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">Concluída</Badge>;
            case "in_progress":
                return <Badge variant="secondary" className="text-[10px] h-5 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400">Em progresso</Badge>;
            default:
                return <Badge variant="secondary" className="text-[10px] h-5 text-muted-foreground">Pendente</Badge>;
        }
    };

    // Helper para renderizar a prioridade
    const renderPriority = (priority: string) => {
        switch (priority) {
            case "Alta":
                return <div className="flex items-center text-xs text-destructive font-medium"><div className="w-1.5 h-1.5 rounded-full bg-destructive mr-1.5" />Alta</div>;
            case "Média":
                return <div className="flex items-center text-xs text-orange-500 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5" />Média</div>;
            default:
                return <div className="flex items-center text-xs text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-1.5" />Baixa</div>;
        }
    };

    return (
        <div className="space-y-3">
            {tasks.map((task) => {
                const isSelected = selectedTaskId === task.id;

                return (
                    <div
                        key={task.id}
                        onClick={() => onSelectTask(task.id)}
                        className={`
              flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg cursor-pointer transition-all
              ${isSelected ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-card hover:bg-muted/40 hover:border-muted-foreground/30'}
              ${task.status === 'delayed' && !isSelected ? 'border-destructive/20 bg-destructive/5' : ''}
            `}
                    >
                        {/* Lado Esquerdo do Card */}
                        <div className="flex items-start gap-4">
                            <div className="mt-1 shrink-0">
                                {task.status === "done" ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                ) : task.status === "delayed" ? (
                                    <Clock className="h-5 w-5 text-destructive" />
                                ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>

                            <div className="space-y-1.5 w-full">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-base leading-none">{task.title}</span>
                                    {renderStatusBadge(task.status)}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        {task.type === "checklist" ? <FileText className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                                        <span>{task.type === "checklist" ? "Checklist" : "Tarefa"}</span>
                                    </div>
                                    <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-border" />
                                    <span className="font-medium text-foreground">{task.assignee}</span>
                                    <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-border" />
                                    <span>Prazo: {task.dueDate}</span>
                                    <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-border" />
                                    {renderPriority(task.priority)}
                                </div>

                                {task.tags && task.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {task.tags.map(tag => (
                                            <em key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted border font-medium not-italic">
                                                {tag}
                                            </em>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ações (Lado Direito do Card) */}
                        <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-4" onClick={(e) => e.stopPropagation()}>
                            {task.status !== "done" && (
                                <Button variant="ghost" size="sm" className="hidden sm:flex h-8 w-8 p-0" title="Marcar como Concluída" onClick={() => onCompleteTask?.(task.id)}>
                                    <Check className="h-4 w-4 text-primary" />
                                </Button>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuItem>Editar</DropdownMenuItem>
                                    <DropdownMenuItem>Reatribuir</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicateTask?.(task)}>
                                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => onDeleteTask?.(task.id)}>
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
