import { z } from 'zod';
import { adminDb, adminAuth } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { servicoLinksAutenticacao } from '@/server/servicos/servico-links-autenticacao';
import { servicoEmail } from '@/server/servicos/servico-email';

/**
 * Schema de validação para redefinição de senha de colaborador.
 */
const redefinirSenhaSchema = z.object({
    emailColaborador: z.string().trim().toLowerCase().email("E-mail inválido."),
});

/**
 * POST /api/empresa/usuarios/redefinir-senha
 *
 * Gera um link de redefinição de senha para um colaborador da mesma empresa
 * e envia por e-mail automaticamente.
 *
 * Validações:
 * - Chamador autenticado e vinculado a uma empresa
 * - Chamador é gestor (papelPortal EMPRESA ou SISTEMA)
 * - E-mail pertence a um colaborador da mesma empresa
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
                "Apenas gestores podem redefinir senhas de colaboradores.",
                "FORBIDDEN",
                403
            );
        }

        // 3. Validar dados de entrada
        const body = await req.json();
        const parseResult = redefinirSenhaSchema.safeParse(body);
        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const { emailColaborador } = parseResult.data;

        // 4. Verificar que o e-mail pertence a um usuário do Firebase Auth
        let colaboradorUid: string;
        let nomeColaborador: string | undefined;
        try {
            const userRecord = await adminAuth.getUserByEmail(emailColaborador);
            colaboradorUid = userRecord.uid;
            nomeColaborador = userRecord.displayName || undefined;
        } catch {
            return jsonErro(
                "Nenhum usuário encontrado com este e-mail.",
                "NOT_FOUND",
                404
            );
        }

        // 5. Verificar que o colaborador pertence à mesma empresa
        const colaboradorTenantRef = adminDb
            .collection("empresas")
            .doc(empresaId)
            .collection("usuarios")
            .doc(colaboradorUid);

        const colaboradorDoc = await colaboradorTenantRef.get();
        if (!colaboradorDoc.exists) {
            return jsonErro(
                "Este colaborador não pertence à sua empresa.",
                "FORBIDDEN",
                403
            );
        }

        // Buscar nome do colaborador do Firestore se não veio do Auth
        if (!nomeColaborador) {
            nomeColaborador = colaboradorDoc.data()?.nome;
        }

        // Buscar nome da empresa para o template
        let nomeEmpresa: string | undefined;
        try {
            const empresaDoc = await adminDb.collection("empresas").doc(empresaId).get();
            nomeEmpresa = empresaDoc.data()?.nomeEmpresa;
        } catch {
            // Não-fatal
        }

        // 6. Gerar link de redefinição via serviço centralizado
        const resultadoLink = await servicoLinksAutenticacao.gerarLinkRedefinicaoSenha(emailColaborador);
        if (!resultadoLink.ok || !resultadoLink.link) {
            return jsonErro(
                resultadoLink.erro || "Não foi possível gerar o link de redefinição.",
                "INTERNAL_ERROR",
                500
            );
        }

        // 7. Enviar e-mail de redefinição via serviço centralizado
        const resultadoEmail = await servicoEmail.enviarEmailResetSenha({
            emailDestinatario: emailColaborador,
            linkReset: resultadoLink.link,
            nomeUsuario: nomeColaborador,
            nomeEmpresa,
        });

        if (!resultadoEmail.ok) {
            const isDev = process.env.NODE_ENV !== "production";
            if (isDev && (resultadoEmail as any).reason === "EMAIL_PROVIDER_NOT_CONFIGURED") {
                console.log(`[DEV] Link de redefinição para ${emailColaborador}: ${resultadoLink.link}`);
            } else {
                console.warn(`[REDEFINIR_SENHA] Falha ao enviar e-mail para ${emailColaborador}`);
            }
        }

        // 8. Registrar auditoria
        await adminDb.collection("auditoria").add({
            empresaId,
            entidade: "USUARIO_EMPRESA",
            acao: "REDEFINIR_SENHA",
            entidadeId: colaboradorUid,
            criadoPor: sessao.uid,
            detalhes: `Link de redefinição gerado e enviado para '${emailColaborador}'`,
            emailEnviado: resultadoEmail.ok,
            criadoEm: new Date()
        });

        // Retornar sucesso (link apenas em dev para testes)
        const resposta: Record<string, any> = { sucesso: true };
        if (process.env.NODE_ENV !== "production") {
            resposta.linkRedefinicao = resultadoLink.link;
        }

        return jsonOk(resposta);

    } catch (error: any) {
        console.error("[REDEFINIR_SENHA] Erro:", error);
        return jsonErro("Falha interna ao gerar redefinição de senha.", "INTERNAL_ERROR", 500);
    }
}
