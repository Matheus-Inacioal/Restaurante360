'use client';

import { useFirebase } from '@/firebase/provider';
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut
} from 'firebase/auth';

export function useAuth() {
    const { auth, user: usuarioFirebase, isUserLoading } = useFirebase();

    const login = async (email: string, senha: string) => {
        if (!auth) throw new Error("Serviço de autenticação indisponível");
        return signInWithEmailAndPassword(auth, email, senha);
    };

    const logout = async () => {
        if (!auth) throw new Error("Serviço de autenticação indisponível");
        return firebaseSignOut(auth);
    };

    return {
        usuarioFirebase,
        isCarregandoAuth: isUserLoading,
        login,
        logout
    };
}
