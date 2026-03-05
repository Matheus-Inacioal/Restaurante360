import { useState } from 'react';
import { fetchJSON, FetchJsonError } from '@/lib/http/fetch-json';

export type CriarPlanoInput = {
    nome: string;
    descricao?: string;
    precoMensal: number;
    maxUsuarios: number;
    ativo: boolean;
};

export function usePlanosSistema() {
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [globalError, setGlobalError] = useState<string | null>(null);

    const criarPlano = async (dados: CriarPlanoInput): Promise<boolean> => {
        setIsLoading(true);
        setFieldErrors({});
        setGlobalError(null);

        try {
            await fetchJSON('/api/sistema/planos/criar', {
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
                setGlobalError(err.message || 'Ocorreu um erro ao criar o plano.');
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return { criarPlano, isLoading, fieldErrors, globalError };
}
