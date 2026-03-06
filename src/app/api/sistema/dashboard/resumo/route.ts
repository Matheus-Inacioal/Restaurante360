import { NextResponse } from "next/server";
import { repositorioEmpresasAdmin } from "@/server/admin/repositorio-empresas-admin";
import { repositorioAssinaturasAdmin } from "@/server/admin/repositorio-assinaturas-admin";
import { repositorioUsuariosAdmin } from "@/server/admin/repositorio-usuarios-admin";

export async function GET() {
    try {
        const totalEmpresas = await repositorioEmpresasAdmin.obterTotal();
        const totalUsuariosSistema = await repositorioUsuariosAdmin.obterTotalSistema();
        const totalAssinaturasAtivas = await repositorioAssinaturasAdmin.obterTotalAtivas();
        const pendencias = await repositorioEmpresasAdmin.listarPendencias();

        return NextResponse.json({
            ok: true,
            data: {
                totalEmpresas,
                totalUsuariosSistema,
                totalAssinaturasAtivas,
                pendencias,
            },
        });
    } catch (error: any) {
        console.error("Erro ao obter metadados do dashboard resumo admin:", error);
        return NextResponse.json(
            {
                ok: false,
                code: "INTERNAL_ERROR",
                message: "Erro interno ao processar resumo do sistema.",
            },
            { status: 500 }
        );
    }
}
