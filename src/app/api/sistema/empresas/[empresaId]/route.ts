import { NextResponse } from 'next/server';
import { adminDb } from '@/server/firebase/admin';
import { garantirAcessoSistema } from '@/server/auth/garantirAcessoSistema';
import { z } from 'zod';
import { normalizarCNPJ, normalizarWhatsApp } from '@/lib/formatadores/formato';

const putSchema = z.object({
    nomeEmpresa: z.string().trim().min(2, "Nome da empresa é obrigatório").max(120),
    cnpj: z.string().min(14, "CNPJ precisa ter no mínimo 14 números"),
    nomeResponsavel: z.string().trim().min(2, "Nome do responsável é obrigatório").max(80),
    emailResponsavel: z.string().trim().toLowerCase().email("Email inválido"),
    whatsappResponsavel: z.string().min(10, "WhatsApp precisa ter no mínimo 10 números"),
    planoId: z.string().min(1, "ID do plano é obrigatório"),
    status: z.enum(["ATIVO", "SUSPENSO", "CANCELADO", "TRIAL_ATIVO"])
});

export async function GET(req: Request, { params }: { params: Promise<{ empresaId: string }> }) {
    try {
        const authResult = await garantirAcessoSistema(req);
        if (authResult instanceof Response) return authResult;

        const { empresaId } = await params;

        const empresaDoc = await adminDb.collection('empresas').doc(empresaId).get();
        if (!empresaDoc.exists) {
            return NextResponse.json({ ok: false, code: "NOT_FOUND", message: "Empresa não encontrada" }, { status: 404 });
        }

        const empresaData = empresaDoc.data()!;

        // Busca assinatura ativa se existir
        const assinaturasSnapshot = await adminDb.collection("financeiro_assinaturas")
            .where("empresaId", "==", empresaId)
            // .where("status", "in", ["ATIVO", "TRIAL"]) 
            // no limite traz 1 recente para ver o plano atrelado
            .orderBy("criadoEm", "desc")
            .limit(1)
            .get();

        let assinaturaAtual = null;
        if (!assinaturasSnapshot.empty) {
            const assData = assinaturasSnapshot.docs[0].data();
            assinaturaAtual = {
                id: assinaturasSnapshot.docs[0].id,
                status: assData.status,
                diasTrial: assData.diasTrial,
                planoId: assData.plano
            };
        }

        const payload = {
            empresaId: empresaDoc.id,
            nomeEmpresa: empresaData.nome || empresaData.nomeEmpresa, // legacy vs new
            cnpj: empresaData.cnpj,
            responsavelNome: empresaData.responsavelNome || empresaData.nomeResponsavel, // handle alias
            responsavelEmail: empresaData.responsavelEmail || empresaData.emailResponsavel,
            whatsappResponsavel: empresaData.whatsappResponsavel,
            status: empresaData.status,
            criadoEm: empresaData.criadoEm?.toDate?.()?.toISOString() || null,
            atualizadoEm: empresaData.atualizadoEm?.toDate?.()?.toISOString() || null,
            assinaturaAtual: assinaturaAtual
        };

        return NextResponse.json({ ok: true, data: payload }, { status: 200 });

    } catch (error: any) {
        console.error("[GET_EMPRESA_DETALHES] Erro:", error);
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ empresaId: string }> }) {
    try {
        const authResult = await garantirAcessoSistema(req);
        if (authResult instanceof Response) return authResult;

        const { empresaId } = await params;
        const body = await req.json();

        const parseResult = putSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: 'Dados inválidos.',
                issues: parseResult.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const data = parseResult.data;
        const cnpjLimpo = normalizarCNPJ(data.cnpj);
        const wappLimpo = normalizarWhatsApp(data.whatsappResponsavel);

        const empresaRef = adminDb.collection("empresas").doc(empresaId);
        const docSnap = await empresaRef.get();
        if (!docSnap.exists) {
            return NextResponse.json({ ok: false, code: "NOT_FOUND", message: "Empresa não encontrada" }, { status: 404 });
        }

        // Transação para manter histórico robusto caso necessário, mas batch puro atende
        const batch = adminDb.batch();

        batch.update(empresaRef, {
            nome: data.nomeEmpresa,
            cnpj: cnpjLimpo,
            responsavelNome: data.nomeResponsavel,
            responsavelEmail: data.emailResponsavel,
            whatsappResponsavel: wappLimpo,
            status: data.status,
            atualizadoEm: new Date()
        });

        // Atualiza a assinatura vinculada se planoId mudou
        // Um CRUD real de assinaturas precisaria de mais tratamentos (logs do Asaas, gerar nova cobrança, etc), 
        // mas aqui vamos só sincronizar o plano base na assinatura se houver
        const assinaturasSnapshot = await adminDb.collection("financeiro_assinaturas")
            .where("empresaId", "==", empresaId)
            .orderBy("criadoEm", "desc")
            .limit(1)
            .get();

        if (!assinaturasSnapshot.empty) {
            batch.update(assinaturasSnapshot.docs[0].ref, {
                plano: data.planoId
            });
        }

        await batch.commit();

        return NextResponse.json({ ok: true, data: { id: empresaId } }, { status: 200 });

    } catch (error: any) {
        console.error("[PUT_EMPRESA_DETALHES] Erro:", error);
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message: "Erro interno do servidor ao atualizar empresa." }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ empresaId: string }> }) {
    try {
        const authResult = await garantirAcessoSistema(req);
        if (authResult instanceof Response) return authResult;

        const { empresaId } = await params;
        const empresaRef = adminDb.collection("empresas").doc(empresaId);

        const docSnap = await empresaRef.get();
        if (!docSnap.exists) {
            return NextResponse.json({ ok: false, code: "NOT_FOUND", message: "Empresa não existe" }, { status: 404 });
        }

        const assinaturasSnapshot = await adminDb.collection("financeiro_assinaturas").where("empresaId", "==", empresaId).get();

        if (!assinaturasSnapshot.empty) {
            // Existe vínculo financeiro -> Soft Delete
            const batch = adminDb.batch();

            batch.update(empresaRef, {
                status: "CANCELADO",
                atualizadoEm: new Date()
            });

            assinaturasSnapshot.docs.forEach(doc => {
                batch.update(doc.ref, { status: "CANCELADO", canceladoEm: new Date() });
            });

            await batch.commit();
            return NextResponse.json({ ok: true, message: "Empresa inativada logicamente (soft delete) devido a histórico financeiro." }, { status: 200 });

        } else {
            // Hard Delete permitido
            // Na prática num SaaS real nós deletaríamos as subcoleções (como 'usuarios') com um script recursivo
            // No MVP, vamos deletar o documento base.
            await empresaRef.delete();
            return NextResponse.json({ ok: true, message: "Empresa deletada com sucesso." }, { status: 200 });
        }

    } catch (error: any) {
        console.error("[DELETE_EMPRESA] Erro:", error);
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message: "Erro interno ao deletar empresa." }, { status: 500 });
    }
}
