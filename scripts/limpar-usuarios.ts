import { adminAuth, adminDb } from '../src/server/firebase/admin';

async function limparUsuarios() {
    const emails = [
        "lucasnarciso17@gmail.com",
        "cozinha", // parte do email ou nome
    ];

    console.log("Iniciando limpeza...");

    try {
        const listUsersResult = await adminAuth.listUsers(100);

        for (const user of listUsersResult.users) {
            const email = user.email || "";
            const displayName = user.displayName || "";

            if (
                email.includes("lucasnarciso") ||
                displayName.toLowerCase().includes("lucas") ||
                email.includes("cozinha") ||
                displayName.toLowerCase().includes("cozinha") ||
                email.includes("financeirorebu")
            ) {
                console.log(`Apagando Auth: ${email} (${uid})`);
                await adminAuth.deleteUser(user.uid);

                // Tenta apagar no firestore global
                await adminDb.collection("usuarios").doc(user.uid).delete();

                // Tenta apagar nas empresas
                const empresasSnapshot = await adminDb.collection("empresas").get();
                for (const emp of empresasSnapshot.docs) {
                    await adminDb.collection("empresas").doc(emp.id).collection("usuarios").doc(user.uid).delete();
                }
                console.log(`Dados apagados para: ${email}`);
            }
        }
        console.log("Limpeza concluída.");
    } catch (error) {
        console.error("Erro na limpeza:", error);
    }
}

limparUsuarios();
