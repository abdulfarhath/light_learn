import React, { useState } from 'react';
import useAuthStore from '../../../stores/authStore';
import DoubtList from '../components/DoubtList';
import DoubtForm from '../components/DoubtForm';

const DoubtsPage = () => {
    const { user } = useAuthStore();
    const [showForm, setShowForm] = useState(false);

    // Mock data for doubts - in a real app this would come from an API
    const [doubts, setDoubts] = useState([
        {
            id: 1,
            studentName: 'Alice Johnson',
            title: 'Confusion about React Hooks',
            description: 'I am not sure when to use useEffect vs useLayoutEffect. Can someone explain?',
            course: 'Advanced Web Development',
            timestamp: '2023-10-25T10:30:00',
            status: 'unresolved',
            answers: [
                {
                    id: 101,
                    authorName: 'Mr. Smith',
                    role: 'teacher',
                    content: 'useEffect runs asynchronously after render, while useLayoutEffect runs synchronously after DOM mutations but before paint.',
                    type: 'text', // text, audio, video, image
                    timestamp: '2023-10-25T11:00:00'
                }
            ]
        },
        {
            id: 2,
            studentName: 'Bob Williams',
            title: 'Database Normalization',
            description: 'How do I decide between 3NF and BCNF?',
            course: 'Database Systems',
            timestamp: '2023-10-26T09:15:00',
            status: 'resolved',
            answers: []
        }
    ]);

    const handleAddDoubt = (newDoubt) => {
        const doubt = {
            id: doubts.length + 1,
            studentName: user.full_name,
            timestamp: new Date().toISOString(),
            status: 'unresolved',
            answers: [],
            ...newDoubt
        };
        setDoubts([doubt, ...doubts]);
        setShowForm(false);
    };

    const handleAddAnswer = (doubtId, answer) => {
        const updatedDoubts = doubts.map(d => {
            if (d.id === doubtId) {
                return {
                    ...d,
                    answers: [...d.answers, {
                        id: Date.now(),
                        authorName: user.full_name,
                        role: user.role,
                        timestamp: new Date().toISOString(),
                        ...answer
                    }]
                };
            }
            return d;
        });
        setDoubts(updatedDoubts);
    };

    const handleToggleStatus = (doubtId) => {
        setDoubts(doubts.map(d => {
            if (d.id === doubtId) {
                return {
                    ...d,
                    status: d.status === 'resolved' ? 'unresolved' : 'resolved'
                };
            }
            return d;
        }));
    };

    return (
        <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Doubts & Queries</h1>
                    <p className="text-text-muted">Ask questions and help others</p>
                </div>
                {user.role === 'student' && (
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        {showForm ? 'Cancel' : 'Ask a Doubt'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="mb-8 bg-bg-panel border border-border rounded-xl p-6 shadow-lg">
                    <h2 className="text-xl font-semibold text-text-main mb-4">Post a New Doubt</h2>
                    <DoubtForm onSubmit={handleAddDoubt} onCancel={() => setShowForm(false)} />
                </div>
            )}

            <DoubtList 
                doubts={doubts} 
                currentUser={user} 
                onAddAnswer={handleAddAnswer} 
                onToggleStatus={handleToggleStatus}
            />
        </div>
    );
};

export default DoubtsPage;
