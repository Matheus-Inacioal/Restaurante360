'use client';

import { GuardPortal } from '@/components/guards/guard-portal';
import { SidebarOperacional } from '@/components/sidebars/sidebar-operacional';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { usePerfil } from '@/hooks/use-perfil';

export default function LayoutOperacional({ children }: { children: React.ReactNode }) {
    const { perfil } = usePerfil();

    const mockUser = {
        name: perfil?.nome || 'Carregando...',
    };

    return (
        <GuardPortal portal="operacional">
            <SidebarProvider>
                <SidebarOperacional />
                <SidebarInset>
                    <Header user={mockUser} title="Área Operacional" configUrl="/operacional/configuracoes" />
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
