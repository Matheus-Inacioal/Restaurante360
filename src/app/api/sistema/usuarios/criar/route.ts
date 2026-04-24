import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashSenha } from '@/server/auth/senha';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';
import { servicoEmail } from '@/server/servicos/servico-email';
import { servicoLinksAutenticacao } from '@/server/servicos/servico-links-autenticacao';
import { registrarAuditoria } from '@/server/servicos/servico-auditoria';

const usuarioSistemaSchema = z.object({
    nome: z.string().trim().min(2, "Nome é obrigatório").max(80),
    email: z.string().trim().toLowerCase().email("Email inválido"),
    papel: z.enum(["SUPERADMIN", "SUPORTE_N1", "SUPORTE_N2"], {
        errorMap: () => ({ message: "Papel inválido escolhido." })
    })
});

export async function POST(req: Request) {
    try {
        const authResult = await garantirAcessoSistema(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();

        const parseResult = usuarioSistemaSchema.safeParse(body);
        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const emailLimpo = data.email;

        // Verificar se já existe um usuário com esse email
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { email: emailLimpo }
        });

        if (usuarioExistente) {
            return jsonErro("Este e-mail já está em uso.", "EMAIL_JA_EXISTE", 400);
        }

        // 2. Criar perfil global como SISTEMA no PostgreSQL
        // SUPERADMIN mapeia para saasAdmin no model unificado
        const papelUnificado = "saasAdmin"; // Mapeamento simplificado. TODO: suportar suporte n1 e n2
        
        const senhaGerada = Math.random().toString(36).slice(-10) + "S@";
        const senhaHash = await hashSenha(senhaGerada);

        const novoUsuario = await prisma.usuario.create({
            data: {
                email: emailLimpo,
                nome: data.nome,
                papel: papelUnificado,
                empresaId: null, // saasAdmin não tem empresa
                senhaHash,
                mustResetPassword: true,
                status: 'ativo'
            }
        });

        // 3. Registrar auditoria
        await registrarAuditoria({
            usuarioId: authResult.sessao.uid,
            acao: "usuario_sistema.criado",
            entidade: "usuario",
            entidadeId: novoUsuario.id,
            detalhe: { nome: data.nome, papel: data.papel }
        }).catch(() => null);

        // 4. Gerar link de primeiro acesso e disparar e-mail de criação de conta
        const isDev = process.env.NODE_ENV !== "production";
        let linkPrimeiroAcesso: string | undefined;

        try {
            const resultadoLink = await servicoLinksAutenticacao.gerarLinkPrimeiroAcesso(emailLimpo);
            if (resultadoLink.ok && resultadoLink.link) {
                linkPrimeiroAcesso = resultadoLink.link;

                // Envio em background
                Promise.resolve().then(async () => {
                    const resultado = await servicoEmail.enviarEmailCriacaoConta({
                        nomeUsuario: data.nome,
                        nomeEmpresa: "Restaurante360 (Sistema)",
                        emailDestinatario: emailLimpo,
                        linkPrimeiroAcesso: linkPrimeiroAcesso!,
                        papelUsuario: data.papel,
                    });

                    if (!resultado.ok) {
                        console.warn(`[CRIAR_USUARIO_SISTEMA] E-mail não enviado para ${emailLimpo}:`, (resultado as any).error);
                        if (isDev) {
                            console.log(`\n📨 [DEV] LINK DE PRIMEIRO ACESSO para ${emailLimpo}:\n${linkPrimeiroAcesso}\n`);
                        }
                    }
                }).catch(e => console.error("[CRIAR_USUARIO_SISTEMA] Erro assíncrono no envio de e-mail:", e));
            }
        } catch (linkError) {
            console.warn("[CRIAR_USUARIO_SISTEMA] Falha ao gerar link de primeiro acesso:", linkError);
        }

        return jsonOk({
            uid: novoUsuario.id,
            emailCriado: emailLimpo,
            ...(isDev && linkPrimeiroAcesso ? { linkPrimeiroAcesso } : {}),
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_USUARIO_SISTEMA] Erro fatal:", error);
        return jsonErro("Falha interna ao criar usuário do sistema.", "INTERNAL_ERROR", 500);
    }
}
