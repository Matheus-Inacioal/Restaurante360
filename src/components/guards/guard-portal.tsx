'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePerfil } from '@/hooks/use-perfil';
import { podeAcessarSistema, podeAcessarEmpresa, podeAcessarOperacional } from '@/lib/autenticacao/permissoes';
import { Loader2 } from 'lucide-react';

interface GuardPortalProps {
    portal: 'sistema' | 'empresa' | 'operacional';
    children: ReactNode;
}

export function GuardPortal({ portal, children }: GuardPortalProps) {
    const router = useRouter();
    const { perfil, isCarregandoPerfil } = usePerfil();
    const [autorizado, setAutorizado] = useState(false);

    useEffect(() => {
        if (isCarregandoPerfil) return;

        if (!perfil) {
            router.replace('/login');
            return;
        }

        let temAcesso = false;
        if (portal === 'sistema') temAcesso = podeAcessarSistema(perfil);
        else if (portal === 'empresa') temAcesso = podeAcessarEmpresa(perfil);
        else if (portal === 'operacional') temAcesso = podeAcessarOperacional(perfil);

        if (!temAcesso) {
            router.replace('/acesso-negado');
            return;
        }

        setAutorizado(true);
    }, [perfil, isCarregandoPerfil, portal, router]);

    if (isCarregandoPerfil || !autorizado) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Autenticando sessão...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
