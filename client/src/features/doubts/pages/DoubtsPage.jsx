import React, { useState, useEffect } from 'react';
import useAuthStore from '../../../stores/authStore';
import DoubtList from '../components/DoubtList';
import DoubtForm from '../components/DoubtForm';
import { fetchDoubts, createDoubt, postAnswer, updateDoubtStatus } from '../services/doubtAPI';
import { classAPI } from '../../classes/services/classAPI';

const DoubtsPage = () => {
    const { user } = useAuthStore();
    const [showForm, setShowForm] = useState(false);
    const [doubts, setDoubts] = useState([]);
    const [myClasses, setMyClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch doubts and classes from backend on load
    useEffect(() => {
        if (!user) return;
        const loadData = async () => {
            try {
                console.log('📥 DoubtsPage: Loading doubts for user:', user.role);
                const [doubtsData, classesData] = await Promise.all([
                    fetchDoubts(),
                    classAPI.getMyClasses(user.role)
                ]);
                console.log('📦 DoubtsPage: Received', doubtsData.length, 'doubts');
                setDoubts(doubtsData);
                setMyClasses(classesData);
            } catch (error) {
                console.error("❌ Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user.role]);

    const loadDoubts = async () => {
        try {
            const data = await fetchDoubts();
            setDoubts(data);
        } catch (error) {
            console.error("Failed to load doubts", error);
        }
    };

    // 2. Handle adding a new doubt
    const handleAddDoubt = async (newDoubtData) => {
        try {
            await createDoubt(newDoubtData);
            setShowForm(false);
            loadDoubts(); // Refresh list
        } catch (error) {
            console.error("Failed to post doubt", error);
        }
    };

    // 3. Handle adding an answer (Teachers only)
    const handleAddAnswer = async (doubtId, answerData) => {
        try {
            await postAnswer(doubtId, answerData.content);
            loadDoubts(); // Refresh to show new answer
        } catch (error) {
            console.error("Failed to post answer", error);
        }
    };

    // 4. Handle status toggle (Student only)
    const handleToggleStatus = async (doubtId) => {
        // Find current status to toggle it
        const doubt = doubts.find(d => d.id === doubtId);
        const newStatus = doubt.status === 'resolved' ? 'unresolved' : 'resolved';
        
        try {
            await updateDoubtStatus(doubtId, newStatus);
            loadDoubts(); // Refresh list
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    if (loading) return <div className="p-6">Loading doubts...</div>;

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
                    <DoubtForm 
                        onSubmit={handleAddDoubt} 
                        onCancel={() => setShowForm(false)} 
                        availableClasses={myClasses}
                    />
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