import React, { useState, useEffect } from 'react';
import useAuthStore from '../../../stores/authStore';
import { classAPI } from '../services/classAPI';
import ClassDetails from './ClassDetails';

const Classes = () => {
    const { user } = useAuthStore();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState(null);
    const [formData, setFormData] = useState({
        className: '',
        classCode: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.role) {
            fetchClasses();
        }
    }, [user?.role]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const classes = await classAPI.getMyClasses(user.role);
            setClasses(classes || []);
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

    if (!user) {
        return (
            <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto flex items-center justify-center">
                <div className="text-xl text-text-secondary">Loading user data...</div>
            </div>
        );
    }

    if (selectedClass) {
        return (
            <ClassDetails
                classData={selectedClass}
                onBack={() => setSelectedClass(null)}
                role={user.role}
            />
        );
    }

    return (
        <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-text-main">
                        {user.role === 'teacher' ? 'My Classes' : 'Enrolled Classes'}
                    </h1>
                    <p className="text-text-muted">
                        {user.role === 'teacher' 
                            ? 'Manage your classes and students' 
                            : 'View and access your enrolled classes'}
                    </p>
                </div>

                {/* Action Card */}
                <div className="bg-bg-panel border border-border rounded-xl p-6 shadow-lg">
                    <h2 className="text-xl font-semibold text-text-main mb-4">
                        {user.role === 'teacher' ? 'Create New Class' : 'Join a Class'}
                    </h2>
                    
                    <form onSubmit={user.role === 'teacher' ? handleCreateClass : handleJoinClass} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                                {user.role === 'teacher' ? 'Class Name' : 'Class Code'}
                            </label>
                            <input
                                type="text"
                                placeholder={user.role === 'teacher' ? "e.g., Advanced Mathematics" : "e.g., MTH4821"}
                                value={user.role === 'teacher' ? formData.className : formData.classCode}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    [user.role === 'teacher' ? 'className' : 'classCode']: user.role === 'teacher' ? e.target.value : e.target.value.toUpperCase() 
                                })}
                                required
                                className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="w-full md:w-auto bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md whitespace-nowrap"
                        >
                            {user.role === 'teacher' ? 'Create Class' : 'Join Class'}
                        </button>
                    </form>

                    {message && (
                        <div className="mt-4 p-3 bg-success/10 border border-success/20 text-success rounded-lg text-sm">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="mt-4 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Classes Grid */}
                <div>
                    <h2 className="text-xl font-semibold text-text-main mb-4">
                        {user.role === 'teacher' ? 'Your Classes' : 'Joined Classes'}
                    </h2>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="text-center py-12 bg-bg-panel border border-border rounded-xl border-dashed">
                            <p className="text-text-muted">
                                {user.role === 'teacher'
                                    ? 'No classes created yet. Create your first class above!'
                                    : 'Not enrolled in any classes yet. Join a class using the code from your teacher!'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classes.map((cls) => (
                                <div key={cls.id} className="bg-bg-panel border border-border rounded-xl p-5 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                                            
                                        </div>
                                        <div 
                                            onClick={() => copyToClipboard(cls.class_code)}
                                            className="cursor-pointer px-2 py-1 bg-bg-dark border border-border rounded text-xs font-mono text-text-secondary hover:text-primary hover:border-primary transition-colors flex items-center gap-1"
                                            title="Click to copy code"
                                        >
                                            {cls.class_code}
                                            <span className="text-[10px]"></span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-text-main mb-2 group-hover:text-primary transition-colors">
                                        {cls.class_name}
                                    </h3>
                                    
                                    <div className="space-y-2 text-sm text-text-secondary">
                                        {user.role === 'student' && (
                                            <div className="flex justify-between">
                                                <span>Teacher:</span>
                                                <span className="text-text-main font-medium">{cls.teacher_name}</span>
                                            </div>
                                        )}
                                        {user.role === 'teacher' && (
                                            <div className="flex justify-between">
                                                <span>Students:</span>
                                                <span className="text-text-main font-medium">{cls.student_count || 0}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>{user.role === 'teacher' ? 'Created:' : 'Joined:'}</span>
                                            <span className="text-text-main">
                                                {new Date(user.role === 'teacher' ? cls.created_at : cls.enrolled_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setSelectedClass(cls)}
                                        className="w-full mt-4 py-2 bg-bg-dark hover:bg-bg-hover border border-border rounded-lg text-sm font-medium text-text-main transition-colors"
                                    >
                                        View Details
                                    </button>
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
