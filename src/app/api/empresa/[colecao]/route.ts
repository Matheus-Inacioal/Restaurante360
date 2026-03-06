import { NextRequest, NextResponse } from "next/server";
import { repositorioGenericoAdmin } from "@/server/admin/repositorio-generico-admin";

const COLECOES_PERMITIDAS = ["tarefas", "rotinas", "processos", "categorias", "notificacoes", "usuarios"];

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ colecao: string }> }
) {
    try {
        const p = await params;
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');
        const colecao = p.colecao;

        if (!COLECOES_PERMITIDAS.includes(colecao)) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message: "Coleção não permitida" }, { status: 400 });
        }
        if (!empresaId) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message: "ID da Empresa é obrigatório" }, { status: 400 });
        }

        const data = await repositorioGenericoAdmin.listar(colecao, empresaId);
        return NextResponse.json({ ok: true, data });
    } catch (error: any) {
        console.error(`Erro GET /empresa/[colecao]:`, error);
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message: "Erro interno no servidor." }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ colecao: string }> }
) {
    try {
        const p = await params;
        const body = await req.json();
        const empresaId = body.empresaId; // Tem que estar no body de forma obrigatoria
        const colecao = p.colecao;

        if (!COLECOES_PERMITIDAS.includes(colecao)) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message: "Coleção não permitida" }, { status: 400 });
        }
        if (!empresaId) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message: "ID da Empresa é obrigatório no corpo da requisição" }, { status: 400 });
        }

        const data = await repositorioGenericoAdmin.criar(colecao, empresaId, body);
        return NextResponse.json({ ok: true, data }, { status: 201 });
    } catch (error: any) {
        console.error(`Erro POST /empresa/[colecao]:`, error);
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message: "Erro interno no servidor." }, { status: 500 });
    }
}
