import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { repositorioUsuarios } from "@/lib/repositories/repositorio-usuarios";
import { PerfilUsuario } from "@/lib/types/identidade";

export function usePerfil() {
    const { usuarioAuth, carregandoAuth } = useAuth();
    const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
    const [carregandoPerfil, setCarregandoPerfil] = useState(true);
    const [erroPerfil, setErroPerfil] = useState<Error | null>(null);

    useEffect(() => {
        if (carregandoAuth) {
            return;
        }

        if (!usuarioAuth) {
            setPerfilUsuario(null);
            setCarregandoPerfil(false);
            return;
        }

        setCarregandoPerfil(true);
        setErroPerfil(null);

        repositorioUsuarios.obterPerfilPorUid(usuarioAuth.uid)
            .then((perfil) => {
                if (!perfil) {
                    setErroPerfil(new Error("Perfil não encontrado no Firestore para este usuário."));
                }
                setPerfilUsuario(perfil);
            })
            .catch((error) => {
                setErroPerfil(error);
            })
            .finally(() => {
                setCarregandoPerfil(false);
            });

    }, [usuarioAuth, carregandoAuth]);

    return {
        perfilUsuario,
        carregandoPerfil: carregandoAuth || carregandoPerfil,
        erroPerfil
    };
}
