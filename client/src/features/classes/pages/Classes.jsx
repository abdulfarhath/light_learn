import React, { useState, useEffect } from 'react';
import useAuthStore from '../../../stores/authStore';
import { classAPI } from '../../../shared/utils/api';

const Classes = () => {
    const { user } = useAuthStore();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        className: '',
        classCode: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await classAPI.getMyClasses(user.role);
            setClasses(response.classes);
        } catch (error) {
            console.error('Error fetching classes:', error);
            setError('Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const response = await classAPI.createClass(formData.className);
            setMessage(`Class created! Code: ${response.class.class_code}`);
            setFormData({ ...formData, className: '' });
            fetchClasses(); // Refresh list
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to create class');
        }
    };

    const handleJoinClass = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const response = await classAPI.joinClass(formData.classCode);
            setMessage(response.message);
            setFormData({ ...formData, classCode: '' });
            fetchClasses(); // Refresh list
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to join class');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setMessage(`Copied ${text} to clipboard!`);
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto no-scrollbar">
            <div className="flex flex-col gap-6">
                <h1 className="text-3xl font-bold text-text-main">{user.role === 'teacher' ? 'My Classes' : 'Enrolled Classes'}</h1>

                {/* Create/Join Form */}
                <div className="bg-bg-panel border border-border rounded-xl p-6 shadow-lg">
                    <h2 className="text-xl font-semibold text-text-main mb-4">
                        {user.role === 'teacher' ? 'Create New Class' : 'Join a Class'}
                    </h2>
                    <form onSubmit={user.role === 'teacher' ? handleCreateClass : handleJoinClass} className="flex gap-4">
                        <input
                            type="text"
                            placeholder={user.role === 'teacher' ? "Class Name (e.g., Math 101)" : "Enter Class Code (e.g., MTH4821)"}
                            value={user.role === 'teacher' ? formData.className : formData.classCode}
                            onChange={(e) => setFormData({
                                ...formData,
                                [user.role === 'teacher' ? 'className' : 'classCode']: user.role === 'teacher' ? e.target.value : e.target.value.toUpperCase()
                            })}
                            required
                            className="flex-1 bg-bg-dark border border-border rounded-lg px-4 py-3 text-text-main focus:border-primary focus:outline-none transition-colors"
                        />
                        <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-lg shadow-primary/20">
                            {user.role === 'teacher' ? 'Create Class' : 'Join Class'}
                        </button>
                    </form>
                </div>

                {/* Messages */}
                {message && <div className="bg-success/20 border border-success/30 text-success px-4 py-3 rounded-lg">{message}</div>}
                {error && <div className="bg-danger/20 border border-danger/30 text-danger px-4 py-3 rounded-lg">{error}</div>}

                {/* Classes List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-text-main border-l-4 border-primary pl-3">
                        {user.role === 'teacher' ? 'Classes You Created' : 'Classes You Joined'}
                    </h2>

                    {loading ? (
                        <p className="text-text-muted animate-pulse">Loading classes...</p>
                    ) : classes.length === 0 ? (
                        <p className="text-text-muted italic">
                            {user.role === 'teacher'
                                ? 'No classes created yet. Create your first class above!'
                                : 'Not enrolled in any classes yet. Join a class using the code from your teacher!'}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classes.map((cls) => (
                                <div key={cls.id} className="bg-bg-panel border border-border rounded-xl p-6 hover:border-primary/50 transition-all hover:shadow-lg group">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-text-main group-hover:text-primary transition-colors">{cls.class_name}</h3>
                                        <div
                                            className="bg-bg-dark px-3 py-1 rounded text-sm font-mono text-text-secondary cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors relative group/code"
                                            onClick={() => copyToClipboard(cls.class_code)}
                                            title="Click to copy"
                                        >
                                            {cls.class_code}
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover/code:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Copy Code
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-text-secondary">
                                        {user.role === 'student' && (
                                            <div className="flex justify-between">
                                                <span className="text-text-muted">Teacher:</span>
                                                <span className="font-medium text-text-main">{cls.teacher_name}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-text-muted">Students:</span>
                                            <span className="font-medium text-text-main">{cls.student_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-muted">Created:</span>
                                            <span className="font-medium text-text-main">
                                                {new Date(user.role === 'teacher' ? cls.created_at : cls.enrolled_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Classes;
