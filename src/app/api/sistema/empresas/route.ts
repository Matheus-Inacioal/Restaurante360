import { NextRequest, NextResponse } from "next/server";
import { repositorioEmpresasAdmin } from "@/server/admin/repositorio-empresas-admin";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") || "10", 10);

        const empresas = await repositorioEmpresasAdmin.listar(limit);

        return NextResponse.json({ ok: true, data: empresas });
    } catch (error: any) {
        console.error("Erro ao listar empresas no admin:", error);
        return NextResponse.json(
            {
                ok: false,
                code: "INTERNAL_ERROR",
                message: "Erro interno ao recuperar lista de empresas.",
            },
            { status: 500 }
        );
    }
}
