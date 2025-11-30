import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';
import Navbar from '../shared/components/Navbar';
import StatCard from '../shared/components/StatCard';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';
import { classAPI } from '../services/api';
import './Dashboard.css';

const NewDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalClasses: 0,
        totalStudents: 0,
        activeSessions: 0,
        completedActivities: 0
    });
    const [recentClasses, setRecentClasses] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await classAPI.getMyClasses(user.role);
            const classes = response.classes || [];

            setRecentClasses(classes.slice(0, 3)); // Get 3 most recent

            if (user.role === 'teacher') {
                const totalStudents = classes.reduce((sum, cls) => sum + parseInt(cls.student_count || 0), 0);
                setStats({
                    totalClasses: classes.length,
                    totalStudents: totalStudents,
                    activeSessions: 0, // Placeholder for future feature
                    completedActivities: 0 // Placeholder
                });
            } else {
                setStats({
                    totalClasses: classes.length,
                    totalStudents: 0,
                    activeSessions: 0,
                    completedActivities: 0
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = user?.role === 'teacher' ? [
        {
            title: '🎥 Start Live Session',
            description: 'Video, Whiteboard, Chat & More',
            icon: '📡',
            action: () => navigate('/live-session'),
            color: 'primary'
        },
        {
            title: 'Create Class',
            description: 'Start a new class',
            icon: '➕',
            action: () => navigate('/classes'),
            color: 'success'
        },
        {
            title: 'View Classes',
            description: 'Manage your classes',
            icon: '🏫',
            action: () => navigate('/classes'),
            color: 'warning'
        }
    ] : [
        {
            title: '🎥 Join Live Session',
            description: 'Video, Whiteboard, Chat & More',
            icon: '📡',
            action: () => navigate('/live-session'),
            color: 'primary'
        },
        {
            title: 'Join Class',
            description: 'Enter class code',
            icon: '🚪',
            action: () => navigate('/classes'),
            color: 'success'
        },
        {
            title: 'My Classes',
            description: 'View enrolled classes',
            icon: '📚',
            action: () => navigate('/classes'),
            color: 'warning'
        }
    ];

    return (
        <>
            <Navbar />
            <div className="dashboard">
                <div className="dashboard-container">
                    {/* Welcome Section */}
                    <div className="welcome-section animate-slide-up">
                        <div className="welcome-content">
                            <h1 className="welcome-title">
                                Welcome back, <span className="gradient-text">{user?.full_name}</span>! 👋
                            </h1>
                            <p className="welcome-subtitle">
                                {user?.role === 'teacher'
                                    ? "Ready to inspire and educate your students today?"
                                    : "Ready to continue your learning journey?"}
                            </p>
                        </div>
                        <div className="welcome-actions" style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                            <Button
                                variant="primary"
                                size="large"
                                onClick={() => navigate('/live-session')}
                            >
                                🎥 {user?.role === 'teacher' ? 'Start Live Session' : 'Join Live Session'}
                            </Button>
                            <Button
                                variant="secondary"
                                size="large"
                                onClick={() => navigate('/classes')}
                            >
                                {user?.role === 'teacher' ? '🎓 My Classes' : '📚 Browse Classes'}
                            </Button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid animate-fade-in">
                        {user?.role === 'teacher' ? (
                            <>
                                <StatCard
                                    title="Total Classes"
                                    value={stats.totalClasses}
                                    icon="🏫"
                                    color="primary"
                                    loading={loading}
                                />
                                <StatCard
                                    title="Total Students"
                                    value={stats.totalStudents}
                                    icon="👥"
                                    color="success"
                                    loading={loading}
                                />
                                <StatCard
                                    title="Active Sessions"
                                    value={stats.activeSessions}
                                    icon="📡"
                                    color="warning"
                                    loading={loading}
                                />
                                <StatCard
                                    title="Resources Shared"
                                    value={stats.completedActivities}
                                    icon="📄"
                                    color="danger"
                                    loading={loading}
                                />
                            </>
                        ) : (
                            <>
                                <StatCard
                                    title="Enrolled Classes"
                                    value={stats.totalClasses}
                                    icon="📚"
                                    color="primary"
                                    loading={loading}
                                />
                                <StatCard
                                    title="Attended Sessions"
                                    value={stats.activeSessions}
                                    icon="✅"
                                    color="success"
                                    loading={loading}
                                />
                                <StatCard
                                    title="Quizzes Completed"
                                    value={stats.completedActivities}
                                    icon="🎯"
                                    color="warning"
                                    loading={loading}
                                />
                                <StatCard
                                    title="Resources Downloaded"
                                    value="0"
                                    icon="📥"
                                    color="danger"
                                    loading={loading}
                                />
                            </>
                        )}
                    </div>

                    {/* Main Content Grid */}
                    <div className="content-grid">
                        {/* Quick Actions */}
                        <Card className="quick-actions-card">
                            <div className="card-header">
                                <h3>⚡ Quick Actions</h3>
                                <p>Get started quickly</p>
                            </div>
                            <div className="quick-actions">
                                {quickActions.map((action, index) => (
                                    <div
                                        key={index}
                                        className={`quick-action-item quick-action-${action.color}`}
                                        onClick={action.action}
                                    >
                                        <div className="quick-action-icon">{action.icon}</div>
                                        <div className="quick-action-content">
                                            <h4>{action.title}</h4>
                                            <p>{action.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Recent Classes */}
                        <Card className="recent-classes-card">
                            <div className="card-header">
                                <h3>🏫 Recent Classes</h3>
                                <p>{user?.role === 'teacher' ? 'Classes you created' : 'Recently enrolled'}</p>
                            </div>
                            <div className="recent-classes">
                                {loading ? (
                                    <div className="loading-state">
                                        <div className="spinner"></div>
                                        <p>Loading classes...</p>
                                    </div>
                                ) : recentClasses.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📭</div>
                                        <h4>No classes yet</h4>
                                        <p>
                                            {user?.role === 'teacher'
                                                ? 'Create your first class to get started'
                                                : 'Join a class using the code from your teacher'}
                                        </p>
                                        <Button
                                            variant="primary"
                                            onClick={() => navigate('/classes')}
                                        >
                                            {user?.role === 'teacher' ? 'Create Class' : 'Join Class'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="class-list">
                                        {recentClasses.map((cls) => (
                                            <div
                                                key={cls.id}
                                                className="class-item glass-hover"
                                                onClick={() => navigate(`/classes`)}
                                            >
                                                <div className="class-icon">🎓</div>
                                                <div className="class-info">
                                                    <h4>{cls.class_name}</h4>
                                                    <div className="class-meta">
                                                        <span className="class-code">{cls.class_code}</span>
                                                        <span className="class-students">
                                                            👥 {cls.student_count || 0} students
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="class-arrow">→</div>
                                            </div>
                                        ))}
                                        {recentClasses.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => navigate('/classes')}
                                                className="view-all-btn"
                                            >
                                                View All Classes →
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Activity Feed */}
                    <Card className="activity-feed-card">
                        <div className="card-header">
                            <h3>📊 Recent Activity</h3>
                            <p>Your latest updates</p>
                        </div>
                        <div className="activity-feed">
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <h4>No recent activity</h4>
                                <p>Your activity will appear here once you start using the platform</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default NewDashboard;
