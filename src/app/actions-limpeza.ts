"use server";

import { adminAuth, adminDb } from "@/server/firebase/admin";

export async function actionLimparUsuariosTeste() {
    try {
        console.log("[ACTION LIMPAR] Iniciando...");
        const listUsersResult = await adminAuth.listUsers(100);
        const apagados: string[] = [];

        for (const user of listUsersResult.users) {
            const email = (user.email || "").toLowerCase();
            const displayName = (user.displayName || "").toLowerCase();

            if (
                email.includes("lucasnarciso") ||
                displayName.includes("lucas") ||
                email.includes("cozinha") ||
                displayName.includes("cozinha") ||
                email.includes("financeirorebu")
            ) {
                console.log(`[LIMPEZA] Apagando Auth: ${email} (${user.uid})`);
                await adminAuth.deleteUser(user.uid);

                // Tenta apagar no firestore global
                await adminDb.collection("usuarios").doc(user.uid).delete().catch(() => { });

                // Tenta apagar nas empresas
                const empresasSnapshot = await adminDb.collection("empresas").get();
                for (const emp of empresasSnapshot.docs) {
                    await adminDb.collection("empresas").doc(emp.id).collection("usuarios").doc(user.uid).delete().catch(() => { });
                }

                apagados.push(email);
            }
        }

        console.log("[ACTION LIMPAR] Sucesso. Apagados: ", apagados);
        return { ok: true, msg: "Limpou: " + apagados.join(", ") };
    } catch (error: any) {
        console.error("[ACTION LIMPAR] Erro:", error);
        return { ok: false, msg: error.message };
    }
}
