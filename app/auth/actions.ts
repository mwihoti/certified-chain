"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { SignInCredentials, SignUpCredentials, AuthResponse, AuthUser } from "./types";

export async function signIn({ email, password}: SignInCredentials): Promise<AuthResponse> {
    const supabase = await createClient();
    const { data, error} = await supabase.auth.signInWithPassword({ email, password});

    if (error) {
        console.error('sign-in error:', error.message);
        return { user: null, error: error.message};
        
    }
    return {
        user: data.user ? {
            id: data.user.id,
            email: data.user.email!,
            role: data.user.user_metadata?.role,
            organization_id: data.user.user_metadata?.organization_id,
            created_at: data.user.created_at,
        } : null,
        error: null,
    }
}

export async function signUp({ email, password, metadata}: SignUpCredentials): Promise<AuthResponse> {
    const supabase = await createClient();

    console.log('User Email:', email);
    console.log('Signing up user wiith metadata:', metadata);

    const { data, error} = await supabase.auth.signUp({
        email, 
        password,
         options: {
            data: metadata,
        },
    });

    if (error) {
        console.error('sign-up error:', error.message);
        return { user: null, error: error.message };
    }
    // check if user was created but needs email confirmation
    if (data.user && !data.session) {
        console.log('user sign up needs email confirmation')
    }
    return {
        user: data.user ? {
            id: data.user.id,
            email: data.user.email!,
            role: data.user.user_metadata?.role,
            organization_id: data.user.user_metadata?.organization_id,
            created_at: data.user.created_at,
        }: null,
        error: null,
    };
}

export async function signOut() : Promise<{ error: string | null }> {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('sign-out error:', error.message);
        return { error: error.message }; 
    }
    redirect('/');
}

export async function getServerUser(): Promise<AuthUser | null> {
    const supabase = await createClient();
    const { data: { user }, error} = await supabase.auth.getUser();
    if (error || !user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email!,
        role: user.user_metadata?.role,
        organization_id: user.user_metadata?.organization_id,
        created_at: user.created_at,
    };
}

export async function resetPassword(email: string): Promise<{error: string | null}> {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });
    return { error: error?.message || null};
} 