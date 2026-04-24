'use client';

/**
 * Sidebar do Portal Unidade — gestorLocal
 * Navegação para gestores responsáveis por uma unidade específica
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  CalendarClock,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  UtensilsCrossed,
  MapPin,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/unidade', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/unidade/tarefas', label: 'Tarefas', icon: ClipboardCheck },
  { href: '/unidade/rotinas', label: 'Rotinas', icon: CalendarClock },
  { href: '/unidade/processos', label: 'Processos', icon: BookOpen },
  { href: '/unidade/equipe', label: 'Equipe', icon: Users },
  { href: '/unidade/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/unidade/configuracoes', label: 'Configurações', icon: Settings },
];

export function SidebarUnidade() {
  const pathname = usePathname();

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link
          href="/unidade"
          className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground hover:text-sidebar-primary transition-colors"
        >
          <div className="p-2 bg-sidebar-primary rounded-lg">
            <MapPin className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <span className="font-headline group-data-[collapsible=icon]:hidden">
            Restaurante360
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive =
              item.href === '/unidade'
                ? pathname === '/unidade'
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
