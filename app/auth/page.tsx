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
                    {error && (
                        <div className='mb-6 p-4 rounded-lg bg-red-50 border border-red-200'>
                            <p className='text-sm text-red-600'>{error}</p>
                        </div>
                    )}
                    <div className='bg-white rounded-xl shadow-lg border-[hsl(var(--border))] p-6'>
                        <form onSubmit={handleSubmit} className='space-y-5'>
                            <div>
                                <label htmlFor='email' className='block text-sm font-medium text-[hsl(var(--foreground))] mb-2'>
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder='you@example.com'
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <div className='flex items-center justify-between mb-2'>
                                    <label htmlFor='password' className='block text-sm font-medium text-[hsl(var(--foreground))]'>
                                        Password
                                    </label>
                                    <Link href="/auth/forgot-password" className="text-sm text-[hsl(var(--primary))] hover:underline">
                                        Forgot  password
                                    </Link>
                                </div>
                                <input id="password"
                                    type="password"
                                    placeholder='.......'
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all"
                                />
                            </div>
                            <button type="submit"
                                disabled={isLoading}
                                className='w-full py-3 px-4 rounded-lg bg-[hsl(var(--primary))] text-white font-medium hover:bg-[hsl(var(--primary))]/90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all'
                            >
                            {isLoading ? (
                                <span className='flex items-center justify-center gap-2'>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">

                                        <circle className='opacity-25' cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill='none' />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />

                                    </svg>
                                    Signing in...

                                </span>
                            ): (
                                'Sign In' 
                            )}
                            </button>
                        </form>

                        <div className='relative my-6'>
                            <div className='absolute inset-0 flex items-center'>
                                <div className='w-full border-t border-[hsl(var(--border))]' />
                                </div>
                                <div className='relative flex justify-center text-sm'>
                                    <span className="px-2 bg-white text-[hsl(var(--muted-foreground))]">Don't have an account?</span>
                            </div>
                        </div>

                        <Link href="/auth/register"
                            className="block w-full py-3 px-4 rounded-lg border border-[hsl(var(--border))] text-center font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all">
                                Create an Account
                            </Link>
                    </div>

                </div>

            </div>
        </Layout>
    )
}