'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePerfil } from '@/hooks/use-perfil';
import { podeAcessarPortal } from '@/lib/permissoes';
import type { PortalSistema } from '@/lib/permissoes';

interface GuardPortalProps {
  /** Portal que esta rota requer */
  portal: PortalSistema;
  children: React.ReactNode;
}

/**
 * GuardPortal — protege rotas por perfil de acesso.
 *
 * Portais suportados:
 * - 'sistema'     → saasAdmin
 * - 'empresa'     → gestorCorporativo
 * - 'unidade'     → gestorLocal
 * - 'operacional' → operacional
 */
export function GuardPortal({ portal, children }: GuardPortalProps) {
  const router = useRouter();
  const { usuarioAuth, carregandoAuth } = useAuth();
  const { perfilUsuario, carregandoPerfil, erroPerfil } = usePerfil();
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    if (carregandoAuth || carregandoPerfil) return;

    // Sem sessão → tela de login
    if (!usuarioAuth) {
      router.replace('/login');
      return;
    }

    // Perfil não provisionado
    if (erroPerfil?.message === 'PERFIL_NAO_PROVISIONADO') {
      router.replace('/perfil-nao-provisionado');
      return;
    }

    // Erro genérico de perfil
    if (erroPerfil || !perfilUsuario) {
      router.replace('/acesso-negado');
      return;
    }

    // Verificar acesso ao portal
    const temAcesso = podeAcessarPortal(perfilUsuario, portal);

    if (!temAcesso) {
      router.replace('/acesso-negado');
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
