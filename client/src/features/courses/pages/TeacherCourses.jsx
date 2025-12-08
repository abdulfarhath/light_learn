import React, { useState, useEffect } from 'react';
import useAuthStore from '../../../stores/authStore';
import coursesAPI from '../services/coursesAPI';

const TeacherCourses = () => {
    const { user } = useAuthStore();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        subject_name: '',
        subject_code: '',
        year: user?.year || '',
        semester: user?.semester || '',
        branch: user?.branch || '',
        college: user?.college || ''
    });

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
            setError('Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            if (editingSubject) {
                await coursesAPI.updateSubject(editingSubject.id, formData);
                setMessage('Subject updated successfully!');
            } else {
                await coursesAPI.createSubject(formData);
                setMessage('Subject created successfully!');
            }
            
            setShowModal(false);
            setEditingSubject(null);
            resetForm();
            fetchSubjects();
            
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save subject');
        }
    };

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        setFormData({
            subject_name: subject.subject_name,
            subject_code: subject.subject_code,
            year: subject.year,
            semester: subject.semester,
            branch: subject.branch,
            college: subject.college
        });
        setShowModal(true);
    };

    const handleDelete = async (subjectId) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) return;

        try {
            await coursesAPI.deleteSubject(subjectId);
            setMessage('Subject deleted successfully!');
            fetchSubjects();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete subject');
        }
    };

    const resetForm = () => {
        setFormData({
            subject_name: '',
            subject_code: '',
            year: user?.year || '',
            semester: user?.semester || '',
            branch: user?.branch || '',
            college: user?.college || ''
        });
    };

    const openCreateModal = () => {
        setEditingSubject(null);
        resetForm();
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto">
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main">Course Management</h1>
                        <p className="text-text-muted">Create and manage subjects/courses</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-md"
                    >
                        + Create New Course
                    </button>
                </div>

                {/* Messages */}
                {message && (
                    <div className="p-3 bg-success/10 border border-success/20 text-success rounded-lg text-sm">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Subjects List */}
                {subjects.length === 0 ? (
                    <div className="text-center py-12 bg-bg-panel border border-border rounded-xl border-dashed">
                        <p className="text-text-muted">No courses created yet. Create your first course above!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map((subject) => (
                            <div key={subject.id} className="bg-bg-panel border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                                        📚
                                    </div>
                                    <span className="px-2 py-1 text-xs font-medium bg-bg-dark rounded border border-border text-text-secondary">
                                        {subject.subject_code}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-text-main mb-2">{subject.subject_name}</h3>

                                <div className="space-y-1 text-sm text-text-muted mb-4">
                                    <p>Year: {subject.year} | Semester: {subject.semester}</p>
                                    <p>Branch: {subject.branch}</p>
                                    <p>College: {subject.college}</p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(subject)}
                                        className="flex-1 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(subject.id)}
                                        className="flex-1 px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg font-medium transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-bg-panel border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-text-main mb-4">
                                {editingSubject ? 'Edit Course' : 'Create New Course'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">
                                        Subject Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject_name}
                                        onChange={(e) => setFormData({...formData, subject_name: e.target.value})}
                                        className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="e.g., Data Structures"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">
                                        Subject Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject_code}
                                        onChange={(e) => setFormData({...formData, subject_code: e.target.value})}
                                        className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="e.g., CS201"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">
                                            Year *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="5"
                                            value={formData.year}
                                            onChange={(e) => setFormData({...formData, year: e.target.value})}
                                            className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">
                                            Semester *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="10"
                                            value={formData.semester}
                                            onChange={(e) => setFormData({...formData, semester: e.target.value})}
                                            className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">
                                        Branch *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.branch}
                                        onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                        className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="e.g., Computer Science"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">
                                        College *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.college}
                                        onChange={(e) => setFormData({...formData, college: e.target.value})}
                                        className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="e.g., MIT"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingSubject(null);
                                            resetForm();
                                        }}
                                        className="flex-1 px-4 py-2 bg-bg-dark hover:bg-bg-dark/80 text-text-main rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
                                    >
                                        {editingSubject ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherCourses;

