'use client';

import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePerfil } from '@/hooks/use-perfil';
import { obterRotaInicialDoUsuario } from '@/lib/autenticacao/redirecionamento';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { auth } = useFirebase();
  const { login, isCarregandoAuth } = useAuth();
  const { perfil, isCarregandoPerfil } = usePerfil();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (perfil) {
      const rota = obterRotaInicialDoUsuario(perfil);
      router.push(rota);
    }
  }, [perfil, router]);

  const handleLogin = async () => {
    try {
      if (!auth) throw new Error("Serviço Firebase indisponível.");
      await login(email, password);
      // O useEffect capturará a mudança de `perfil` e fará o redirect automaticamente.

    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro ao fazer login.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Credenciais inválidas. Verifique seu e-mail e senha.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas de login falhas. Tente novamente mais tarde.';
      }

      toast({
        variant: 'destructive',
        title: 'Erro de Login',
        description: errorMessage,
      });
      console.error('Error signing in:', error);
    }
  };

  const handleSignUp = async () => {
    if (email !== 'malmeidaarruda2@gmail.com') {
      toast({
        variant: 'destructive',
        title: 'Cadastro não permitido',
        description: 'Apenas o usuário master pode se cadastrar inicialmente.',
      });
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          id: user.uid,
          name: 'Gestor Master',
          email: user.email,
          role: 'gestor',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      router.push('/empresa');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: 'Email já cadastrado',
          description: 'Este email já está em uso. Tente fazer login.',
        });
        // Try to log in if user already exists
        await handleLogin();
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro de Cadastro',
          description: error.message,
        });
      }
      console.error('Error signing up:', error);
    }
  };

  if (isCarregandoAuth || isCarregandoPerfil || perfil) {
    return <div className="flex min-h-screen w-full items-center justify-center bg-background"><p>Carregando...</p></div>;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-block mb-4">
            <div className="p-3 bg-primary rounded-full inline-block">
              <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline text-primary">restaurante360</CardTitle>
          <CardDescription>
            Faça login para gerenciar as operações do seu restaurante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seunome@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
            <Button onClick={handleSignUp} className="w-full" variant="outline">
              Cadastrar Master (primeiro acesso)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
