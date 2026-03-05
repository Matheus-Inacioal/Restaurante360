import { useState } from 'react';
import { fetchJSON, FetchJsonError } from '@/lib/http/fetch-json';

export type CriarUsuarioSistemaInput = {
    nome: string;
    email: string;
    papel: "SUPERADMIN" | "SUPORTE_N1" | "SUPORTE_N2";
};

export function useUsuariosSistema() {
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [globalError, setGlobalError] = useState<string | null>(null);

    const criarUsuario = async (dados: CriarUsuarioSistemaInput): Promise<boolean> => {
        setIsLoading(true);
        setFieldErrors({});
        setGlobalError(null);

        try {
            await fetchJSON('/api/sistema/usuarios/criar', {
                method: 'POST',
                body: JSON.stringify(dados),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return true;
        } catch (error) {
            const err = error as FetchJsonError;
            if (err.status === 400 && err.details) {
                setFieldErrors(err.details as Record<string, string[]>);
            } else {
                setGlobalError(err.message || 'Ocorreu um erro ao criar o usuário.');
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return { criarUsuario, isLoading, fieldErrors, globalError };
}
