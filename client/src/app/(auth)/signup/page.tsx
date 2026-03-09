'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Mic } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const data = await api.post<{ token: string; user: any }>('/auth/signup', { name, email, password });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            toast.success('Account created successfully');
            router.push('/feed');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 delay-100 fill-mode-both">
                <div className="flex justify-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 backdrop-blur-sm">
                        <Mic className="w-6 h-6 text-zinc-300" />
                    </div>
                </div>

                <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-md shadow-2xl">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-semibold tracking-tight">Create an account</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Enter your information below to get started
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignup}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-zinc-300">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-zinc-700"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-zinc-700"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-zinc-700"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password" className="text-zinc-300">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-zinc-700"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pt-2">
                            <Button type="submit" className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200" disabled={isLoading}>
                                {isLoading ? 'Creating account...' : 'Sign up'}
                            </Button>
                            <div className="text-center text-sm text-zinc-500">
                                Already have an account?{' '}
                                <a href="/login" className="text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer font-medium">
                                    Sign in
                                </a>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
