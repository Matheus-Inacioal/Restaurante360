import { NextRequest, NextResponse } from "next/server";
import { repositorioEmpresasAdmin } from "@/server/admin/repositorio-empresas-admin";
import { repositorioAuditoriaAdmin } from "@/server/admin/repositorio-auditoria-admin";
// TODO: Integrar JWT verification se aplicável. O Next middleware protege as rotas teoricamente.

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ empresaId: string }> }
) {
    try {
        const p = await params;
        const empresa = await repositorioEmpresasAdmin.obterPorId(p.empresaId);
        if (!empresa) {
            return NextResponse.json(
                { ok: false, code: "NOT_FOUND", message: "Empresa não encontrada." },
                { status: 404 }
            );
        }
        return NextResponse.json({ ok: true, data: empresa });
    } catch (error: any) {
        console.error("Erro GET /empresas/[id]:", error);
        return NextResponse.json(
            { ok: false, code: "INTERNAL_ERROR", message: "Erro interno no servidor." },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ empresaId: string }> }
) {
    try {
        const p = await params;
        const empresaId = p.empresaId;
        const data = await req.json();

        // Uma validação zod seria inserida aqui (ex: updateEmpresaSchema)
        await repositorioEmpresasAdmin.atualizar(empresaId, data);

        await repositorioAuditoriaAdmin.registrarLog({
            tipo: "ACESSO_SISTEMA", // Pode ser adaptado p/ EMPRESA_ATUALIZADA caso conste no lib/auditoria
            descricao: `Empresa ${empresaId} foi modificada no admin.`,
            empresaId,
        });

        return NextResponse.json({ ok: true, data: { success: true } });
    } catch (error: any) {
        console.error("Erro PUT /empresas/[id]:", error);
        return NextResponse.json(
            { ok: false, code: "INTERNAL_ERROR", message: "Falha ao editar empresa." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ empresaId: string }> }
) {
    try {
        const p = await params;
        await repositorioEmpresasAdmin.excluir(p.empresaId);

        await repositorioAuditoriaAdmin.registrarLog({
            tipo: "ACESSO_SISTEMA",
            descricao: `Empresa ${p.empresaId} foi desativada/excluída via admin.`,
            empresaId: p.empresaId,
        });

        return NextResponse.json({ ok: true, data: { success: true } });
    } catch (error: any) {
        console.error("Erro DELETE /empresas/[id]:", error);
        return NextResponse.json(
            { ok: false, code: "INTERNAL_ERROR", message: "Falha ao excluir." },
            { status: 500 }
        );
    }
}
