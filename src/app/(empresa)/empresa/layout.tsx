'use client';

import { GuardPortal } from '@/components/guards/guard-portal';
import { SidebarEmpresa } from '@/components/sidebars/sidebar-empresa';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { usePerfil } from '@/hooks/use-perfil';

export default function LayoutEmpresa({ children }: { children: React.ReactNode }) {
    const { perfilUsuario } = usePerfil();

    const currentUser = {
        name: perfilUsuario?.nome || 'Carregando...',
    };

    return (
        <GuardPortal portal="empresa">
            <SidebarProvider>
                <SidebarEmpresa />
                <SidebarInset>
                    <Header user={currentUser} title="Painel da Empresa" configUrl="/empresa/configuracoes" />
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
