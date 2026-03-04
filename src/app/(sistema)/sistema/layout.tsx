'use client';

import { GuardPortal } from '@/components/guards/guard-portal';
import { SidebarSistema } from '@/components/sidebars/sidebar-sistema';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { usePerfil } from '@/hooks/use-perfil';

export default function LayoutSistema({ children }: { children: React.ReactNode }) {
    const { perfilUsuario } = usePerfil();

    const currentUser = {
        name: perfilUsuario?.nome || 'Gestor Master',
    };

    return (
        <GuardPortal portal="sistema">
            <SidebarProvider>
                <SidebarSistema />
                <SidebarInset>
                    <Header user={currentUser} title="Sistema" configUrl="/sistema/configuracoes" />
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
