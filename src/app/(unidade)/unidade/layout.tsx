'use client';

import { GuardPortal } from '@/components/guards/guard-portal';
import { SidebarUnidade } from '@/components/sidebars/sidebar-unidade';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { usePerfil } from '@/hooks/use-perfil';

export default function LayoutUnidade({ children }: { children: React.ReactNode }) {
  const { perfilUsuario } = usePerfil();

  const currentUser = {
    name: perfilUsuario?.nome || 'Carregando...',
  };

  const tituloUnidade = (perfilUsuario as any)?.unidade?.nome
    ? `Unidade — ${(perfilUsuario as any).unidade.nome}`
    : 'Painel da Unidade';

  return (
    <GuardPortal portal="unidade">
      <SidebarProvider>
        <SidebarUnidade />
        <SidebarInset>
          <Header user={currentUser} title={tituloUnidade} configUrl="/unidade/configuracoes" />
          <div className="w-full px-8 py-8">
            <div className="max-w-[1200px] mx-auto space-y-8">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </GuardPortal>
  );
}
