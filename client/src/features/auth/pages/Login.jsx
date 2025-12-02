import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';


const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
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
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-bg-dark p-4">
            <div className="w-full max-w-md bg-bg-panel border border-border rounded-2xl p-8 shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-text-main mb-2">🎓 LightLearn</h1>
                    <p className="text-text-muted">Welcome back! Please login to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                            className="w-full px-4 py-3 bg-bg-dark border border-border rounded-lg text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            className="w-full px-4 py-3 bg-bg-dark border border-border rounded-lg text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-danger text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 text-center text-text-muted text-sm">
                    Don't have an account? <Link to="/register" className="text-primary hover:text-primary-dark font-medium">Register here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
