import React from 'react';
import Card from '../shared/components/Card';

const Schedule = () => {
    const events = [
        {
            id: 1,
            title: 'Advanced React Patterns',
            type: 'Live Class',
            time: '10:00 AM - 11:30 AM',
            date: 'Today',
            instructor: 'Dr. Sarah Wilson',
            status: 'upcoming',
            color: 'primary'
        },
        {
            id: 2,
            title: 'System Design Quiz',
            type: 'Quiz Deadline',
            time: '11:59 PM',
            date: 'Tomorrow',
            instructor: 'Prof. Michael Chen',
            status: 'pending',
            color: 'warning'
        },
        {
            id: 3,
            title: 'Final Project Submission',
            type: 'Assignment',
            time: '5:00 PM',
            date: 'Dec 15, 2023',
            instructor: 'Dr. Sarah Wilson',
            status: 'pending',
            color: 'danger'
        }
    ];

    return (
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 max-w-7xl mx-auto w-full no-scrollbar">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-text-main">Schedule</h1>
                <p className="text-text-muted">Manage your classes and deadlines</p>
            </div>

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
                                        {event.type === 'Live Class' ? '🎥' : event.type === 'Quiz Deadline' ? '📝' : '📤'}
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
                                    <button className="px-4 py-2 rounded-lg bg-bg-panel border border-border text-text-main hover:bg-bg-hover transition-colors text-sm font-medium">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};

export default Schedule;
