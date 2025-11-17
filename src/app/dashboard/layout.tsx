'use client';

import { UtensilsCrossed } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { MainNav } from '@/components/main-nav';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useFirebase } from '@/firebase/provider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { doc } from 'firebase/firestore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isUserDataLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }
  
  const currentUser: User | null = userData ? { ...userData, id: user.uid } : null;

  if (!currentUser) {
    return <div className="flex h-screen items-center justify-center">Carregando dados do usuário...</div>;
  }

  const getDashboardTitle = (role: UserRole) => {
    if (role === 'manager' || role === 'gestor') {
      return 'Dashboard do Gestor';
    }
    return 'Painel do Colaborador';
  };

  const pageTitle = getDashboardTitle(currentUser.role);

  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground hover:text-sidebar-primary transition-colors">
                <div className="p-2 bg-sidebar-primary rounded-lg">
                    <UtensilsCrossed className="h-6 w-6 text-sidebar-primary-foreground" />
                </div>
                <span className="font-headline group-data-[collapsible=icon]:hidden">
                    restaurante360
                </span>
            </Link>
        </SidebarHeader>
        <MainNav role={currentUser.role} />
        <SidebarFooter>
          {/* Footer content if any */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header user={currentUser} title={pageTitle} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
