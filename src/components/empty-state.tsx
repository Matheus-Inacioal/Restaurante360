'use client';

import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <div className="bg-muted rounded-full p-4 mb-4">
                <Icon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-1">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    )
}
