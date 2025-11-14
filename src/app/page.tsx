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

export default function LoginPage() {
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
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" asChild>
              <Link href="/dashboard">Login</Link>
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="#" className="underline">
              Contate o gestor
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
