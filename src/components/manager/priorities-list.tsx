import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, ChevronRight, FileText, ClipboardList } from "lucide-react";
import Link from "next/link";

export type PriorityItem = {
    id: string;
    type: 'tarefa' | 'rotina' | 'processo';
    title: string;
    assignee: string;
    deadline: string;
    status: 'atrasado' | 'hoje' | 'ok';
};

export function PrioritiesList({ items }: { items: PriorityItem[] }) {
    if (!items || items.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Prioridades agora</CardTitle>
                    <CardDescription>Itens que precisam da sua atenção.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center h-[250px]">
                    <div className="p-4 bg-muted/30 rounded-full mb-4">
                        <CheckCircle2 className="h-8 w-8 text-primary/60" />
                    </div>
                    <h3 className="font-medium text-lg mb-1">Tudo em dia! 🎉</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        Nenhuma pendência ou rotina crítica no momento.
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild className="hidden sm:flex text-xs h-7">
                            <Link href="/dashboard/tarefas">Ver Todas</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/routines">Criar rotina</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Prioridades agora</CardTitle>
                <CardDescription>Itens ordenados por urgência da operação.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-start sm:items-center justify-between space-y-2 sm:space-y-0 p-3 bg-muted/20 border rounded-lg transition-colors hover:bg-muted/40">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    {item.type === 'tarefa' && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                                    {item.type === 'rotina' && <Clock className="h-5 w-5 text-orange-500" />}
                                    {item.type === 'processo' && <FileText className="h-5 w-5 text-purple-500" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm leading-none">{item.title}</p>
                                        <Badge variant={item.status === 'atrasado' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 h-4">
                                            {item.status === 'atrasado' ? 'Atrasado' : 'Para hoje'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                        <span className="font-medium">{item.assignee}</span>
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <span>Prazo: {item.deadline}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4 shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalhes">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
