import { useState } from 'react';
import { fetchJSON, FetchJsonError } from '@/lib/http/fetch-json';

export type CriarEmpresaInput = {
    nomeEmpresa: string;
    cnpj: string;
    nomeResponsavel: string;
    emailResponsavel: string;
    whatsappResponsavel: string;
    planoId: string;
    diasTrial?: number;
};

export function useEmpresasSistema() {
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [globalError, setGlobalError] = useState<string | null>(null);

    const criarEmpresa = async (dados: CriarEmpresaInput): Promise<boolean> => {
        setIsLoading(true);
        setFieldErrors({});
        setGlobalError(null);

        try {
            // Note: Token de auth para requisicao ao sistema
            // (Para a v1 vamos assumir um fetch json básico enviando o Bearer no header, 
            // no Firebase o ideal é colocar await auth.currentUser.getIdToken())
            await fetchJSON('/api/sistema/empresas/criar', {
                method: 'POST',
                body: JSON.stringify(dados),
                headers: {
                    'Content-Type': 'application/json'
                    // TODO: 'Authorization': `Bearer ${token}` se a API exigir
                }
            });
            return true;
        } catch (error) {
            const err = error as FetchJsonError;
            if (err.status === 400 && err.issues) {
                // Zod issues map
                setFieldErrors(err.issues as Record<string, string[]>);
            } else {
                setGlobalError(err.message || 'Ocorreu um erro ao criar a empresa.');
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return { criarEmpresa, isLoading, fieldErrors, globalError };
}
