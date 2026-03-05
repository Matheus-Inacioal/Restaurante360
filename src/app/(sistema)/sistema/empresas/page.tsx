'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2 } from 'lucide-react';
import { ModalCriarEmpresa } from '@/components/sistema/modal-criar-empresa';

export default function EmpresasPage() {
    const [isCriarOpen, setIsCriarOpen] = useState(false);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Crie e gerencie empresas (tenants) do sistema.
                    </p>
                </div>
                <Button onClick={() => setIsCriarOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova empresa
                </Button>
            </div>

            <Card className="border-dashed shadow-sm">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-muted/50 p-3 rounded-full mb-3 inline-flex">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">Nenhuma empresa encontrada</CardTitle>
                    <CardDescription>
                        Empresas cadastradas aparecerão aqui.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center p-6 text-sm text-muted-foreground pt-0">
                    Integraremos a exibição das empresas na fase 1.
                </CardContent>
            </Card>

            <ModalCriarEmpresa
                open={isCriarOpen}
                onOpenChange={setIsCriarOpen}
            />
        </div>
    );
}

