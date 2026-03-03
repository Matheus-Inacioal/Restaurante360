'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AssinaturasPage() {
    const { toast } = useToast();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assinaturas</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Planos, cobranças e status das assinaturas.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => toast({ title: "Em breve", description: "Integrações sendo configuradas." })}>
                        Ver integrações de pagamento
                    </Button>
                    <Button onClick={() => toast({ title: "Em breve", description: "Criação de planos integraremos na fase 1." })}>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar plano
                    </Button>
                </div>
            </div>

            <Card className="border-dashed shadow-sm">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-muted/50 p-3 rounded-full mb-3 inline-flex">
                        <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">Sem assinaturas ativas</CardTitle>
                    <CardDescription>
                        Assinaturas aparecerão aqui.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center p-6 text-sm text-muted-foreground pt-0">
                    Integraremos ao modulo financeiro na fase 1.
                </CardContent>
            </Card>
        </div>
    );
}
