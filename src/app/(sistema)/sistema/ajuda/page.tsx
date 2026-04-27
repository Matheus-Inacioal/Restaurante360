'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeBuoy } from 'lucide-react';
import Link from 'next/link';

export default function AjudaPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Central de Ajuda</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Encontre respostas para as suas dúvidas e acesse o suporte do sistema.
                </p>
            </div>

            <Card className="border-dashed border-2 shadow-sm bg-background/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <LifeBuoy className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Base de Conhecimento</CardTitle>
                    <CardDescription>
                        Estamos construindo os artigos de ajuda para a sua equipe.
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
