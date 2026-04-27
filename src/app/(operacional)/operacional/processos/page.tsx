'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function ProcessosOperacionaisPage() {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Acesse os manuais, guias e procedimentos operacionais da sua unidade.
                </p>
            </div>

            <Card className="border-dashed border-2 shadow-sm bg-background/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Nenhum processo disponível</CardTitle>
                    <CardDescription>
                        Sua unidade ainda não disponibilizou procedimentos para consulta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pt-4 pb-8">
                    <Button asChild>
                        <Link href="/operacional">Voltar para o Início</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
