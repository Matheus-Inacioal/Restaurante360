import { useState, useEffect } from "react";
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { traduzErroFirebase } from "@/lib/firebase/erros-auth";

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

    const entrarComEmailSenha = async (email: string, senha: string): Promise<{ ok: true; uid: string } | { ok: false; code?: string; message: string }> => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, senha);
            console.info("LOGIN_SUCCESS", { uid: result.user.uid });
            return { ok: true, uid: result.user.uid };
        } catch (error: any) {
            console.error("LOGIN_ERROR", error);
            return { ok: false, code: error?.code, message: traduzErroFirebase(error?.code) };
        }
    };

    return {
        usuarioAuth,
        carregandoAuth,
        erroAuth,
        logout,
        entrarComEmailSenha
    };
}
