'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock } from 'lucide-react';
import Link from 'next/link';

export default function RotinasPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Rotinas</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Gerencie as rotinas de abertura, fechamento e limpezas da unidade.
                </p>
            </div>

            <Card className="border-dashed border-2 shadow-sm bg-background/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <CalendarClock className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Nenhuma rotina configurada</CardTitle>
                    <CardDescription>
                        Ainda não existem rotinas ativas para esta unidade.
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
