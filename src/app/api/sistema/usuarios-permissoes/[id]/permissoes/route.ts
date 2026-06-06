/**
 * GET  /api/sistema/usuarios-permissoes/[id]/permissoes — Carregar matriz de permissões
 * PUT  /api/sistema/usuarios-permissoes/[id]/permissoes — Salvar permissões customizadas
 */
import { NextRequest } from "next/server";
import { obterSessao } from "@/server/auth/obterSessao";
import { jsonErro, jsonOk } from "@/server/http/respostas";
import { repositorioPermissoesPg } from "@/server/repositorios/repositorio-permissoes-pg";
import { servicoPermissoes } from "@/server/servicos/servico-permissoes";
import { prisma } from "@/lib/prisma";
interface ContextProps {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: ContextProps) {
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
  }

  const { id: alvoId } = params;

  try {
    const todasPermissoes = await repositorioPermissoesPg.listarPermissoesDisponiveis();
    const permsEfetivas = await repositorioPermissoesPg.obterPermissoesUsuario(alvoId);
    
    // Buscar customizações diretas
    const usuario = await prisma.usuario.findUnique({
      where: { id: alvoId },
      select: {
        permissoesUsuario: true
      }
    });
    
    const customizacoes = usuario?.permissoesUsuario || [];

    const matriz = todasPermissoes.map(p => {
      const custom = customizacoes.find(c => c.permissaoId === p.id);
      return {
        id: p.id,
        nome: p.nome,
        modulo: p.modulo,
        descricao: p.descricao,
        concedida: permsEfetivas.includes(p.nome),
        customizada: !!custom,
        valorCustomizado: custom ? custom.concedido : null
      };
    });

    return jsonOk(matriz);
  } catch (error: any) {
    console.error(`[GET /api/sistema/usuarios-permissoes/${alvoId}/permissoes] Erro:`, error);
    return jsonErro("Erro ao carregar permissões do usuário.", "INTERNAL_ERROR", 500);
  }
}

export async function PUT(req: NextRequest, { params }: ContextProps) {
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
  }

  const { id: alvoId } = params;

  try {
    const body = await req.json();
    const { permissoes } = body; // Array de { permissaoId: string, concedido: boolean }

    if (!Array.isArray(permissoes)) {
      return jsonErro("Formato inválido. 'permissoes' deve ser um array.", "BAD_REQUEST", 400);
    }

    const resultado = await servicoPermissoes.atualizarPermissoesUsuario(
      sessao.uid,
      alvoId,
      permissoes
    );

    return jsonOk(resultado);
  } catch (error: any) {
    console.error(`[PUT /api/sistema/usuarios-permissoes/${alvoId}/permissoes] Erro:`, error);
    return jsonErro(error.message || "Erro ao salvar permissões.", "INTERNAL_ERROR", 500);
  }
}
