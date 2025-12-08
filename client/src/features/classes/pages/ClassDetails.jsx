import React, { useState, useEffect } from 'react';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import DoubtList from '../../doubts/components/DoubtList';
import DoubtForm from '../../doubts/components/DoubtForm';
import useAuthStore from '../../../stores/authStore';
import { fetchDoubts, createDoubt, postAnswer, updateDoubtStatus } from '../../doubts/services/doubtAPI';

const ClassDetails = ({ classData, onBack, role }) => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('recordings');
    const [showDoubtForm, setShowDoubtForm] = useState(false);
    const [classDoubts, setClassDoubts] = useState([]);
    const [loadingDoubts, setLoadingDoubts] = useState(false);

    useEffect(() => {
        if (activeTab === 'doubts') {
            loadClassDoubts();
        }
    }, [activeTab, classData.id]);

    const loadClassDoubts = async () => {
        setLoadingDoubts(true);
        try {
            const allDoubts = await fetchDoubts();
            // Filter doubts for this class
            const filtered = allDoubts.filter(d => d.class_id === classData.id);
            setClassDoubts(filtered);
        } catch (error) {
            console.error("Failed to load doubts", error);
        } finally {
            setLoadingDoubts(false);
        }
    };

    const handleAddDoubt = async (newDoubt) => {
        try {
            await createDoubt({
                ...newDoubt,
                classId: classData.id
            });
            setShowDoubtForm(false);
            loadClassDoubts();
        } catch (error) {
            console.error("Failed to create doubt", error);
        }
    };

    const handleAddAnswer = async (doubtId, answer) => {
        try {
            await postAnswer(doubtId, answer.content);
            loadClassDoubts();
        } catch (error) {
            console.error("Failed to add answer", error);
        }
    };

    const handleToggleStatus = async (doubtId) => {
        const doubt = classDoubts.find(d => d.id === doubtId);
        const newStatus = doubt.status === 'resolved' ? 'unresolved' : 'resolved';
        try {
            await updateDoubtStatus(doubtId, newStatus);
            loadClassDoubts();
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    };

    // Dummy data for recordings (since we don't have a backend for this yet)
    const recordings = [
        { id: 1, title: 'Introduction to React', date: '2023-10-01', duration: '45:00', size: '150 MB' },
        { id: 2, title: 'State and Props', date: '2023-10-03', duration: '50:00', size: '180 MB' },
        { id: 3, title: 'Hooks Deep Dive', date: '2023-10-05', duration: '60:00', size: '210 MB' },
    ];

    // Dummy data for resources
    const resources = [
        { id: 1, title: 'Syllabus.pdf', type: 'PDF', size: '2.5 MB' },
        { id: 2, title: 'Project_Guidelines.docx', type: 'DOCX', size: '1.2 MB' },
    ];

    return (
        <div className="flex-1 p-6 overflow-y-auto w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-bg-panel text-text-secondary hover:text-text-main transition-colors"
                >
                    ← Back
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-text-main">{classData.class_name}</h1>
                    <p className="text-text-muted font-mono text-sm">{classData.class_code}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border mb-6">
                <button
                    onClick={() => setActiveTab('recordings')}
                    className={`pb-3 px-2 font-medium transition-colors relative ${
                        activeTab === 'recordings' 
                            ? 'text-primary' 
                            : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    Recorded Sessions
                    {activeTab === 'recordings' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('resources')}
                    className={`pb-3 px-2 font-medium transition-colors relative ${
                        activeTab === 'resources' 
                            ? 'text-primary' 
                            : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    Course Materials
                    {activeTab === 'resources' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('doubts')}
                    className={`pb-3 px-2 font-medium transition-colors relative ${
                        activeTab === 'doubts' 
                            ? 'text-primary' 
                            : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    Doubts & Queries
                    {activeTab === 'doubts' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="grid gap-4">
                {activeTab === 'doubts' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-text-main">Class Doubts</h2>
                            {role === 'student' && (
                                <button 
                                    onClick={() => setShowDoubtForm(!showDoubtForm)}
                                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    {showDoubtForm ? 'Cancel' : 'Ask a Doubt'}
                                </button>
                            )}
                        </div>

                        {showDoubtForm && (
                            <div className="mb-8 bg-bg-panel border border-border rounded-xl p-6 shadow-lg">
                                <h3 className="text-lg font-semibold text-text-main mb-4">Post a Doubt for {classData.class_name}</h3>
                                <DoubtForm 
                                    onSubmit={handleAddDoubt} 
                                    onCancel={() => setShowDoubtForm(false)}
                                    courseId={classData.class_name}
                                />
                            </div>
                        )}

                        <DoubtList 
                            doubts={classDoubts} 
                            currentUser={user} 
                            onAddAnswer={handleAddAnswer} 
                            onToggleStatus={handleToggleStatus}
                        />
                    </div>
                )}

                {activeTab === 'recordings' && (
                    <>
                        {recordings.map((rec) => (
                            <Card key={rec.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center text-2xl text-red-500">
                                        ▶
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-main">{rec.title}</h3>
                                        <p className="text-sm text-text-muted">
                                            Recorded on {new Date(rec.date).toLocaleDateString()} • {rec.duration}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <Button 
                                        className="flex-1 md:flex-none bg-bg-dark border border-border hover:bg-bg-hover text-text-main"
                                        onClick={() => alert(`Playing ${rec.title}`)}
                                    >
                                        Watch Now
                                    </Button>
                                    <Button 
                                        className="flex-1 md:flex-none"
                                        onClick={() => alert(`Downloading ${rec.title} (${rec.size})... This feature allows overnight downloads.`)}
                                    >
                                        Download ⬇
                                    </Button>
                                </div>
                            </Card>
                        ))}
                        {recordings.length === 0 && (
                            <div className="text-center py-12 text-text-muted">
                                No recordings available yet.
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'resources' && (
                    <>
                        {resources.map((res) => (
                            <Card key={res.id} className="p-4 flex items-center justify-between gap-4 hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-2xl text-blue-500">
                                        📄
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-main">{res.title}</h3>
                                        <p className="text-sm text-text-muted">
                                            {res.type} • {res.size}
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    className="bg-bg-dark border border-border hover:bg-bg-hover text-text-main"
                                    onClick={() => alert(`Downloading ${res.title}...`)}
                                >
                                    Download
                                </Button>
                            </Card>
                        ))}
                         {resources.length === 0 && (
                            <div className="text-center py-12 text-text-muted">
                                No resources uploaded yet.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ClassDetails;
