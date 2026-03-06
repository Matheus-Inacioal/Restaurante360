import "server-only";
import { adminDb, adminAuth } from '@/server/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface DefinirSenhaTemporariaInput {
    empresaId: string;
    novaSenha: string;
    forcarTrocaSenha?: boolean;
    executadoPorUid?: string; // UID do Superadmin para auditoria
}

export interface DefinirSenhaTemporariaResult {
    ok: boolean;
    code?: string;
    message?: string;
}

export async function definirSenhaTemporariaService(data: DefinirSenhaTemporariaInput): Promise<DefinirSenhaTemporariaResult> {
    try {
        const { empresaId, novaSenha, forcarTrocaSenha = true, executadoPorUid = "SISTEMA" } = data;

        // 1. Buscar a empresa
        const empresaRef = adminDb.collection('empresas').doc(empresaId);
        const empresaDoc = await empresaRef.get();

        if (!empresaDoc.exists) {
            return {
                ok: false,
                code: "NOT_FOUND",
                message: "Empresa não encontrada."
            };
        }

        const empresaData = empresaDoc.data();
        let targetUid = empresaData?.usuarioMasterUid;

        // 2. Descobrir usuário master se não tiver na raiz da empresa
        if (!targetUid) {
            const usuariosSnap = await adminDb.collection('usuarios')
                .where('empresaId', '==', empresaId)
                .where('papelPortal', '==', 'EMPRESA')
                .where('papelEmpresa', '==', 'GESTOR')
                .where('ativo', '==', true)
                .limit(1)
                .get();

            if (usuariosSnap.empty) {
                return {
                    ok: false,
                    code: "NOT_FOUND",
                    message: "Usuário master (Gestor) não encontrado para esta empresa."
                };
            }
            targetUid = usuariosSnap.docs[0].id;
        }

        // 3. Atualizar a senha no Firebase Auth
        await adminAuth.updateUser(targetUid, {
            password: novaSenha
        });

        // 4. Se forcarTrocaSenha, atualizar perfil no Firestore
        if (forcarTrocaSenha) {
            await adminDb.collection('usuarios').doc(targetUid).update({
                mustResetPassword: true,
                atualizadoEm: FieldValue.serverTimestamp()
            });
        }

        // 5. Auditar a ação crítica
        const auditoriaRef = adminDb.collection("auditoria").doc();
        await auditoriaRef.set({
            tipo: "SISTEMA_DEFINIU_SENHA_TEMPORARIA",
            empresaId: empresaId,
            usuarioAlvoUid: targetUid,
            executadoPorUid: executadoPorUid,
            descricao: `Senha temporária redefinida manualmente. ForceReset: ${forcarTrocaSenha}`,
            criadoEm: FieldValue.serverTimestamp()
        });

        return {
            ok: true,
            message: "Senha temporária definida com sucesso."
        };

    } catch (error: any) {
        console.error("[DEFINIR_SENHA_TEMPORARIA_SERVICE] Erro:", error);
        return {
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Falha interna ao tentar redefinir senha do usuário."
        };
    }
}
