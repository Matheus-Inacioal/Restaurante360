import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type FeedItem = {
    id: string;
    user: string;
    initials: string;
    action: string;
    target: string;
    time: string;
};

export function ActivityFeed({ items }: { items: FeedItem[] }) {
    if (!items || items.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Atividade recente</CardTitle>
                            <CardDescription>O que está acontecendo na operação.</CardDescription>
                        </div>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6 text-center h-[200px]">
                    <p className="text-muted-foreground text-sm">
                        As execuções e fechamentos de checklists aparecerão aqui conforme o time atualizar o sistema hoje.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-4">
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Atividade recente</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="space-y-6">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">{item.initials}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <p className="text-sm leading-tight">
                                    <span className="font-medium">{item.user}</span> {item.action}{' '}
                                    <span className="font-medium">{item.target}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {item.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <div className="p-4 pt-0 mt-auto border-t mt-4 flex items-center justify-center">
                <Button variant="link" size="sm" asChild className="text-muted-foreground h-auto p-0 mt-2">
                    <Link href="/dashboard/reports">Ver histórico completo</Link>
                </Button>
            </div>
        </Card>
    );
}
