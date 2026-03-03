'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import type { PerfilUsuario } from '@/lib/types/perfil-usuario';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import type { UserRole } from '@/lib/types';

export function usePerfil() {
    const { usuarioFirebase, isCarregandoAuth } = useAuth();
    const { firestore } = useFirebase();

    const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
    const [isCarregandoPerfil, setIsCarregandoPerfil] = useState(true);

    useEffect(() => {
        async function carregar() {
            if (isCarregandoAuth) return;

            if (!usuarioFirebase) {
                setPerfil(null);
                setIsCarregandoPerfil(false);
                return;
            }

            try {
                if (!firestore) throw new Error("Firestore indisponível.");

                const docRef = doc(firestore, 'users', usuarioFirebase.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const role = data.role as string | undefined;

                    // Conversão de role legada para novo padrão (temporário/MVP)
                    let papelEmpresa: PerfilUsuario['papelEmpresa'] = null;
                    let papelGlobal: PerfilUsuario['papelGlobal'] = null;

                    if (role === 'admin') {
                        // Dependendo da regra negócios, admin pode ser papelEmpresa ou global.
                        // Assumiremos admin de empresa por ora.
                        papelEmpresa = 'admin';
                    } else if (role === 'manager' || role === 'gestor') {
                        papelEmpresa = 'gestor';
                    } else if (role === 'operacional' || role === 'collaborator' || role === 'garcon' || role === 'producao' || role === 'cozinha' || role === 'pia' || role === 'bar') {
                        papelEmpresa = 'operacional';
                    }

                    // Fake hard-coded superadmin por segurança via fallback:
                    if (usuarioFirebase.email === 'malmeidaarruda2@gmail.com') {
                        papelGlobal = 'superadmin';
                        papelEmpresa = 'admin'; // Força permissões locais tb
                    }

                    const novoPerfil: PerfilUsuario = {
                        uid: usuarioFirebase.uid,
                        nome: data.name || data.nome || 'Usuário Sem Nome',
                        email: usuarioFirebase.email || data.email || '',
                        status: data.isActive === false ? 'inativo' : 'ativo',
                        papelGlobal: papelGlobal,
                        // Mock de empresa atual: se tiver um gestor logado, assumimos vínculo por enquanto
                        empresaAtualId: (!papelGlobal && !papelEmpresa) ? null : 'emp_padrao_001',
                        papelEmpresa: papelEmpresa,
                    };

                    setPerfil(novoPerfil);
                } else {
                    // Documento não existe (cadastro incompleto)
                    setPerfil(null);
                }
            } catch (error) {
                console.error("Erro ao puxar perfil:", error);
                setPerfil(null);
            } finally {
                setIsCarregandoPerfil(false);
            }
        }

        carregar();
    }, [usuarioFirebase, isCarregandoAuth, firestore]);

    return {
        perfil,
        isCarregandoPerfil: isCarregandoAuth || isCarregandoPerfil
    };
}
