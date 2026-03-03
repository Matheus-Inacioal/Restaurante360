'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { usePerfil } from '@/hooks/use-perfil';
import { useAuth } from '@/hooks/use-auth';

export default function AcessoNegadoPage() {
    const { perfil } = usePerfil();
    const { logout } = useAuth();

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
            <Card className="mx-auto max-w-md w-full shadow-lg border-destructive/20">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-destructive/10 rounded-full inline-block">
                            <ShieldAlert className="h-10 w-10 text-destructive" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Acesso não autorizado</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Você não possui permissões suficientes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="bg-muted p-3 rounded-md text-left">
                        <p className="font-semibold text-foreground mb-1">Motivos possíveis:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Sua conta está inativa.</li>
                            <li>Seu usuário não possui um papel definido.</li>
                            <li>Você não está vinculado a uma empresa.</li>
                        </ul>
                    </div>

                    {perfil?.email && (
                        <p className="text-center font-medium">
                            Conectado como: <span className="text-foreground">{perfil.email}</span>
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <Button variant="outline" onClick={() => logout()} className="w-full sm:w-auto">
                        Voltar ao Login
                    </Button>
                    <Button asChild className="w-full sm:w-auto">
                        <span className="cursor-pointer">Falar com o gestor</span>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
