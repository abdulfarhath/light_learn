import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth';
import Navbar from '../shared/components/Navbar';
import { classAPI } from '../features/classes/services/classAPI';
import './Classes.css';

const Classes = () => {
    const { user } = useAuth();
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
        <>
            <Navbar />
            <div className="classes-container">
                <div className="classes-content">
                    <h1>{user.role === 'teacher' ? 'My Classes' : 'Enrolled Classes'}</h1>

                    {/* Create/Join Form */}
                    {user.role === 'teacher' ? (
                        <div className="class-form-card">
                            <h2>Create New Class</h2>
                            <form onSubmit={handleCreateClass}>
                                <input
                                    type="text"
                                    placeholder="Class Name (e.g., Math 101)"
                                    value={formData.className}
                                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                                    required
                                    className="class-input"
                                />
                                <button type="submit" className="class-btn primary">
                                    Create Class
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="class-form-card">
                            <h2>Join a Class</h2>
                            <form onSubmit={handleJoinClass}>
                                <input
                                    type="text"
                                    placeholder="Enter Class Code (e.g., MTH4821)"
                                    value={formData.classCode}
                                    onChange={(e) => setFormData({ ...formData, classCode: e.target.value.toUpperCase() })}
                                    required
                                    className="class-input"
                                />
                                <button type="submit" className="class-btn primary">
                                    Join Class
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Messages */}
                    {message && <div className="success-message">{message}</div>}
                    {error && <div className="error-message">{error}</div>}

                    {/* Classes List */}
                    <div className="classes-list">
                        <h2>{user.role === 'teacher' ? 'Classes You Created' : 'Classes You Joined'}</h2>

                        {loading ? (
                            <p className="loading-text">Loading classes...</p>
                        ) : classes.length === 0 ? (
                            <p className="empty-text">
                                {user.role === 'teacher'
                                    ? 'No classes created yet. Create your first class above!'
                                    : 'Not enrolled in any classes yet. Join a class using the code from your teacher!'}
                            </p>
                        ) : (
                            <div className="class-grid">
                                {classes.map((cls) => (
                                    <div key={cls.id} className="class-card">
                                        <div className="class-header">
                                            <h3>{cls.class_name}</h3>
                                            <div className="class-code" onClick={() => copyToClipboard(cls.class_code)}>
                                                {cls.class_code}
                                                <span className="copy-hint">📋 Click to copy</span>
                                            </div>
                                        </div>

                                        <div className="class-info">
                                            {user.role === 'student' && (
                                                <div className="info-item">
                                                    <span className="label">Teacher:</span>
                                                    <span className="value">{cls.teacher_name}</span>
                                                </div>
                                            )}
                                            {user.role === 'teacher' && (
                                                <div className="info-item">
                                                    <span className="label">Students:</span>
                                                    <span className="value">{cls.student_count || 0}</span>
                                                </div>
                                            )}
                                            <div className="info-item">
                                                <span className="label">{user.role === 'teacher' ? 'Created:' : 'Joined:'}</span>
                                                <span className="value">
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
        </>
    );
};

export default Classes;
