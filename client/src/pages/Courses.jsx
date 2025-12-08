   import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import coursesAPI from '../features/courses/services/coursesAPI';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';

const Courses = () => {
    const { user } = useAuthStore();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        subject_name: '',
        subject_code: '',
        year: '',
        semester: '',
        branch: '',
        college: ''
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await coursesAPI.getSubjects();
            setSubjects(data.subjects || []);
        } catch (err) {
            console.error('Error fetching subjects:', err);
            if (err.response && err.response.status === 400) {
                setError(err.response.data.error);
            } else {
                setError('Failed to load subjects. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setSubmitError('');

        try {
            await coursesAPI.createSubject(formData);
            setShowAddModal(false);
            setFormData({
                subject_name: '',
                subject_code: '',
                year: '',
                semester: '',
                branch: '',
                college: ''
            });
            fetchSubjects(); // Refresh list
        } catch (err) {
            setSubmitError(err.response?.data?.error || 'Failed to create subject');
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-main p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                            <p className="text-text-secondary">Loading your subjects...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-main p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-2 flex items-center gap-3">
                            <span className="text-4xl">📚</span>
                            {user.role === 'teacher' ? 'Manage Courses' : 'My Subjects'}
                        </h1>
                        <p className="text-text-secondary">
                            {user.role === 'teacher' ? 'Add and manage course subjects' : 'Subjects for your current semester'}
                        </p>
                    </div>
                    
                    {user.role === 'teacher' && (
                        <Button onClick={() => setShowAddModal(true)}>
                            + Add Course
                        </Button>
                    )}
                </div>

                {error && !subjects.length ? (
                    <Card className="p-8 text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-text-main mb-2">Oops!</h2>
                        <p className="text-text-secondary mb-6">{error}</p>
                        <Button onClick={fetchSubjects}>Try Again</Button>
                    </Card>
                ) : subjects.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="text-6xl mb-4">📖</div>
                        <h2 className="text-2xl font-bold text-text-main mb-2">No Subjects Found</h2>
                        <p className="text-text-secondary mb-6">
                            {user.role === 'teacher' 
                                ? 'No subjects created yet. Add your first course!' 
                                : 'No subjects found for your current semester/branch.'}
                        </p>
                        {user.role === 'teacher' && (
                            <Button onClick={() => setShowAddModal(true)}>
                                Create First Course
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map((subject) => (
                            <SubjectCard
                                key={subject.id}
                                subject={subject}
                            />
                        ))}
                    </div>
                )}

                {/* Add Course Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-bg-panel border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-border flex justify-between items-center">
                                <h3 className="text-xl font-bold text-text-main">Add New Course</h3>
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="text-text-secondary hover:text-text-main"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <form onSubmit={handleAddSubject} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Subject Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary"
                                        placeholder="e.g. Data Structures"
                                        value={formData.subject_name}
                                        onChange={(e) => setFormData({...formData, subject_name: e.target.value})}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Subject Code</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary"
                                            placeholder="e.g. CS201"
                                            value={formData.subject_code}
                                            onChange={(e) => setFormData({...formData, subject_code: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Branch</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary"
                                            placeholder="e.g. CSE"
                                            value={formData.branch}
                                            onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Year</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="4"
                                            className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary"
                                            placeholder="e.g. 2"
                                            value={formData.year}
                                            onChange={(e) => setFormData({...formData, year: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Semester</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="8"
                                            className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary"
                                            placeholder="e.g. 3"
                                            value={formData.semester}
                                            onChange={(e) => setFormData({...formData, semester: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">College</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary"
                                        placeholder="e.g. Engineering College"
                                        value={formData.college}
                                        onChange={(e) => setFormData({...formData, college: e.target.value})}
                                    />
                                </div>

                                {submitError && (
                                    <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm">
                                        {submitError}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 text-text-secondary hover:text-text-main transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <Button type="submit" disabled={submitLoading}>
                                        {submitLoading ? 'Creating...' : 'Create Course'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Subject Card Component
const SubjectCard = ({ subject }) => {
    return (
        <Card className="p-6 transition-all duration-300 hover:shadow-xl hover:border-primary/40 group">
            {/* Subject Icon & Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                    📘
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Sem {subject.semester}
                    </span>
                </div>
            </div>

            {/* Subject Name */}
            <h3 className="text-xl font-bold text-text-main mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {subject.subject_name}
            </h3>

            {/* Subject Code */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-mono px-2 py-1 rounded bg-bg-dark border border-border text-text-secondary">
                    {subject.subject_code}
                </span>
            </div>

            {/* Details */}
            <div className="flex items-center gap-3 pt-4 border-t border-border text-sm text-text-secondary">
                <div>📅 Year {subject.year}</div>
                <div>•</div>
                <div>🏛️ {subject.branch}</div>
            </div>
        </Card>
    );
};

export default Courses;
