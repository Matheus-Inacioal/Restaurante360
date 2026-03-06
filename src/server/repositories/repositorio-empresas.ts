import "server-only";
import { FieldValue, WriteBatch } from "firebase-admin/firestore";
import { adminDb } from "@/server/firebase/admin";

export interface DadosCriarEmpresa {
    nomeEmpresa: string;
    cnpj: string;
    planoId: string;
    status: "TRIAL_ATIVO" | "ATIVA" | "SUSPENSA";
    emailResponsavel: string;
    nomeResponsavel: string;
    whatsappResponsavel: string;
    diasTrial: number;
    vencimentoPrimeiraCobrancaEm?: string;
}

export const repositorioEmpresasAdmin = {
    /**
     * Cria uma empresa no Firestore. 
     * Aceita um WriteBatch opcional para executar em transações orquestradas.
     */
    async criarEmpresa(
        empresaId: string,
        dados: DadosCriarEmpresa,
        batch?: WriteBatch
    ): Promise<void> {
        const empresaRef = adminDb.collection("empresas").doc(empresaId);

        const payload = {
            nome: dados.nomeEmpresa,
            cnpj: dados.cnpj,
            planoId: dados.planoId,
            status: dados.status,
            responsavelEmail: dados.emailResponsavel,
            responsavelNome: dados.nomeResponsavel,
            whatsappResponsavel: dados.whatsappResponsavel,
            diasTrial: dados.diasTrial,
            ...(dados.vencimentoPrimeiraCobrancaEm && {
                vencimentoPrimeiraCobrancaEm: new Date(dados.vencimentoPrimeiraCobrancaEm + "T12:00:00.000Z")
            }),
            criadoEm: FieldValue.serverTimestamp(),
            atualizadoEm: FieldValue.serverTimestamp(),
        };

        if (batch) {
            batch.set(empresaRef, payload);
        } else {
            await empresaRef.set(payload);
        }
    },

    async obterEmpresaPorId(empresaId: string) {
        const empresaRef = adminDb.collection("empresas").doc(empresaId);
        const doc = await empresaRef.get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    }
};
