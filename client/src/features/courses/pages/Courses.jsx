import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import courseAPI from '../services/coursesAPI';
import CourseCard from './CourseCard';
import Card from '../../../shared/components/Card'; // Keep generic Card for error/empty states if needed, or replace all

const Courses = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await courseAPI.getSubjects();
            setSubjects(data.subjects || []);
        } catch (err) {
            console.error('Error fetching subjects:', err);
            setError('Failed to load subjects. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-main p-6 flex items-center justify-center">
                <div className="text-xl text-text-secondary">Loading subjects...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg-main p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">{error}</div>
                    <button
                        onClick={fetchSubjects}
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-main p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-main mb-2">My Subjects</h1>
                    <p className="text-text-secondary">Subjects for your current semester</p>
                </div>

                {subjects.length === 0 ? (
                    <Card className="p-8 text-center">
                        <p className="text-text-secondary">No subjects found for your current semester/branch.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map((subject) => (
                            <CourseCard
                                key={subject.id}
                                className="p-6 hover:shadow-lg transition-shadow cursor-pointer border border-border"
                                onClick={() => navigate(`/subjects/${subject.id}`)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                                        📚
                                    </div>
                                    <span className="px-2 py-1 text-xs font-medium bg-bg-dark rounded border border-border text-text-secondary">
                                        {subject.subject_code}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-text-main mb-2">{subject.subject_name}</h3>
                                <div className="text-sm text-text-secondary space-y-1">
                                    <p>Year {subject.year} • Semester {subject.semester}</p>
                                    <p>{subject.branch}</p>
                                    <p className="text-xs text-text-muted">{subject.college}</p>
                                </div>
                            </CourseCard>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Courses;