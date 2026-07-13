"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { signUp } from '../actions';


export default function AuthRegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        organizationName: '',
    });
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setIsLoading(false);
            return;
        }

    const result = await signUp({
        email: formData.email,
        password: formData.password,
        metadata: {
            institution_name: formData.organizationName,
            role: 'institution_admin',
        },
    }) ;
    if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
    }

    setSuccess(true);
    setIsLoading(false);
}
{/*
if (success) {
    return (

        <div className='min-h-[80vh] flex items-center justify-center px-4 py-12'>
            <div className='w-full max-w-md text-center'>
                <div className='w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4'>
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
                </div>
                <h1 className='text-2xl font-bold text-[hsl(var(--foreground))] mb-2'>Check Your Email</h1>
                <p className="text-[hsl(var(--muted-foreground))] mb-6">
                    We've sent a confirmation link to <strong>{formData.email}</strong>. Please check your inbox.
                </p>
                <Link href="/auth" className='inline-block py-3 px-6 rounded-lg bg-[hsl(var(--primary))] text-white font-medium hover:bg-[hsl(var(--primary))]/90 transition-all'>
                Back to Login
                </Link>
            </div>
        </div>
    );
}*/}
if (success) {
    return (
        router.push('/institution/dashboard')
    )
}

return (
    <Layout>
        <div className='min-h-[80vh] flex items-center justify-center px-4 py-12'>
            <div className='w-full max-w-md'>
                <div className='text-center mb-8'>
                    <div className='w-16 h-16 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center mx-auto mb-4'>
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">Create an Account</h1>
                    <p className="text-[hsl(var(--muted-foreground))]">Register to start issuing blockchain certificates</p>
                </div>
                {error && (
                    <div className='mb-6 p-4 rounded-lg bg-red-50 border border-red-200'>
                        <p className='text-sm text-red-600'>{error}</p>
                        </div>
                )}
                <div className="bg-white rounded-xl shadow-lg border border-[hsl(var(--border))] p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor='organizationName' className='block text-sm font-medium text-[hsl(var(--foreground))] mb-2'>
                                Organization Name
                            </label>
                            <input 
                                id="organizationName"
                                type="text"
                                placeholder='University of Example'
                                value={formData.organizationName}
                                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value})}
                                required
                                className='w-full px-4 py-3 rounded-lg border border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all' />
                                </div>

                                <div>
                                    <label htmlFor='email' className='block text-sm font-medium text-[hsl(var(--foreground))] mb-2'>
                                        Email Address
                                    </label>
                                    <input 
                                        id="email"
                                        type="email"
                                        placeholder='admin@institution.edu'
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value})}
                                        required
                                        className='w-full px-4 py-3 rounded-lg border border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all' 
                                        />

                                    </div>
                                <div>
                                    <label htmlFor="password" className='block text-sm font-medium text-[hsl(var(--foreground))] mb-2'>
                                        Password
                                    </label>
                                    <input 
                                        id="password"
                                        type="password"
                                        placeholder='........'
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value})}
                                        required
                                        className='w-full px-4 py-3 rounded-lg border border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all'
                                    />
                                    </div>
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder='........'
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value})}
                                            required
                                            className='w-full px-4 py-3 rounded-lg border border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all'
                                        />                      
                                        
                                            


                                        </div>

                                    <button 
                                    type='submit'
                                    disabled={isLoading}
                                    className='w-full py-3 px-4 rounded-lg bg-[hsl(var(--primary))] text-white font-medium hover:bg-[hsl(var(--primary))]/90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all disabled:opacity-50'>

                                    {isLoading ? 'creating account...' : 'Create Account'}
                                </button>
                               
                                
                    </form>
                    <div className='relative my-6'>
                        <div className='absolute inset-0 flex items-center'>
                            <div className='w-full border-t border-[hsl(var(--border))]' />
                        </div>
                        <div className='relative flex justify-center text-sm'>
                            <span className='px-2 bg-white text-[hsl(var(--muted-foreground))]'>Already have an account?</span>
                        </div>
                    </div>

                    <div className='text-center'>
                        <Link href="/auth"
                            className="block w-full py-3 px-4 rounded-lg border border-[hsl(var(--border))] text-center font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all">
                                Sign In
                        </Link> 
                        </div>
                    </div>

            </div>
        </div>
    </Layout>
)

}
