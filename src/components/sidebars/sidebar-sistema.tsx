'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Building2,
    ShieldCheck,
    Users,
    Settings,
    UtensilsCrossed,
    ClipboardCheck,
    CalendarClock,
    BookOpen,
    Bell,
    LifeBuoy
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';

import { usePerfil } from '@/hooks/use-perfil';

const navItems = [
    { href: '/sistema', label: 'Visão Geral', icon: LayoutDashboard },
    { href: '/sistema/minhas-tarefas', label: 'Minhas Tarefas', icon: ClipboardCheck },
    { href: '/sistema/rotinas', label: 'Rotinas', icon: CalendarClock },
    { href: '/sistema/processos', label: 'Processos', icon: BookOpen },
    { href: '/sistema/empresas', label: 'Empresas', icon: Building2, adminOnly: true },
    { href: '/sistema/assinaturas', label: 'Assinaturas', icon: ShieldCheck, adminOnly: true },
    { href: '/sistema/usuarios', label: 'Usuários do Sistema', icon: Users, adminOnly: true },
    { href: '/sistema/usuarios-permissoes', label: 'Permissões da Equipe', icon: ShieldCheck },
    { href: '/sistema/notificacoes', label: 'Notificações', icon: Bell },
    { href: '/sistema/ajuda', label: 'Ajuda', icon: LifeBuoy },
    { href: '/sistema/configuracoes', label: 'Configurações', icon: Settings },
];

export function SidebarSistema() {
    const pathname = usePathname();
    const { perfilUsuario } = usePerfil();

    const isSaaSAdmin = perfilUsuario?.papel === 'saasAdmin';
    const itemsFiltrados = navItems.filter(item => !item.adminOnly || isSaaSAdmin);

    return (
        <Sidebar side="left" variant="sidebar" collapsible="icon">
            <SidebarHeader className="p-4">
                <Link href="/sistema" className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground hover:text-sidebar-primary transition-colors">
                    <div className="p-2 bg-sidebar-primary rounded-lg">
                        <UtensilsCrossed className="h-6 w-6 text-sidebar-primary-foreground" />
                    </div>
                    <span className="font-headline group-data-[collapsible=icon]:hidden">
                        Restaurante360
                    </span>
                </Link>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <SidebarMenu>
                    {itemsFiltrados.map((item) => {
                        const isActive = item.href === '/sistema'
                            ? pathname === '/sistema'
                            : pathname.startsWith(item.href);

                        return (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                                    <Link href={item.href}>
                                        <item.icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}
