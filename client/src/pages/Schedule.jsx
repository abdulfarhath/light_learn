import React, { useState } from 'react';
import Card from '../shared/components/Card';
import useAuthStore from '../stores/authStore';
import AssignmentModal from '../components/AssignmentModal';

const Schedule = () => {
    const { user } = useAuthStore();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showAssignment, setShowAssignment] = useState(false);
    
    // Student events
    const studentEvents = [
        {
            id: 1,
            title: 'Advanced React Patterns',
            type: 'Live Class',
            time: '10:00 AM - 11:30 AM',
            date: 'Today',
            instructor: 'Dr. Sarah Wilson',
            status: 'upcoming',
            color: 'primary',
            description: 'Explore advanced React patterns including render props, custom hooks, and performance optimization techniques.',
            location: 'Room 301',
            meetingLink: 'https://meet.example.com/react101'
        },
        {
            id: 2,
            title: 'System Design Quiz',
            type: 'Quiz Deadline',
            time: '11:59 PM',
            date: 'Tomorrow',
            instructor: 'Prof. Michael Chen',
            status: 'pending',
            color: 'warning',
            description: 'Quiz covering fundamental system design principles, scalability, and architecture patterns.',
            totalQuestions: 20,
            duration: '60 minutes'
        },
        {
            id: 3,
            title: 'Final Project Submission',
            type: 'Assignment',
            time: '5:00 PM',
            date: 'Dec 15, 2023',
            instructor: 'Dr. Sarah Wilson',
            status: 'pending',
            color: 'danger',
            description: 'Submit your final project including documentation, source code, and a live demo.',
            submissionLink: 'https://classroom.example.com/submit'
        }
    ];

    // Teacher events
    const teacherEvents = [
        {
            id: 1,
            title: 'Conduct Advanced React Patterns Class',
            type: 'Live Session',
            time: '10:00 AM - 11:30 AM',
            date: 'Today',
            class: 'Advanced Programming',
            status: 'upcoming',
            color: 'primary',
            description: 'Live teaching session on React patterns. Expected 45 students.',
            location: 'Room 301',
            meetingLink: 'https://meet.example.com/react101'
        },
        {
            id: 2,
            title: 'Review System Design Submissions',
            type: 'Grading Deadline',
            time: '11:59 PM',
            date: 'Tomorrow',
            class: 'System Design Course',
            status: 'pending',
            color: 'warning',
            description: 'Review and grade 30 student submissions for the System Design project.',
            studentCount: 30
        },
        {
            id: 3,
            title: 'Final Exam Proctoring',
            type: 'Exam',
            time: '2:00 PM - 4:00 PM',
            date: 'Dec 16, 2023',
            class: 'Data Structures',
            status: 'pending',
            color: 'danger',
            description: 'Proctor final examination for Data Structures course.',
            location: 'Exam Hall B'
        }
    ];

    const events = user?.role === 'teacher' ? teacherEvents : studentEvents;

    return (
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 max-w-7xl mx-auto w-full no-scrollbar">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-text-main">
                    {user?.role === 'teacher' ? 'Teaching Schedule' : 'My Schedule'}
                </h1>
                <p className="text-text-muted">
                    {user?.role === 'teacher' ? 'Manage your upcoming sessions and deadlines' : 'Keep track of your classes and assignments'}
                </p>
            </div>

            {selectedEvent && !showAssignment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-2xl w-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-text-main mb-2">{selectedEvent.title}</h2>
                                <p className="text-text-muted">{selectedEvent.date} • {selectedEvent.time}</p>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="text-text-muted hover:text-text-main text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-sm font-semibold text-text-secondary">Description</label>
                                <p className="text-text-main mt-1">{selectedEvent.description}</p>
                            </div>
                            
                            {user?.role === 'student' && selectedEvent.instructor && (
                                <div>
                                    <label className="text-sm font-semibold text-text-secondary">Instructor</label>
                                    <p className="text-text-main mt-1">👨‍🏫 {selectedEvent.instructor}</p>
                                </div>
                            )}

                            {user?.role === 'teacher' && selectedEvent.class && (
                                <div>
                                    <label className="text-sm font-semibold text-text-secondary">Class</label>
                                    <p className="text-text-main mt-1">🎓 {selectedEvent.class}</p>
                                </div>
                            )}

                            {user?.role === 'teacher' && selectedEvent.studentCount && (
                                <div>
                                    <label className="text-sm font-semibold text-text-secondary">Students</label>
                                    <p className="text-text-main mt-1">👥 {selectedEvent.studentCount} students</p>
                                </div>
                            )}
                            
                            {selectedEvent.location && (
                                <div>
                                    <label className="text-sm font-semibold text-text-secondary">Location</label>
                                    <p className="text-text-main mt-1">📍 {selectedEvent.location}</p>
                                </div>
                            )}
                            
                            {selectedEvent.totalQuestions && (
                                <div>
                                    <label className="text-sm font-semibold text-text-secondary">Quiz Details</label>
                                    <p className="text-text-main mt-1">📝 {selectedEvent.totalQuestions} questions • {selectedEvent.duration}</p>
                                </div>
                            )}

                            {selectedEvent.meetingLink && (
                                <a
                                    href={selectedEvent.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                                >
                                    Join Meeting 🎥
                                </a>
                            )}

                            {user?.role === 'student' && selectedEvent.type === 'Assignment' && (
                                <button
                                    onClick={() => setShowAssignment(true)}
                                    className="inline-block px-4 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors text-sm font-medium"
                                >
                                    Enter Assignment 📝
                                </button>
                            )}
                        </div>
                        
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="w-full px-4 py-2 bg-bg-dark border border-border text-text-main rounded-lg hover:bg-bg-hover transition-colors font-medium"
                        >
                            Close
                        </button>
                    </Card>
                </div>
            )}

            <Card className="w-full">
                <div className="flex flex-col gap-4">
                    {events.map((event) => {
                        const colorStyles = {
                            primary: 'bg-primary/10 text-primary border-primary/20',
                            success: 'bg-success/10 text-success border-success/20',
                            warning: 'bg-warning/10 text-warning border-warning/20',
                            danger: 'bg-danger/10 text-danger border-danger/20',
                        };

                        return (
                            <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-bg-dark border border-border hover:border-primary/30 transition-all gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorStyles[event.color]}`}>
                                        {user?.role === 'teacher' 
                                            ? (event.type === 'Live Session' ? '📡' : event.type === 'Grading Deadline' ? '✅' : '📋')
                                            : (event.type === 'Live Class' ? '🎥' : event.type === 'Quiz Deadline' ? '📝' : '📤')
                                        }
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-main text-lg">{event.title}</h3>
                                        <div className="flex flex-wrap gap-3 text-sm text-text-muted mt-1">
                                            <span className="flex items-center gap-1">
                                                📅 {event.date}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                ⏰ {event.time}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                👨‍🏫 {event.instructor}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorStyles[event.color]}`}>
                                        {event.type}
                                    </span>
                                    <button 
                                        onClick={() => setSelectedEvent(event)}
                                        className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors text-sm font-medium"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {showAssignment && (
                <AssignmentModal
                    assignment={selectedEvent}
                    onClose={() => {
                        setShowAssignment(false);
                        setSelectedEvent(null);
                    }}
                />
            )}
        </div>
    );
};

export default Schedule;
