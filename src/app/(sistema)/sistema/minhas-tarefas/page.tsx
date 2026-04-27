'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck } from 'lucide-react';
import Link from 'next/link';

export default function MinhasTarefasPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Minhas Tarefas</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Acompanhe e gerencie as tarefas atribuídas a você.
                </p>
            </div>

            <Card className="border-dashed border-2 shadow-sm bg-background/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <ClipboardCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Nenhuma tarefa no momento</CardTitle>
                    <CardDescription>
                        Você não possui tarefas pendentes atribuídas para o seu turno atual.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pt-4 pb-8">
                    <Button asChild>
                        <Link href="/sistema">Voltar para o Início</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
