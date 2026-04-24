/**
 * POST /api/auth/login
 *
 * Autentica um usuário com e-mail e senha via PostgreSQL.
 * Cria JWT, seta cookie httpOnly e retorna o perfil completo.
 *
 * Fluxo: e-mail + senha → busca no PG → bcrypt compare → JWT → cookie → perfil
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { repositorioUsuariosPg } from "@/server/repositorios/repositorio-usuarios-pg";
import { verificarSenha } from "@/server/auth/senha";
import { criarToken, COOKIE_SESSAO } from "@/server/auth/jwt";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Senha obrigatória."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "VALIDATION_ERROR",
          message: "Dados inválidos.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, senha } = parsed.data;

    // 1. Buscar usuário pelo e-mail
    const usuario = await repositorioUsuariosPg.obterPorEmailCompleto(email);

    if (!usuario) {
      return NextResponse.json(
        { ok: false, code: "INVALID_CREDENTIALS", message: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    // 2. Verificar se tem senha definida
    if (!usuario.senhaHash) {
      return NextResponse.json(
        {
          ok: false,
          code: "NO_PASSWORD",
          message: "Sua conta ainda não possui senha definida. Use o link de primeiro acesso enviado por e-mail.",
        },
        { status: 401 }
      );
    }

    // 3. Comparar senha com bcrypt
    const senhaCorreta = await verificarSenha(senha, usuario.senhaHash);
    if (!senhaCorreta) {
      return NextResponse.json(
        { ok: false, code: "INVALID_CREDENTIALS", message: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    // 4. Verificar status
    if (usuario.status === "inativo") {
      return NextResponse.json(
        { ok: false, code: "USER_INACTIVE", message: "Usuário desativado. Contate o administrador." },
        { status: 403 }
      );
    }

    // 5. Criar JWT
    const token = await criarToken({
      uid: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
      empresaId: usuario.empresaId ?? undefined,
      unidadeId: usuario.unidadeId ?? undefined,
    });

    // 6. Registrar último acesso (não-bloqueante)
    repositorioUsuariosPg.registrarUltimoAcesso(usuario.id).catch(() => null);

    // 7. Formatar perfil para resposta
    const perfil = {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      papel: usuario.papel,
      status: usuario.status,
      empresaId: usuario.empresaId,
      unidadeId: usuario.unidadeId,
      areaId: usuario.areaId,
      funcaoId: usuario.funcaoId,
      mustResetPassword: usuario.mustResetPassword,
      criadoEm: usuario.criadoEm.toISOString(),
      atualizadoEm: usuario.atualizadoEm.toISOString(),
      empresa: usuario.empresa ? { id: usuario.empresa.id, nome: usuario.empresa.nome } : null,
      unidade: usuario.unidade ? { id: usuario.unidade.id, nome: usuario.unidade.nome } : null,
    };

    // 8. Montar resposta com cookie httpOnly
    const response = NextResponse.json({ ok: true, data: perfil });

    response.cookies.set(COOKIE_SESSAO, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return response;
  } catch (error: any) {
    console.error("[POST /api/auth/login] Erro:", error);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "Erro interno ao processar login." },
      { status: 500 }
    );
  }
}
