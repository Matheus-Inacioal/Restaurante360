import "server-only";
import { FieldValue, WriteBatch } from "firebase-admin/firestore";
import { adminDb } from "@/server/firebase/admin";

export interface DadosCriarPerfilGlobal {
    uid: string;
    email: string;
    nome: string;
    papelPortal: string;
    papelEmpresa: string;
    empresaId: string;
    ativo: boolean;
}

export interface DadosCriarUsuarioEmpresa {
    uid: string;
    empresaId: string;
    email: string;
    nome: string;
    papel: string;
    ativo: boolean;
}

export const repositorioUsuariosAdmin = {
    /**
     * Cria o perfil global do usuário na coleção `usuarios/{uid}`
     */
    async criarPerfilGlobal(
        dados: DadosCriarPerfilGlobal,
        batch?: WriteBatch
    ): Promise<void> {
        const usuarioRef = adminDb.collection("usuarios").doc(dados.uid);

        const payload = {
            uid: dados.uid,
            email: dados.email,
            nome: dados.nome,
            papelPortal: dados.papelPortal,
            papelEmpresa: dados.papelEmpresa,
            empresaId: dados.empresaId,
            ativo: dados.ativo,
            criadoEm: new Date(),
            atualizadoEm: new Date(),
        };

        if (batch) {
            batch.set(usuarioRef, payload);
        } else {
            await usuarioRef.set(payload);
        }
    },

    /**
     * Cria a referência/vínculo do usuário na subcoleção `empresas/{empresaId}/usuarios/{uid}`
     */
    async criarUsuarioEmpresa(
        dados: DadosCriarUsuarioEmpresa,
        batch?: WriteBatch
    ): Promise<void> {
        const usuarioEmpresaRef = adminDb
            .collection("empresas")
            .doc(dados.empresaId)
            .collection("usuarios")
            .doc(dados.uid);

        const payload = {
            uid: dados.uid,
            email: dados.email,
            nome: dados.nome,
            papel: dados.papel,
            ativo: dados.ativo,
            criadoEm: new Date(),
            atualizadoEm: new Date(),
        };

        if (batch) {
            batch.set(usuarioEmpresaRef, payload);
        } else {
            await usuarioEmpresaRef.set(payload);
        }
    }
};
