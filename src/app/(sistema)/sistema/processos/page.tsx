'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function ProcessosPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Consulte os manuais, fichas técnicas e procedimentos operacionais padrão (POP).
                </p>
            </div>

            <Card className="border-dashed border-2 shadow-sm bg-background/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Nenhum processo cadastrado</CardTitle>
                    <CardDescription>
                        A base de conhecimento da sua unidade ainda está vazia.
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
