import React, { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import coursesAPI from '../features/courses/services/coursesAPI';
import classAPI from '../features/classes/services/classAPI';

const CreateQuiz = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' or 'poll'
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Quiz form state
    const [quizForm, setQuizForm] = useState({
        class_id: '',
        subject_id: '',
        title: '',
        deadline: '',
        questions: [
            {
                question: '',
                options: ['', '', '', ''],
                correct_answer: 0
            }
        ]
    });

    // Poll form state
    const [pollForm, setPollForm] = useState({
        class_id: '',
        subject_id: '',
        title: '',
        question: '',
        options: ['', ''],
        deadline: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [subjectsData, classesData] = await Promise.all([
                coursesAPI.getSubjects(),
                classAPI.getMyClasses()
            ]);
            setSubjects(subjectsData.subjects || []);
            setClasses(classesData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const addQuizQuestion = () => {
        setQuizForm({
            ...quizForm,
            questions: [
                ...quizForm.questions,
                { question: '', options: ['', '', '', ''], correct_answer: 0 }
            ]
        });
    };

    const removeQuizQuestion = (index) => {
        const newQuestions = quizForm.questions.filter((_, i) => i !== index);
        setQuizForm({ ...quizForm, questions: newQuestions });
    };

    const updateQuizQuestion = (index, field, value) => {
        const newQuestions = [...quizForm.questions];
        newQuestions[index][field] = value;
        setQuizForm({ ...quizForm, questions: newQuestions });
    };

    const updateQuizOption = (qIndex, oIndex, value) => {
        const newQuestions = [...quizForm.questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuizForm({ ...quizForm, questions: newQuestions });
    };

    const addPollOption = () => {
        setPollForm({
            ...pollForm,
            options: [...pollForm.options, '']
        });
    };

    const removePollOption = (index) => {
        const newOptions = pollForm.options.filter((_, i) => i !== index);
        setPollForm({ ...pollForm, options: newOptions });
    };

    const updatePollOption = (index, value) => {
        const newOptions = [...pollForm.options];
        newOptions[index] = value;
        setPollForm({ ...pollForm, options: newOptions });
    };

    const handleQuizSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:3001/api/quizzes/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(quizForm)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create quiz');
            }

            setMessage('Quiz created successfully!');
            // Reset form
            setQuizForm({
                class_id: '',
                subject_id: '',
                title: '',
                deadline: '',
                questions: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }]
            });
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handlePollSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:3001/api/polls/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(pollForm)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create poll');
            }

            setMessage('Poll created successfully!');
            // Reset form
            setPollForm({
                class_id: '',
                subject_id: '',
                title: '',
                question: '',
                options: ['', ''],
                deadline: ''
            });
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }
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
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Create Quiz & Polls</h1>
                    <p className="text-text-muted">Create quizzes and polls for your classes</p>
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

                {/* Tabs */}
                <div className="flex gap-2 border-b border-border">
                    <button
                        onClick={() => setActiveTab('quiz')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'quiz'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-text-muted hover:text-text-main'
                        }`}
                    >
                        📝 Create Quiz
                    </button>
                    <button
                        onClick={() => setActiveTab('poll')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'poll'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-text-muted hover:text-text-main'
                        }`}
                    >
                        📊 Create Poll
                    </button>
                </div>

                {/* Quiz Form */}
                {activeTab === 'quiz' && (
                    <form onSubmit={handleQuizSubmit} className="space-y-6">
                        <div className="bg-bg-panel border border-border rounded-xl p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-text-main">Quiz Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">
                                        Class *
                                    </label>
                                    <select
                                        required
                                        value={quizForm.class_id}
                                        onChange={(e) => setQuizForm({...quizForm, class_id: e.target.value})}
                                        className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">
                                        Subject
                                    </label>
                                    <select
                                        value={quizForm.subject_id}
                                        onChange={(e) => setQuizForm({...quizForm, subject_id: e.target.value})}
                                        className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Select Subject (Optional)</option>
                                        {subjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.subject_name} ({subject.subject_code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1">
                                    Quiz Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={quizForm.title}
                                    onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                                    className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="e.g., Chapter 1 Quiz"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1">
                                    Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    value={quizForm.deadline}
                                    onChange={(e) => setQuizForm({...quizForm, deadline: e.target.value})}
                                    className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="bg-bg-panel border border-border rounded-xl p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-text-main">Questions</h2>
                                <button
                                    type="button"
                                    onClick={addQuizQuestion}
                                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors"
                                >
                                    + Add Question
                                </button>
                            </div>

                            {quizForm.questions.map((q, qIndex) => (
                                <div key={qIndex} className="bg-bg-dark border border-border rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <label className="block text-sm font-medium text-text-main">
                                            Question {qIndex + 1} *
                                        </label>
                                        {quizForm.questions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeQuizQuestion(qIndex)}
                                                className="text-danger hover:text-danger/80"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={q.question}
                                        onChange={(e) => updateQuizQuestion(qIndex, 'question', e.target.value)}
                                        className="w-full px-3 py-2 bg-bg-panel border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Enter question"
                                    />

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-text-main">Options *</label>
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="flex gap-2 items-center">
                                                <input
                                                    type="radio"
                                                    name={`correct-${qIndex}`}
                                                    checked={q.correct_answer === oIndex}
                                                    onChange={() => updateQuizQuestion(qIndex, 'correct_answer', oIndex)}
                                                    className="text-primary"
                                                />
                                                <input
                                                    type="text"
                                                    required
                                                    value={opt}
                                                    onChange={(e) => updateQuizOption(qIndex, oIndex, e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-bg-panel border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                                    placeholder={`Option ${oIndex + 1}`}
                                                />
                                            </div>
                                        ))}
                                        <p className="text-xs text-text-muted">Select the radio button for the correct answer</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-md"
                        >
                            Create Quiz
                        </button>
                    </form>
                )}

                {/* Poll Form */}
                {activeTab === 'poll' && (
                    <form onSubmit={handlePollSubmit} className="space-y-6">
                        <div className="bg-bg-panel border border-border rounded-xl p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-text-main">Poll Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">
                                        Class *
                                    </label>
                                    <select
                                        required
                                        value={pollForm.class_id}
                                        onChange={(e) => setPollForm({...pollForm, class_id: e.target.value})}
                                        className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">
                                        Subject
                                    </label>
                                    <select
                                        value={pollForm.subject_id}
                                        onChange={(e) => setPollForm({...pollForm, subject_id: e.target.value})}
                                        className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Select Subject (Optional)</option>
                                        {subjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.subject_name} ({subject.subject_code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1">
                                    Poll Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={pollForm.title}
                                    onChange={(e) => setPollForm({...pollForm, title: e.target.value})}
                                    className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="e.g., Preferred Study Time"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1">
                                    Question *
                                </label>
                                <textarea
                                    required
                                    value={pollForm.question}
                                    onChange={(e) => setPollForm({...pollForm, question: e.target.value})}
                                    className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="What would you like to ask?"
                                    rows="3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1">
                                    Deadline
                                </label>
                                <input
                                    type="datetime-local"
                                    value={pollForm.deadline}
                                    onChange={(e) => setPollForm({...pollForm, deadline: e.target.value})}
                                    className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-medium text-text-main">Options *</label>
                                    <button
                                        type="button"
                                        onClick={addPollOption}
                                        className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded text-sm font-medium transition-colors"
                                    >
                                        + Add Option
                                    </button>
                                </div>
                                {pollForm.options.map((opt, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            required
                                            value={opt}
                                            onChange={(e) => updatePollOption(index, e.target.value)}
                                            className="flex-1 px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder={`Option ${index + 1}`}
                                        />
                                        {pollForm.options.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removePollOption(index)}
                                                className="px-3 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-md"
                        >
                            Create Poll
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateQuiz;
