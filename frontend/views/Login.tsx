import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Login Page Component
 *
 * Features:
 * - Email/password authentication via Supabase
 * - Social login options (Google, GitHub)
 * - Password visibility toggle
 * - Error handling
 * - Responsive split-screen design
 */
export function Login() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signIn(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = (provider: 'google' | 'github') => {
        console.log(`Login with ${provider}`);
        // TODO: Implement social login with Supabase
    };

    return (
        <div className="min-h-screen bg-black flex">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="mb-8">
                        <img
                            src="/icons/logo.svg"
                            alt="Logo"
                            className="w-16 h-16 mb-6"
                        />
                        <h1 className="text-hero text-text-primary mb-2">Sign in</h1>
                        <p className="text-body text-text-secondary">
                            Welcome back! Please enter your details.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-status-error/10 border border-status-error/20 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
                            <p className="text-small text-status-error">{error}</p>
                        </div>
                    )}

                    {/* Social Login */}
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={() => handleSocialLogin('google')}
                            className="btn-secondary w-full justify-center"
                        >
                            <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
                            <span>Continue with Google</span>
                        </button>
                        <button
                            onClick={() => handleSocialLogin('github')}
                            className="btn-secondary w-full justify-center"
                        >
                            <img src="/icons/github.svg" alt="GitHub" className="w-5 h-5" />
                            <span>Continue with GitHub</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-small">
                            <span className="px-4 bg-black text-text-tertiary">Or continue with email</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="form-input pl-11"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="form-input pl-11 pr-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="flex items-center justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-small text-accent-blue hover:text-accent-blue-hover transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full justify-center"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <p className="mt-6 text-center text-small text-text-secondary">
                        Don't have an account?{' '}
                        <Link
                            to="/signup"
                            className="text-accent-blue hover:text-accent-blue-hover font-medium transition-colors"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Hero Image */}
            <div className="hidden lg:flex lg:w-1/2 bg-app-panel items-center justify-center p-12">
                <div className="max-w-lg text-center">
                    <img
                        src="/icons/hero-illustration.svg"
                        alt="API Workflow"
                        className="w-full mb-8 opacity-90"
                    />
                    <h2 className="text-heading text-text-primary mb-4">
                        Build API Workflows Visually
                    </h2>
                    <p className="text-body text-text-secondary">
                        Connect APIs, transform data, and automate workflows with our intuitive visual builder.
                        No code required.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
