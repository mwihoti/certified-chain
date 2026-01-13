"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { signIn } from './actions';


export default function AuthLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await signIn({
            email: formData.email,
            password: formData.password,
        });
        if (result.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }
        setIsLoading(false);
        router.push('/institution/dashboard');
    }

    return (
        <Layout>
            <div className='min-h-[80vh] flex items-center justify-center px-4 py-12'>
                <div className='w-full max-w-md'>
                    <div className='text-center mb-8'>
                        <div className='w-16 h-16 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center mx-auto mb-4'>
                            <svg className='w-8 h-8 text-white' fill="none" stroke="currentColor" viewBox='0 0 24 24'>
                                <path strokeLinecap="round" strokeLinejoin='round' strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                  <h1 className='text-3xl font-bold text-[hsl(var(--foreground))] mb-2'>Welcome Back</h1>  
                  <p className='text-[hsl(var(--muted-foreground))]'>Sign in to your account to continue</p>

                        
                        </div>
                    </div>
               
            </div>
        </Layout>
    )
}