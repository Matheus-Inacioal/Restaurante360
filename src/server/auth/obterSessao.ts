import 'server-only';
import { adminAuth } from '@/server/firebase/admin';

export type SessaoUsuario = {
    uid: string;
    email?: string;
    empresaId?: string;
    papelPortal?: string;      // EMPRESA, SISTEMA, OPERACIONAL
    papelEmpresa?: string;     // GESTOR, ATENDENTE, etc
};

export async function obterSessao(req: Request): Promise<SessaoUsuario | null> {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            empresaId: decodedToken.empresaId,
            papelPortal: decodedToken.papelPortal,
            papelEmpresa: decodedToken.papelEmpresa
        };
    } catch (error) {
        console.error('[obterSessao] Erro ao verificar token:', error);
        return null;
    }
}
