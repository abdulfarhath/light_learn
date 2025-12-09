import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import StatCard from '../shared/components/StatCard';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';
import { classAPI, lessonsAPI } from '../services/api';
import { todosAPI } from '../features/todos';

const StudentDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        enrolledClasses: 0,
        attendedSessions: 0,
        completedActivities: 0
    });

    const [recentClasses, setRecentClasses] = useState([]);
    const [recentLessons, setRecentLessons] = useState([]);
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');

    // Load Todos
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

    // Load Dashboard Data
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const response = await classAPI.getMyClasses('student');
            const classes = response.classes || [];

            setRecentClasses(classes.slice(0, 3));

            // Fetch lessons for student
            try {
                const lessons = await lessonsAPI.getStudentLessons();
                setRecentLessons(lessons.slice(0, 3));
            } catch (err) {
                console.error('Error fetching lessons:', err);
            }

            setStats({
                enrolledClasses: classes.length,
                attendedSessions: 0,       // future update
                completedActivities: 0     // future update
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Todo actions
    const addTodo = async (e) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        try {
            const data = await todosAPI.addTodo(newTodo.trim());
            setTodos([data.todo, ...todos]);
            setNewTodo('');
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    };

    const toggleTodo = async (id) => {
        try {
            const data = await todosAPI.toggleTodo(id);
            setTodos(todos.map(todo => (todo.id === id ? data.todo : todo)));
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

    return (
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 max-w-7xl mx-auto w-full no-scrollbar">
            <div className="flex flex-col gap-6">

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                    <StatCard
                        title="Enrolled Classes"
                        value={stats.enrolledClasses}
                        icon="📚"
                        color="primary"
                        loading={loading}
                    />
                    <StatCard
                        title="Attended Sessions"
                        value={stats.attendedSessions}
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
                </div>

                {/* TODO LIST / Assignments */}
                <Card className="w-full">
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold text-text-main">✅ My Assignments</h3>
                        <p className="text-text-muted text-sm">Keep track of your tasks and assignments</p>
                    </div>

                    {/* Add Todo Form */}
                    <form onSubmit={addTodo} className="mb-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTodo}
                                onChange={(e) => setNewTodo(e.target.value)}
                                placeholder="Add a new assignment..."
                                className="flex-1 px-4 py-2 bg-bg-dark border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                            />
                            <Button type="submit" variant="primary" className="px-6">Add</Button>
                        </div>
                    </form>

                    {/* Todo List */}
                    <div className="flex flex-col gap-2">
                        {!todos || todos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="text-4xl mb-2">📝</div>
                                <h4 className="font-semibold mb-1 text-text-main">No assignments yet</h4>
                                <p className="text-text-muted text-sm">Add your first assignment to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                                {todos.map(todo => (
                                    <div
                                        key={todo.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                            todo.completed
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
                                            className={`flex-1 ${
                                                todo.completed
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
                                    {todos.filter(t => !t.completed).length} pending,{' '}
                                    {todos.filter(t => t.completed).length} completed
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

            {/* Recent Lessons Section */}
            <Card title="Recent Lessons" className="w-full mt-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="p-3 font-semibold text-text-muted">Title</th>
                                <th className="p-3 font-semibold text-text-muted">Date</th>
                                <th className="p-3 font-semibold text-text-muted">Duration</th>
                                <th className="p-3 font-semibold text-text-muted">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!recentLessons || recentLessons.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-4 text-center text-text-muted">
                                        No lessons available yet.
                                    </td>
                                </tr>
                            ) : (
                                recentLessons.map(rec => (
                                    <tr key={rec.id} className="border-b border-border hover:bg-bg-dark transition-colors">
                                        <td className="p-3 font-medium text-text-main">{rec.title}</td>
                                        <td className="p-3 text-text-muted">
                                            {new Date(rec.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 text-text-muted">
                                            {rec.duration
                                                ? new Date(rec.duration * 1000).toISOString().substr(11, 8)
                                                : '00:00:00'}
                                        </td>
                                        <td className="p-3">
                                            <Button
                                                variant="secondary"
                                                size="small"
                                                onClick={() => navigate(`/lessons/${rec.id}`)}
                                            >
                                                Watch
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default StudentDashboard;
