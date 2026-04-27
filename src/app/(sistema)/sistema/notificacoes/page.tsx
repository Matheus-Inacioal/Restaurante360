'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import Link from 'next/link';

export default function NotificacoesPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Histórico de alertas e avisos importantes do sistema.
                </p>
            </div>

            <Card className="border-dashed border-2 shadow-sm bg-background/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                        <Bell className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Você não tem novas notificações</CardTitle>
                    <CardDescription>
                        Tudo limpo por aqui. Avisaremos quando houver novidades.
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
