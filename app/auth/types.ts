export interface AuthUser {
    id: string;
    email: string;
    role?: 'super_admin' | 'institution_admin' | 'verifier' | 'holder';
    institution_id?: string;
    institution_name?: string;
    created_at?: string;
}

export interface SignInCredentials {
    email: string;
    password: string;
}

export interface SignUpCredentials {
    email: string;
    password: string;
    metadata?: {
        institution_id?: string;
        institution_name?: string;
        role?: 'super_admin' | 'institution_admin' | 'verifier' | 'holder';
    };
}

export interface AuthResponse {
    user: AuthUser | null;
    error: string | null;
}

export interface SessionResponse {
    session: any | null;
    error: string | null;
}
