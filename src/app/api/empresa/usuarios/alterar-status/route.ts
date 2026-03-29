import { z } from 'zod';
import { adminDb, adminAuth } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

/**
 * Schema de validação para alteração de status (ativar/inativar).
 */
const alterarStatusSchema = z.object({
    uid: z.string().min(1, "UID do colaborador é obrigatório."),
    novoStatus: z.enum(["ativo", "inativo"], {
        errorMap: () => ({ message: "Status deve ser 'ativo' ou 'inativo'." })
    }),
});

/**
 * POST /api/empresa/usuarios/alterar-status
 *
 * Ativa ou inativa um colaborador da mesma empresa.
 * Sincroniza o status em:
 * - Firebase Auth (disabled: true/false)
 * - Firestore global (usuarios/{uid}.ativo)
 * - Firestore tenant (empresas/{empresaId}/usuarios/{uid}.ativo)
 *
 * Validações:
 * - Chamador autenticado + empresa ativa
 * - Chamador é gestor (papelPortal EMPRESA ou SISTEMA)
 * - Colaborador pertence à mesma empresa
 */
export async function POST(req: Request) {
    try {
        // 1. Validar sessão e acesso à empresa
        const authResult = await garantirAcessoEmpresa(req);
        if (authResult instanceof Response) return authResult;

        const sessao = authResult.sessao;
        const empresaId = sessao.empresaId!;

        // 2. Validar que o chamador é gestor
        const papelPermitido = sessao.papelPortal === 'EMPRESA' || sessao.papelPortal === 'SISTEMA';
        if (!papelPermitido) {
            return jsonErro(
                "Apenas gestores podem alterar o status de colaboradores.",
                "FORBIDDEN",
                403
            );
        }

        // 3. Validar dados de entrada
        const body = await req.json();
        const parseResult = alterarStatusSchema.safeParse(body);
        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const { uid, novoStatus } = parseResult.data;
        const ativo = novoStatus === "ativo";
        const authDisabled = !ativo; // Firebase Auth: disabled = true quando inativo

        // 4. Impedir auto-inativação
        if (uid === sessao.uid && !ativo) {
            return jsonErro(
                "Você não pode inativar a si mesmo.",
                "FORBIDDEN",
                403
            );
        }

        // 5. Verificar que o colaborador pertence à mesma empresa
        const colaboradorTenantRef = adminDb
            .collection("empresas")
            .doc(empresaId)
            .collection("usuarios")
            .doc(uid);

        const colaboradorTenantDoc = await colaboradorTenantRef.get();
        if (!colaboradorTenantDoc.exists) {
            return jsonErro(
                "Colaborador não encontrado nesta empresa.",
                "NOT_FOUND",
                404
            );
        }

        const agora = new Date();

        // 6. Atualizar Firebase Auth (disabled flag)
        try {
            await adminAuth.updateUser(uid, { disabled: authDisabled });
        } catch (authError: any) {
            if (process.env.NODE_ENV !== "production") {
                console.error(`[DEV][ALTERAR_STATUS] Erro ao atualizar Auth para UID ${uid}:`, authError);
            }
            return jsonErro(
                `Falha ao ${ativo ? "reativar" : "inativar"} acesso no Firebase Auth.`,
                "INTERNAL_ERROR",
                500
            );
        }

        // 7. Atualizar Firestore (batch atômico para global + tenant)
        const batch = adminDb.batch();

        // 7a. Perfil global usuarios/{uid}
        const usuarioGlobalRef = adminDb.collection("usuarios").doc(uid);
        const globalDoc = await usuarioGlobalRef.get();
        if (globalDoc.exists) {
            batch.update(usuarioGlobalRef, {
                ativo,
                atualizadoEm: agora,
            });
        }

        // 7b. Subcoleção empresas/{empresaId}/usuarios/{uid}
        batch.update(colaboradorTenantRef, {
            ativo,
            status: novoStatus,
            atualizadoEm: agora,
        });

        // 7c. Auditoria
        const auditoriaRef = adminDb.collection("auditoria").doc();
        batch.set(auditoriaRef, {
            empresaId,
            entidade: "USUARIO_EMPRESA",
            acao: ativo ? "REATIVAR" : "INATIVAR",
            entidadeId: uid,
            criadoPor: sessao.uid,
            detalhes: `Colaborador ${ativo ? "reativado" : "inativado"} pelo gestor.`,
            criadoEm: agora,
        });

        try {
            await batch.commit();
        } catch (dbError: any) {
            console.error(`[ALTERAR_STATUS] Erro no Firestore para UID ${uid}:`, dbError);
            // Tentar reverter o Auth para manter consistência
            try {
                await adminAuth.updateUser(uid, { disabled: !authDisabled });
            } catch {
                console.error(`[ALTERAR_STATUS] CRÍTICO: Auth e Firestore inconsistentes para UID ${uid}`);
            }
            return jsonErro(
                `Falha ao salvar status no banco de dados.`,
                "INTERNAL_ERROR",
                500
            );
        }

        const nomeColaborador = colaboradorTenantDoc.data()?.nome || "Colaborador";
        const acao = ativo ? "reativado" : "inativado";

        if (process.env.NODE_ENV !== "production") {
            console.log(`[DEV][ALTERAR_STATUS] ${nomeColaborador} (${uid}) ${acao} com sucesso.`);
        }

        return jsonOk({
            uid,
            ativo,
            status: novoStatus,
            nome: nomeColaborador,
            atualizadoEm: agora.toISOString(),
        });

    } catch (error: any) {
        console.error("[ALTERAR_STATUS] Erro:", error);
        return jsonErro("Falha interna ao alterar status do colaborador.", "INTERNAL_ERROR", 500);
    }
}
