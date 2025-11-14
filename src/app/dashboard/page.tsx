'use client';

import { Header } from '@/components/header';
import { ManagerDashboard } from '@/components/manager/manager-dashboard';
import { CollaboratorDashboard } from '@/components/collaborator/collaborator-dashboard';
import { useUser, useDoc, useMemoFirebase, useFirebase } from '@/firebase';
import type { User } from '@/lib/types';
import { doc } from 'firebase/firestore';

export default function DashboardPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: currentUserData, isLoading } = useDoc<User>(userDocRef);

  const currentUser: User | null = currentUserData ? { ...currentUserData, id: user!.uid } : null;

  if (isLoading || !currentUser) {
    return (
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <p>Carregando...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* O Header foi movido para o layout, então não precisa ser renderizado aqui */}
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {currentUser.role === 'manager' || currentUser.role === 'gestor' ? <ManagerDashboard /> : <CollaboratorDashboard />}
      </main>
    </div>
  );
}
