import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Sign Up Page Component
 * 
 * Features:
 * - Email/password registration
 * - Social signup options (Google, GitHub)
 * - Password strength indicator
 * - Password visibility toggle
 * - Terms acceptance
 * - Form validation
 * - Responsive split-screen design
 */
export function SignUp() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Password strength calculation
    const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z\d]/.test(password)) score++;

        if (score <= 2) return { score, label: 'Weak', color: '#EF4444' };
        if (score <= 3) return { score, label: 'Fair', color: '#EAB308' };
        if (score <= 4) return { score, label: 'Good', color: '#10B981' };
        return { score, label: 'Strong', color: '#10B981' };
    };

    const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!acceptTerms) {
            setError('Please accept the terms and conditions');
            return;
        }

        if (passwordStrength && passwordStrength.score < 3) {
            setError('Please choose a stronger password');
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            if (formData.email && formData.password && formData.fullName) {
                // Set authentication token
                localStorage.setItem('authToken', 'mock-token-' + Date.now());
                navigate('/dashboard');
            } else {
                setError('Please fill in all fields');
            }
            setIsLoading(false);
        }, 1000);
    };

    const handleSocialSignup = (provider: 'google' | 'github') => {
        console.log(`Sign up with ${provider}`);
        // Implement social signup
    };

    const updateFormData = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
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
                        <h1 className="text-hero text-text-primary mb-2">Create account</h1>
                        <p className="text-body text-text-secondary">
                            Start building powerful API workflows today.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-status-error/10 border border-status-error/20 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0" />
                            <p className="text-small text-status-error">{error}</p>
                        </div>
                    )}

                    {/* Social Signup */}
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={() => handleSocialSignup('google')}
                            className="btn-secondary w-full justify-center"
                        >
                            <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
                            <span>Continue with Google</span>
                        </button>
                        <button
                            onClick={() => handleSocialSignup('github')}
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
                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className="form-label">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                <input
                                    id="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => updateFormData('fullName', e.target.value)}
                                    placeholder="John Doe"
                                    className="form-input pl-11"
                                    required
                                />
                            </div>
                        </div>

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
                                    value={formData.email}
                                    onChange={(e) => updateFormData('email', e.target.value)}
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
                                    value={formData.password}
                                    onChange={(e) => updateFormData('password', e.target.value)}
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

                            {/* Password Strength Indicator */}
                            {formData.password && passwordStrength && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-tiny text-text-tertiary">Password strength</span>
                                        <span
                                            className="text-tiny font-medium"
                                            style={{ color: passwordStrength.color }}
                                        >
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="h-1 bg-app-component rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-300"
                                            style={{
                                                width: `${(passwordStrength.score / 5) * 100}%`,
                                                backgroundColor: passwordStrength.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="form-label">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                                    placeholder="••••••••"
                                    className="form-input pl-11 pr-11"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <div className="mt-2 flex items-center gap-2 text-status-success">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-tiny">Passwords match</span>
                                </div>
                            )}
                        </div>

                        {/* Terms & Conditions */}
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="w-4 h-4 mt-0.5 rounded border-border bg-app-input accent-accent-blue flex-shrink-0"
                            />
                            <span className="text-small text-text-secondary">
                                I agree to the{' '}
                                <Link to="/terms" className="text-accent-blue hover:text-accent-blue-hover">
                                    Terms of Service
                                </Link>
                                {' '}and{' '}
                                <Link to="/privacy" className="text-accent-blue hover:text-accent-blue-hover">
                                    Privacy Policy
                                </Link>
                            </span>
                        </label>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full justify-center"
                        >
                            {isLoading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="mt-6 text-center text-small text-text-secondary">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-accent-blue hover:text-accent-blue-hover font-medium transition-colors"
                        >
                            Sign in
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
                        Join thousands of developers
                    </h2>
                    <p className="text-body text-text-secondary mb-6">
                        Build, test, and deploy API workflows faster than ever. No infrastructure management needed.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-small text-text-tertiary">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-status-success" />
                            <span>Free to start</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-status-success" />
                            <span>No credit card</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
