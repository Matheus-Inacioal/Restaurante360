'use client';

import { CollaboratorDashboard } from '@/components/collaborator/collaborator-dashboard';

export default function PortalOperacionalDashboard() {
    return (
        <div className="flex flex-col">
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <CollaboratorDashboard />
            </main>
        </div>
    );
}
