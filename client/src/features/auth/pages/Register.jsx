import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuthStore();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const result = await register(formData);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen bg-bg-dark">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/20 z-10 mix-blend-overlay"></div>
                <img
                    src="/auth_bg.gif"
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 p-16 text-white z-20 bg-gradient-to-t from-black/80 to-transparent w-full">
                    <h2 className="text-5xl font-bold mb-6">Join Us Today!</h2>
                    <p className="text-xl opacity-90 max-w-md leading-relaxed">
                        Start your learning journey and unlock your full potential with our expert-led courses.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-bg-panel">
                <div className="w-full max-w-md space-y-8 animate-fade-in">
                    <div className="text-center">
                        <div className="inline-block p-3 rounded-2xl bg-primary/10 mb-4">
                            <span className="text-4xl">🎓</span>
                        </div>
                        <h1 className="text-3xl font-bold text-text-main mb-2">Create Account</h1>
                        <p className="text-text-muted">Join our community of learners</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="full_name" className="block text-sm font-medium text-text-secondary">Full Name</label>
                            <input
                                type="text"
                                id="full_name"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                                placeholder="Enter your full name"
                                autoComplete="name"
                                className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-text-secondary">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="Enter your email"
                                autoComplete="email"
                                className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-text-secondary">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
                                className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="role" className="block text-sm font-medium text-text-secondary">I am a...</label>
                            <div className="relative">
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-text-muted">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3.5 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Creating account...
                                </span>
                            ) : 'Register'}
                        </button>
                    </form>

                    <div className="text-center text-text-muted text-sm">
                        Already have an account? <Link to="/login" className="text-primary hover:text-primary-dark font-bold hover:underline">Login here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
