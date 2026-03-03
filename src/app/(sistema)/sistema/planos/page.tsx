'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';

export default function PlanosSistemaPage() {
    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 w-full max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Planos e Precificação</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie os pacotes comerciais do seu SaaS e os recursos atrelados a cada plano.
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Plano
                </Button>
            </div>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Catálogo de Produtos</CardTitle>
                    <CardDescription>A visão e criação de planos através da API do Asaas e regras internas.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                    <Package className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Nenhum plano dinâmico configurado (MVP)</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                        A criação de locatários atualmente utiliza precificação padrão. O painel completo de features vs preços será implementado na v2.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
