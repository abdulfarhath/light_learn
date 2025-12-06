import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import courseAPI from '../services/courseAPI';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';

const Courses = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('enrolled'); // 'enrolled' or 'all'
    const [searchQuery, setSearchQuery] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, [activeTab]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            setError(null);

            let data;
            if (activeTab === 'enrolled') {
                data = await courseAPI.getEnrolledCourses();
                setCourses(data.classes || []);
            } else {
                data = await courseAPI.getAllCourses();
                setCourses(data.classes || []);
            }
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError(err.response?.data?.error || 'Failed to load courses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinCourse = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        try {
            setJoining(true);
            await courseAPI.enrollInCourse(joinCode);
            setShowJoinModal(false);
            setJoinCode('');
            // Refresh enrolled courses
            setActiveTab('enrolled');
            fetchCourses();
        } catch (err) {
            console.error('Error joining course:', err);
            alert(err.response?.data?.error || 'Failed to join course. Please check the code and try again.');
        } finally {
            setJoining(false);
        }
    };

    const handleCourseClick = (course) => {
        // Navigate to class details or course page
        navigate('/classes');
    };

    // Filter courses based on search query
    const filteredCourses = courses.filter(course =>
        course.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.class_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-main p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
                            <p className="text-lg text-text-secondary">Loading your courses...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-main p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-2 flex items-center gap-3">
                                <span className="text-4xl">📚</span>
                                My Courses
                            </h1>
                            <p className="text-text-secondary">
                                {activeTab === 'enrolled'
                                    ? 'All your enrolled subjects for the current semester'
                                    : 'Browse all available courses'
                                }
                            </p>
                        </div>

                        {user?.role === 'student' && (
                            <Button
                                onClick={() => setShowJoinModal(true)}
                                className="whitespace-nowrap"
                            >
                                <span className="mr-2">➕</span>
                                Join Course
                            </Button>
                        )}
                    </div>

                    {/* Tabs */}
                    {user?.role === 'student' && (
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setActiveTab('enrolled')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === 'enrolled'
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'bg-bg-panel text-text-secondary hover:bg-bg-hover'
                                    }`}
                            >
                                📖 My Courses
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === 'all'
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'bg-bg-panel text-text-secondary hover:bg-bg-hover'
                                    }`}
                            >
                                🌐 All Courses
                            </button>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search courses by name, code, or teacher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 pl-12 bg-bg-panel border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <Card className="p-8 text-center mb-6 bg-red-500/10 border-red-500/20">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-text-main mb-2">Oops!</h2>
                        <p className="text-text-secondary mb-6">{error}</p>
                        <Button onClick={fetchCourses}>Try Again</Button>
                    </Card>
                )}

                {/* Courses Grid */}
                {!error && (
                    <>
                        {filteredCourses.length === 0 ? (
                            <Card className="p-12 text-center">
                                <div className="text-6xl mb-4">
                                    {searchQuery ? '🔍' : '📖'}
                                </div>
                                <h2 className="text-2xl font-bold text-text-main mb-2">
                                    {searchQuery ? 'No Results Found' : 'No Courses Yet'}
                                </h2>
                                <p className="text-text-secondary mb-6">
                                    {searchQuery
                                        ? `No courses match "${searchQuery}". Try a different search term.`
                                        : activeTab === 'enrolled'
                                            ? "You haven't enrolled in any courses yet. Join a class to get started!"
                                            : "No courses available at the moment."
                                    }
                                </p>
                                {!searchQuery && activeTab === 'enrolled' && (
                                    <Button onClick={() => setShowJoinModal(true)}>
                                        Join a Course
                                    </Button>
                                )}
                            </Card>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredCourses.map((course) => (
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                            onClick={() => handleCourseClick(course)}
                                            isEnrolled={activeTab === 'enrolled'}
                                        />
                                    ))}
                                </div>

                                {/* Stats Summary - Only for enrolled courses */}
                                {activeTab === 'enrolled' && filteredCourses.length > 0 && (
                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                                            <div className="flex items-center gap-4">
                                                <div className="text-4xl">📊</div>
                                                <div>
                                                    <div className="text-3xl font-bold text-primary">
                                                        {filteredCourses.length}
                                                    </div>
                                                    <div className="text-sm text-text-secondary">Total Courses</div>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                                            <div className="flex items-center gap-4">
                                                <div className="text-4xl">👨‍🏫</div>
                                                <div>
                                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                        {new Set(filteredCourses.map(c => c.teacher_name)).size}
                                                    </div>
                                                    <div className="text-sm text-text-secondary">Instructors</div>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                                            <div className="flex items-center gap-4">
                                                <div className="text-4xl">✅</div>
                                                <div>
                                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                        Active
                                                    </div>
                                                    <div className="text-sm text-text-secondary">Enrollment Status</div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Join Course Modal */}
                {showJoinModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                                    <span>📝</span>
                                    Join a Course
                                </h2>
                                <button
                                    onClick={() => setShowJoinModal(false)}
                                    className="text-text-muted hover:text-text-main text-2xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleJoinCourse}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Class Code
                                    </label>
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        placeholder="Enter class code (e.g., ABC123)"
                                        className="w-full px-4 py-3 bg-bg-main border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                        disabled={joining}
                                    />
                                    <p className="mt-2 text-xs text-text-muted">
                                        Ask your teacher for the class code to join the course.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowJoinModal(false)}
                                        className="flex-1 px-4 py-3 bg-bg-dark border border-border rounded-lg text-text-secondary hover:text-text-main hover:bg-bg-hover transition-colors font-medium"
                                        disabled={joining}
                                    >
                                        Cancel
                                    </button>
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={joining || !joinCode.trim()}
                                    >
                                        {joining ? 'Joining...' : 'Join Course'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

// Course Card Component
const CourseCard = ({ course, onClick, isEnrolled }) => {
    return (
        <Card
            className="p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/40 group relative overflow-hidden"
            onClick={onClick}
        >
            {/* Background Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10">
                {/* Course Icon & Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                        📖
                    </div>
                    {isEnrolled && (
                        <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                ✓ Enrolled
                            </span>
                        </div>
                    )}
                </div>

                {/* Course Name */}
                <h3 className="text-xl font-bold text-text-main mb-3 line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                    {course.class_name}
                </h3>

                {/* Course Code */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-mono px-3 py-1.5 rounded-lg bg-bg-dark/50 border border-border text-text-secondary font-semibold">
                        {course.class_code}
                    </span>
                </div>

                {/* Teacher Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-base font-bold text-primary">
                        {course.teacher_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-muted mb-0.5">Instructor</p>
                        <p className="text-sm font-medium text-text-main truncate">
                            {course.teacher_name}
                        </p>
                    </div>
                </div>

                {/* Hover Indicator */}
                <div className="mt-4 pt-4 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between text-sm text-primary font-medium">
                        <span>View Details</span>
                        <span className="text-lg">→</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default Courses;
