'use server';

import { initializeApp, getApps, FirebaseOptions } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import type { UserRole } from '@/lib/types';

interface NewUserData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

let secondaryApp: import('firebase/app').FirebaseApp;

if (!getApps().find(app => app.name === 'secondary')) {
    secondaryApp = initializeApp(firebaseConfig, 'secondary');
} else {
    secondaryApp = getApps().find(app => app.name === 'secondary')!;
}

const secondaryAuth = getAuth(secondaryApp);
const secondaryFirestore = getFirestore(secondaryApp);

export async function createUser(userData: Omit<NewUserData, 'password'>) {
    try {
        const randomPassword = Array(20).fill(0).map(() => Math.random().toString(36).charAt(2)).join('') + 'A1!';
        const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth,
            userData.email,
            randomPassword
        );
        const user = userCredential.user;

        const userRef = doc(secondaryFirestore, 'users', user.uid);
        await setDoc(userRef, {
            id: user.uid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        return { uid: user.uid };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('Este email já está em uso por outra conta.');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('A senha é muito fraca. Use pelo menos 6 caracteres.');
        }
        console.error('Error creating user:', error);
        throw new Error('Ocorreu um erro desconhecido ao criar o usuário.');
    }
}
