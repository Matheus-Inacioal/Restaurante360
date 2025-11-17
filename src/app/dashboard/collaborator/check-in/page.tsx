'use client';

import { useState } from 'react';
import { LogIn, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function CheckInPage() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const handleCheckIn = async () => {
    if (!user || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Erro de autenticação',
            description: 'Você precisa estar logado para fazer o check-in.'
        });
        return;
    }

    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    try {
        const checkInsCollection = collection(firestore, 'checkIns');
        addDocumentNonBlocking(checkInsCollection, {
            userId: user.uid,
            date: new Date().toISOString().split('T')[0],
            shift: 'Manhã', // This could be dynamic based on time
            createdAt: serverTimestamp(),
        });

        setIsCheckedIn(true);
        setCheckInTime(time);
        toast({
        title: 'Check-in realizado com sucesso!',
        description: `Seu turno foi iniciado às ${time}. Bom trabalho!`,
        variant: 'default',
        });
    } catch (error) {
        console.error('Error performing check-in:', error);
        toast({
            variant: 'destructive',
            title: 'Erro ao fazer check-in',
            description: 'Não foi possível registrar seu check-in. Tente novamente.'
        });
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
              {isCheckedIn ? <CheckCircle2 className="h-8 w-8" /> : <LogIn className="h-8 w-8" />}
          </div>
          <CardTitle className="font-headline text-3xl">
            {isCheckedIn ? 'Check-in Realizado!' : 'Registrar Ponto'}
          </CardTitle>
          <CardDescription>
            {isCheckedIn
              ? `Você iniciou seu turno às ${checkInTime}.`
              : 'Clique no botão abaixo para registrar o início do seu turno.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCheckedIn && (
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="font-semibold text-green-700 dark:text-green-300">
                Tenha um ótimo dia de trabalho!
              </p>
              <p className="text-sm text-muted-foreground mt-1">Suas tarefas já estão disponíveis no seu painel.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckIn}
            disabled={isCheckedIn || !user}
          >
            {isCheckedIn ? 'Turno Iniciado' : 'Fazer Check-in Agora'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
