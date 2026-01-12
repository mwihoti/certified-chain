export interface AuthUser {
    id: string;
    email: string;
    role?: 'admin' | 'institution' | 'user';
    organization_id?: string;
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
        organization_name?: string;
        role?: string;
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