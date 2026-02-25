import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProcessesPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Processos (POP/SOP)</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Biblioteca de Processos</CardTitle>
                    <CardDescription>
                        Guias operacionais, manuais e procedimentos padrão (ex: Recebimento de material, Fechamento de caixa).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground p-8 text-center border rounded-md bg-muted/20">
                        Os processos operacionais estarão catalogados aqui.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
