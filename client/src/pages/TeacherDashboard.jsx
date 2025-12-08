import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import StatCard from '../shared/components/StatCard';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';
import { classAPI } from '../services/api';
import { todosAPI } from '../features/todos';

const TeacherDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalClasses: 0,
        totalStudents: 0,
        activeSessions: 0,
        resourcesShared: 0
    });
    const [recentClasses, setRecentClasses] = useState([]);
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const data = await todosAPI.getTodos();
            setTodos(data.todos || []);
        } catch (error) {
            console.error('Error loading todos:', error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await classAPI.getMyClasses('teacher');
            const classes = response.classes || [];

            setRecentClasses(classes.slice(0, 3));

            const totalStudents = classes.reduce((sum, cls) => sum + parseInt(cls.student_count || 0), 0);
            setStats({
                totalClasses: classes.length,
                totalStudents: totalStudents,
                activeSessions: 0, 
                resourcesShared: 0 
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addTodo = async (e) => {
        e.preventDefault();
        if (newTodo.trim()) {
            try {
                const data = await todosAPI.addTodo(newTodo.trim());
                setTodos([data.todo, ...todos]);
                setNewTodo('');
            } catch (error) {
                console.error('Error adding todo:', error);
            }
        }
    };

    const toggleTodo = async (id) => {
        try {
            const data = await todosAPI.toggleTodo(id);
            setTodos(todos.map(todo =>
                todo.id === id ? data.todo : todo
            ));
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const deleteTodo = async (id) => {
        try {
            await todosAPI.deleteTodo(id);
            setTodos(todos.filter(todo => todo.id !== id));
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const quickActions = [
        {
            title: 'Start Live Session',
            description: 'Video, Whiteboard, Chat & More',
            icon: '📡',
            action: () => navigate('/live-session'),
            color: 'primary',
            hoverBorder: 'hover:border-primary'
        },
        {
            title: 'Create Class',
            description: 'Start a new class',
            icon: '➕',
            action: () => navigate('/classes'),
            color: 'success',
            hoverBorder: 'hover:border-success'
        },
        {
            title: 'Manage Classes',
            description: 'View and edit your classes',
            icon: '🏫',
            action: () => navigate('/classes'),
            color: 'warning',
            hoverBorder: 'hover:border-warning'
        }
    ];

    return (
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 max-w-7xl mx-auto w-full no-scrollbar">
            <div className="flex flex-col gap-6">
                {/* Welcome Section - Compact */}
                <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-xl text-center text-white shadow-lg animate-slide-up relative overflow-hidden w-fit mx-auto">
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>
                    <div className="relative z-10">
                        <p className="text-sm font-semibold opacity-90">
                            Welcome back, <span className="font-bold">{user?.full_name}</span>! 👋
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
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
                        value={stats.resourcesShared}
                        icon="📄"
                        color="danger"
                        loading={loading}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <Card className="lg:col-span-1 h-full">
                        <div className="mb-4">
                            <h3 className="text-xl font-semibold text-text-main">⚡ Quick Actions</h3>
                            <p className="text-text-muted text-sm">Get started quickly</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            {quickActions.map((action, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all bg-bg-dark/50 hover:bg-bg-hover border border-transparent ${action.hoverBorder}`}
                                    onClick={action.action}
                                >
                                    <div className={`text-2xl p-2 rounded-lg bg-${action.color}/10 text-${action.color}`}>
                                        {action.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-text-main">{action.title}</h4>
                                        <p className="text-xs text-text-muted">{action.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Recent Classes */}
                    <Card className="lg:col-span-2 h-full">
                        <div className="mb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-semibold text-text-main">🏫 Recent Classes</h3>
                                <p className="text-text-muted text-sm">Classes you created</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                                    <p>Loading classes...</p>
                                </div>
                            ) : recentClasses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="text-4xl mb-2">📭</div>
                                    <h4 className="font-semibold mb-1 text-text-main">No classes yet</h4>
                                    <p className="text-text-muted text-sm mb-4">
                                        Create your first class to get started
                                    </p>
                                    <Button
                                        variant="primary"
                                        onClick={() => navigate('/classes')}
                                    >
                                        Create Class
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {recentClasses.map((cls) => (
                                        <div
                                            key={cls.id}
                                            className="flex items-center justify-between p-4 bg-bg-dark border border-border rounded-xl cursor-pointer hover:bg-bg-hover hover:border-primary/30 transition-all group"
                                            onClick={() => navigate(`/classes`)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl text-primary">🎓</div>
                                                <div>
                                                    <h4 className="font-semibold text-text-main group-hover:text-primary transition-colors">{cls.class_name}</h4>
                                                    <div className="flex gap-3 text-xs text-text-muted">
                                                        <span className="bg-bg-panel px-2 py-0.5 rounded border border-border font-mono">{cls.class_code}</span>
                                                        <span>👥 {cls.student_count || 0} students</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-text-muted group-hover:translate-x-1 transition-transform">→</div>
                                        </div>
                                    ))}
                                    {recentClasses.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => navigate('/classes')}
                                            className="w-full mt-2 text-primary hover:bg-primary/10"
                                        >
                                            View All Classes →
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Todo List Section */}
                <Card className="w-full">
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold text-text-main">✅ Teacher Tasks</h3>
                        <p className="text-text-muted text-sm">Track your lesson planning and grading</p>
                    </div>

                    {/* Add Todo Form */}
                    <form onSubmit={addTodo} className="mb-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTodo}
                                onChange={(e) => setNewTodo(e.target.value)}
                                placeholder="Add a new task..."
                                className="flex-1 px-4 py-2 bg-bg-dark border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                className="px-6"
                            >
                                Add Task
                            </Button>
                        </div>
                    </form>

                    {/* Todo List */}
                    <div className="flex flex-col gap-2">
                        {todos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="text-4xl mb-2">📝</div>
                                <h4 className="font-semibold mb-1 text-text-main">No tasks yet</h4>
                                <p className="text-text-muted text-sm">
                                    Add your first task to get started
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                                {todos.map((todo) => (
                                    <div
                                        key={todo.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${todo.completed
                                            ? 'bg-success/5 border-success/20'
                                            : 'bg-bg-dark border-border hover:border-primary/30'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={todo.completed}
                                            onChange={() => toggleTodo(todo.id)}
                                            className="w-5 h-5 rounded border-border cursor-pointer accent-primary"
                                        />
                                        <span
                                            className={`flex-1 ${todo.completed
                                                ? 'text-text-muted line-through'
                                                : 'text-text-main'
                                                }`}
                                        >
                                            {todo.text}
                                        </span>
                                        <button
                                            onClick={() => deleteTodo(todo.id)}
                                            className="px-3 py-1 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {todos.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-sm text-text-muted">
                                <span>
                                    {todos.filter(t => !t.completed).length} pending, {todos.filter(t => t.completed).length} completed
                                </span>
                                {todos.some(t => t.completed) && (
                                    <button
                                        onClick={() => setTodos(todos.filter(t => !t.completed))}
                                        className="text-danger hover:text-danger/80 transition-colors"
                                    >
                                        Clear completed
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TeacherDashboard;
