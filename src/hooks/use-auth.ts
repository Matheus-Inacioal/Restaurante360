import { useState, useEffect } from "react";
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export function useAuth() {
    const [usuarioAuth, setUsuarioAuth] = useState<User | null>(null);
    const [carregandoAuth, setCarregandoAuth] = useState(true);
    const [erroAuth, setErroAuth] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                setUsuarioAuth(user);
                setCarregandoAuth(false);
                setErroAuth(null);
            },
            (error) => {
                setErroAuth(error);
                setCarregandoAuth(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error: any) {
            console.error("Erro ao deslogar:", error);
            setErroAuth(error);
            throw error;
        }
    };

    return {
        usuarioAuth,
        carregandoAuth,
        erroAuth,
        logout,
        signInWithEmailAndPassword: (e: string, p: string) => signInWithEmailAndPassword(auth, e, p)
    };
}
