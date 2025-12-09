import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuthStore();

    const [step, setStep] = useState(1); // Step 1: Role selection, Step 2: Form
    const [selectedRole, setSelectedRole] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        // Student fields
        year: '',
        semester: '',
        branch: '',
        college: '',
        // Teacher field
        department: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setStep(2);
    };

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

        // Prepare data based on role
        const dataToSubmit = {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: selectedRole,
        };

        if (selectedRole === 'student') {
            dataToSubmit.year = formData.year;
            dataToSubmit.semester = formData.semester;
            dataToSubmit.branch = formData.branch;
            dataToSubmit.college = formData.college;
        } else {
            dataToSubmit.department = formData.department;
        }

        const result = await register(dataToSubmit);

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

                    {step === 1 ? (
                        /* Step 1: Role Selection */
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-text-main mb-2">I am a...</h2>
                                <p className="text-text-muted text-sm">Choose your role to continue</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => handleRoleSelect('student')}
                                    className="group p-6 bg-bg-dark border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all transform hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl">👨‍🎓</div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors">Student</h3>
                                            <p className="text-sm text-text-muted">Access courses, learn, and collaborate</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleRoleSelect('teacher')}
                                    className="group p-6 bg-bg-dark border-2 border-border rounded-2xl hover:border-success hover:bg-success/5 transition-all transform hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl">👨‍🏫</div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-bold text-text-main group-hover:text-success transition-colors">Teacher</h3>
                                            <p className="text-sm text-text-muted">Create courses, teach, and inspire</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Registration Form */
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-text-muted hover:text-text-main transition-colors flex items-center gap-2"
                                >
                                    <span>←</span> Back
                                </button>
                                <div className="text-sm text-text-muted">
                                    Registering as <span className="font-semibold text-primary">{selectedRole === 'student' ? 'Student' : 'Teacher'}</span>
                                </div>
                            </div>

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

                            {selectedRole === 'student' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                    <div className="space-y-2">
                                        <label htmlFor="year" className="block text-sm font-medium text-text-secondary">Year</label>
                                        <select
                                            id="year"
                                            name="year"
                                            value={formData.year}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Year</option>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="semester" className="block text-sm font-medium text-text-secondary">Semester</label>
                                        <select
                                            id="semester"
                                            name="semester"
                                            value={formData.semester}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Semester</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                                <option key={sem} value={sem}>Semester {sem}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="branch" className="block text-sm font-medium text-text-secondary">Branch</label>
                                        <input
                                            type="text"
                                            id="branch"
                                            name="branch"
                                            value={formData.branch}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g. CSE"
                                            className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="college" className="block text-sm font-medium text-text-secondary">College</label>
                                        <input
                                            type="text"
                                            id="college"
                                            name="college"
                                            value={formData.college}
                                            onChange={handleChange}
                                            required
                                            placeholder="College Name"
                                            className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedRole === 'teacher' && (
                                <div className="space-y-2 animate-fade-in">
                                    <label htmlFor="department" className="block text-sm font-medium text-text-secondary">Department</label>
                                    <input
                                        type="text"
                                        id="department"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Computer Science"
                                        className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            )}

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
                    )}

                    <div className="text-center text-text-muted text-sm">
                        Already have an account? <Link to="/login" className="text-primary hover:text-primary-dark font-bold hover:underline">Login here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
