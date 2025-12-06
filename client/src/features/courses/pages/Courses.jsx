import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import coursesAPI from '../services/coursesAPI';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';

const Courses = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await coursesAPI.getSubjects();
            console.log('Courses Page - Fetched Data:', data);
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

    if (error) {
        return (
            <div className="min-h-screen bg-bg-main p-6">
                <div className="max-w-7xl mx-auto">
                    <Card className="p-8 text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-text-main mb-2">Oops!</h2>
                        <p className="text-text-secondary mb-6">{error}</p>
                        <Button onClick={fetchSubjects}>Try Again</Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-main p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-2 flex items-center gap-3">
                        <span className="text-4xl">📚</span>
                        My Subjects
                    </h1>
                    <p className="text-text-secondary">
                        Subjects for your current semester
                    </p>
                </div>

                {/* Subjects Grid */}
                {subjects.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="text-6xl mb-4">📖</div>
                        <h2 className="text-2xl font-bold text-text-main mb-2">No Subjects Found</h2>
                        <p className="text-text-secondary mb-6">
                            No subjects found for your current semester/branch.
                        </p>
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
