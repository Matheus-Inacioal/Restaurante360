'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  CalendarClock,
  BookOpen,
  Users,
  BarChart3,
  LogIn
} from 'lucide-react';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { UserRole } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const managerNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/tarefas', label: 'Tarefas', icon: ClipboardCheck },
  { href: '/dashboard/routines', label: 'Rotinas', icon: CalendarClock },
  { href: '/dashboard/processes', label: 'Processos', icon: BookOpen },
  { href: '/dashboard/users', label: 'Usuários', icon: Users },
  { href: '/dashboard/reports', label: 'Relatórios', icon: BarChart3 },
];

const collaboratorNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Meu Painel', icon: LayoutDashboard },
  { href: '/dashboard/tasks', label: 'Minhas Tarefas', icon: ClipboardCheck },
  { href: '/dashboard/processes', label: 'Processos', icon: BookOpen },
  { href: '/dashboard/collaborator/check-in', label: 'Check-in', icon: LogIn },
];

export function MainNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const navItems = role === 'manager' || role === 'gestor' ? managerNavItems : collaboratorNavItems;

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      // Exata igualdade para dashboard, ou startsWith para rotas filhas
      const isActive = item.href === '/dashboard'
        ? pathname === '/dashboard'
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
    });
  };

  return (
    <SidebarContent className="p-2">
      <SidebarMenu>{renderNavItems(navItems)}</SidebarMenu>
    </SidebarContent>
  );
}
