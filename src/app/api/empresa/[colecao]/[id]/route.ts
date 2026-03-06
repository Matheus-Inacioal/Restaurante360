import { NextRequest, NextResponse } from "next/server";
import { repositorioGenericoAdmin } from "@/server/admin/repositorio-generico-admin";

const COLECOES_PERMITIDAS = ["tarefas", "rotinas", "processos", "categorias", "notificacoes", "usuarios"];

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ colecao: string, id: string }> }
) {
    try {
        const p = await params;
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        if (!COLECOES_PERMITIDAS.includes(p.colecao)) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message: "Coleção não permitida" }, { status: 400 });
        }
        if (!empresaId) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message: "ID da Empresa é obrigatório" }, { status: 400 });
        }

        const data = await repositorioGenericoAdmin.obterPorId(p.colecao, empresaId, p.id);

        if (!data) {
            return NextResponse.json({ ok: false, code: "NOT_FOUND", message: "Registro não encontrado" }, { status: 404 });
        }

        return NextResponse.json({ ok: true, data });
    } catch (error: any) {
        console.error(`Erro GET /empresa/[colecao]/[id]:`, error);
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message: "Erro interno." }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ colecao: string, id: string }> }
) {
    try {
        const p = await params;
        const body = await req.json();
        const empresaId = body.empresaId; // Tem que estar no body

        if (!COLECOES_PERMITIDAS.includes(p.colecao)) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message: "Coleção não permitida" }, { status: 400 });
        }
        if (!empresaId) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message: "ID da Empresa é obrigatório" }, { status: 400 });
        }

        const data = await repositorioGenericoAdmin.atualizar(p.colecao, empresaId, p.id, body.atualizacoes || body);
        return NextResponse.json({ ok: true, data });
    } catch (error: any) {
        console.error(`Erro PUT /empresa/[colecao]/[id]:`, error);
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message: "Falha ao editar." }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ colecao: string, id: string }> }
) {
    try {
        const p = await params;
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresaId');

        if (!COLECOES_PERMITIDAS.includes(p.colecao)) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message: "Coleção não permitida" }, { status: 400 });
        }
        if (!empresaId) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message: "ID da Empresa é obrigatório para exclusão segura" }, { status: 400 });
        }

        await repositorioGenericoAdmin.excluir(p.colecao, empresaId, p.id);

        return NextResponse.json({ ok: true, data: { success: true } });
    } catch (error: any) {
        console.error(`Erro DELETE /empresa/[colecao]/[id]:`, error);
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message: "Falha ao deletar." }, { status: 500 });
    }
}
