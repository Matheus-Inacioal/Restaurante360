"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePerfil } from "@/hooks/use-perfil";
import { podeAcessarPortal } from "@/lib/permissoes";
import { PapelPortal } from "@/lib/types/identidade";

interface GuardPortalProps {
    portal: "sistema" | "empresa" | "operacional";
    children: React.ReactNode;
}

export function GuardPortal({ portal, children }: GuardPortalProps) {
    const router = useRouter();
    const { usuarioAuth, carregandoAuth } = useAuth();
    const { perfilUsuario, carregandoPerfil, erroPerfil } = usePerfil();
    const [autorizado, setAutorizado] = useState(false);

    useEffect(() => {
        if (carregandoAuth || carregandoPerfil) return;

        if (!usuarioAuth) {
            router.replace("/login");
            return;
        }

        if (erroPerfil?.message === "PERFIL_NAO_PROVISIONADO") {
            router.replace("/perfil-nao-provisionado");
            return;
        }

        let temAcesso = false;
        if (perfilUsuario) {
            const portalMapped = portal.toUpperCase() as PapelPortal;
            temAcesso = podeAcessarPortal(perfilUsuario, portalMapped);
        }

        if (!temAcesso) {
            router.replace("/acesso-negado");
            return;
        }

        setAutorizado(true);
    }, [usuarioAuth, perfilUsuario, carregandoAuth, carregandoPerfil, erroPerfil, portal, router]);

    if (carregandoAuth || carregandoPerfil || !autorizado) {
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
