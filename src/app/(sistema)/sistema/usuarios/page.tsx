'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UsuariosSistemaPage() {
    const { toast } = useToast();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Usuários do Sistema</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Usuários com papel global (superadmin / suporte).
                    </p>
                </div>
                <Button onClick={() => toast({ title: "Em breve", description: "Listagem de master admin será atrelada na fase 1." })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar usuário do sistema
                </Button>
            </div>

            <Card className="border-dashed shadow-sm">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-muted/50 p-3 rounded-full mb-3 inline-flex">
                        <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">Nenhum usuário secundário</CardTitle>
                    <CardDescription>
                        Usuários do sistema aparecerão aqui.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center p-6 text-sm text-muted-foreground pt-0">
                    Integraremos ao Firebase na fase 1.
                </CardContent>
            </Card>
        </div>
    );
}
