import React, { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';

const TeacherSchedule = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [scheduleData, setScheduleData] = useState({
        quizzes: [],
        polls: [],
        assignments: []
    });
    const [filter, setFilter] = useState('all'); // 'all', 'quizzes', 'polls', 'assignments'

    useEffect(() => {
        fetchScheduleData();
    }, []);

    const fetchScheduleData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const [quizzesRes, pollsRes, assignmentsRes] = await Promise.all([
                fetch('http://localhost:3001/api/quizzes/my-quizzes', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:3001/api/polls/my-polls', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:3001/api/assignments/my-assignments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const quizzes = quizzesRes.ok ? (await quizzesRes.json()).quizzes || [] : [];
            const polls = pollsRes.ok ? (await pollsRes.json()).polls || [] : [];
            const assignments = assignmentsRes.ok ? (await assignmentsRes.json()).assignments || [] : [];

            setScheduleData({ quizzes, polls, assignments });
        } catch (err) {
            console.error('Error fetching schedule:', err);
            setError('Failed to load schedule data');
        } finally {
            setLoading(false);
        }
    };

    const getAllEvents = () => {
        const events = [];

        // Add quizzes
        scheduleData.quizzes.forEach(quiz => {
            if (quiz.deadline) {
                events.push({
                    id: `quiz-${quiz.id}`,
                    type: 'Quiz',
                    title: quiz.title,
                    deadline: new Date(quiz.deadline),
                    class: quiz.class_name,
                    subject: quiz.subject_name,
                    responses: quiz.response_count || 0,
                    color: 'primary'
                });
            }
        });

        // Add polls
        scheduleData.polls.forEach(poll => {
            if (poll.deadline) {
                events.push({
                    id: `poll-${poll.id}`,
                    type: 'Poll',
                    title: poll.title,
                    deadline: new Date(poll.deadline),
                    class: poll.class_name,
                    subject: poll.subject_name,
                    responses: poll.response_count || 0,
                    color: 'success'
                });
            }
        });

        // Add assignments
        scheduleData.assignments.forEach(assignment => {
            if (assignment.deadline) {
                events.push({
                    id: `assignment-${assignment.id}`,
                    type: 'Assignment',
                    title: assignment.title,
                    deadline: new Date(assignment.deadline),
                    class: assignment.class_name,
                    subject: assignment.subject_name,
                    submissions: assignment.submission_count || 0,
                    color: 'warning'
                });
            }
        });

        // Sort by deadline
        return events.sort((a, b) => a.deadline - b.deadline);
    };

    const getFilteredEvents = () => {
        const allEvents = getAllEvents();
        if (filter === 'all') return allEvents;
        return allEvents.filter(event => event.type.toLowerCase() === filter.slice(0, -1));
    };

    const formatDate = (date) => {
        const now = new Date();
        const diff = date - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days < 0) return 'Overdue';
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        if (days < 7) return `In ${days} days`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const getColorStyles = (color) => {
        const styles = {
            primary: 'bg-primary/10 text-primary border-primary/20',
            success: 'bg-success/10 text-success border-success/20',
            warning: 'bg-warning/10 text-warning border-warning/20',
            danger: 'bg-danger/10 text-danger border-danger/20',
        };
        return styles[color] || styles.primary;
    };

    const getIcon = (type) => {
        const icons = {
            'Quiz': '📝',
            'Poll': '📊',
            'Assignment': '📤'
        };
        return icons[type] || '📋';
    };

    if (loading) {
        return (
            <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const filteredEvents = getFilteredEvents();

    return (
        <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto">
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main">Schedule & Deadlines</h1>
                        <p className="text-text-muted">Track all your quizzes, polls, and assignment deadlines</p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b border-border overflow-x-auto">
                    {['all', 'quizzes', 'polls', 'assignments'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                                filter === tab
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-text-muted hover:text-text-main'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Events List */}
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-12 bg-bg-panel border border-border rounded-xl border-dashed">
                        <p className="text-text-muted">No upcoming deadlines</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredEvents.map((event) => {
                            const isOverdue = event.deadline < new Date();
                            const colorClass = isOverdue ? 'danger' : event.color;

                            return (
                                <div
                                    key={event.id}
                                    className="bg-bg-panel border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getColorStyles(colorClass)}`}>
                                                {getIcon(event.type)}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h3 className="font-semibold text-text-main text-lg">{event.title}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorStyles(colorClass)}`}>
                                                        {event.type}
                                                    </span>
                                                </div>

                                                <div className="space-y-1 text-sm text-text-muted">
                                                    <div className="flex flex-wrap gap-4">
                                                        <span className="flex items-center gap-1">
                                                            📅 {formatDate(event.deadline)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            ⏰ {formatTime(event.deadline)}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-4">
                                                        {event.class && (
                                                            <span className="flex items-center gap-1">
                                                                🎓 {event.class}
                                                            </span>
                                                        )}
                                                        {event.subject && (
                                                            <span className="flex items-center gap-1">
                                                                📚 {event.subject}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 text-text-secondary">
                                                        {event.type === 'Assignment' ? (
                                                            <>📊 {event.submissions} submissions</>
                                                        ) : (
                                                            <>📊 {event.responses} responses</>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                        <div className="text-2xl font-bold text-primary">{scheduleData.quizzes.length}</div>
                        <div className="text-sm text-text-muted">Total Quizzes</div>
                    </div>
                    <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                        <div className="text-2xl font-bold text-success">{scheduleData.polls.length}</div>
                        <div className="text-sm text-text-muted">Total Polls</div>
                    </div>
                    <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
                        <div className="text-2xl font-bold text-warning">{scheduleData.assignments.length}</div>
                        <div className="text-sm text-text-muted">Total Assignments</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherSchedule;

