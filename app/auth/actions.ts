"use server";

import {
    clearCurrentSession,
    createUserSession,
    getCurrentUser,
    registerUser,
} from "@/lib/server/auth-store";
import { redirect } from "next/navigation";
import type { SignInCredentials, SignUpCredentials, AuthResponse, AuthUser } from "./types";

export async function signIn({ email, password}: SignInCredentials): Promise<AuthResponse> {
    const { user, error } = await createUserSession(email, password);

    if (error) {
        console.error('sign-in error:', error);
        return { user: null, error };
        
    }
    return { user, error: null };
}

export async function signUp({ email, password, metadata}: SignUpCredentials): Promise<AuthResponse> {
    const { user, error } = await registerUser({ email, password, metadata });

    if (error) {
        console.error('sign-up error:', error);
        return { user: null, error };
    }

    return {
        user,
        error: null,
    };
}

export async function signOut() : Promise<{ error: string | null }> {
    await clearCurrentSession();
    redirect('/');
}

export async function getServerUser(): Promise<AuthUser | null> {
    return getCurrentUser();
}

export async function resetPassword(email: string): Promise<{error: string | null}> {
    void email;
    return { error: 'Password reset is not configured for Neon-backed auth yet.' };
} 
