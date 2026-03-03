'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, Search } from 'lucide-react';

export default function CobrancasSistemaGlobaisPage() {
    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 w-full max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
                    <p className="text-muted-foreground mt-1">
                        Histórico global de todas as faturas e cobranças avulsas emitidas pela matriz.
                    </p>
                </div>
                <Button variant="outline">
                    <Search className="mr-2 h-4 w-4" />
                    Filtrar Inadimplência
                </Button>
            </div>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Painel do SuperAdmin Financeiro</CardTitle>
                    <CardDescription>Relatórios e logs centralizados acoplados ao webhook e eventos Asaas.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                    <Receipt className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Relatório unificado em construção</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                        No momento, observe as cobranças individualmente no painel interno de "Ver Empresas" ou utilizando o Dashboard local em `/empresa/assinatura`.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
