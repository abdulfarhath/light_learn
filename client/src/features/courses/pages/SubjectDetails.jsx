import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CourseCard from './CourseCard';
import Button from '../../../shared/components/Button';

// MOCK DATA for modules and topics
const MOCK_MODULES = [
    {
        id: 1,
        title: "Module 1: Introduction",
        topics: [
            { id: 101, title: "Course Overview", duration: "5m", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" }, // Placeholder video
            { id: 102, title: "What is this subject?", duration: "12m", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
            { id: 103, title: "Syllabus Breakdown", duration: "8m", type: "pdf" }
        ]
    },
    {
        id: 2,
        title: "Module 2: Core Concepts",
        topics: [
            { id: 201, title: "Fundamental Theorem", duration: "15m", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
            { id: 202, title: "Practical Examples", duration: "20m", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
            { id: 203, title: "Quiz: Basics", duration: "10m", type: "quiz" }
        ]
    },
    {
        id: 3,
        title: "Module 3: Advanced Topics",
        topics: [
            { id: 301, title: "Deep Dive Part 1", duration: "25m", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
            { id: 302, title: "Deep Dive Part 2", duration: "30m", type: "video", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
        ]
    }
];

const SubjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State
    const [activeModule, setActiveModule] = useState(1); // ID of expanded module
    const [activeTopic, setActiveTopic] = useState(MOCK_MODULES[0].topics[0]); // Currently playing topic
    const [completedTopics, setCompletedTopics] = useState(new Set()); // Set of completed topic IDs
    const [sidebarOpen, setSidebarOpen] = useState(true); // For mobile responsiveness

    // Toggle topic completion
    const toggleCompletion = (topicId, e) => {
        e.stopPropagation();
        const newCompleted = new Set(completedTopics);
        if (newCompleted.has(topicId)) {
            newCompleted.delete(topicId);
        } else {
            newCompleted.add(topicId);
        }
        setCompletedTopics(newCompleted);
    };

    // Handle topic selection
    const handleTopicClick = (topic) => {
        setActiveTopic(topic);
        // Auto-expand the module if needed (though usually it's already open if we clicked it)
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-bg-main overflow-hidden">
            {/* Header */}
            <div className="bg-bg-panel border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/courses')}
                        className="p-2 hover:bg-bg-hover rounded-full text-text-secondary transition-colors"
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-text-main">Subject Name {id}</h1>
                        <p className="text-sm text-text-secondary">Course Progress: {Math.round((completedTopics.size / 8) * 100)}%</p>
                    </div>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 text-text-main"
                >
                    {sidebarOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Side: Video Player & Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    <div className="max-w-5xl mx-auto space-y-6">

                        {/* Video Player Container */}
                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group">
                            {activeTopic.type === 'video' ? (
                                <iframe
                                    src={activeTopic.videoUrl}
                                    title={activeTopic.title}
                                    className="w-full h-full"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-bg-dark text-text-secondary flex-col gap-4">
                                    <div className="text-6xl">📄</div>
                                    <p className="text-xl">This is a {activeTopic.type} resource</p>
                                    <Button>View Resource</Button>
                                </div>
                            )}
                        </div>

                        {/* Topic Details */}
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-text-main mb-2">{activeTopic.title}</h2>
                                    <p className="text-text-secondary">
                                        Module: {MOCK_MODULES.find(m => m.topics.find(t => t.id === activeTopic.id))?.title}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline">Previous</Button>
                                    <Button>Next Lesson →</Button>
                                </div>
                            </div>

                            {/* Resources / Description Tabs */}
                            <div className="border-t border-border pt-6 mt-6">
                                <h3 className="text-lg font-semibold text-text-main mb-4">Resources & Materials</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CourseCard className="p-4 flex items-center gap-4 hover:bg-bg-hover cursor-pointer transition-colors">
                                        <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
                                            📄
                                        </div>
                                        <div>
                                            <p className="font-medium text-text-main">Lecture Slides</p>
                                            <p className="text-xs text-text-secondary">PDF • 2.4 MB</p>
                                        </div>
                                    </CourseCard>
                                    <CourseCard className="p-4 flex items-center gap-4 hover:bg-bg-hover cursor-pointer transition-colors">
                                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                                            📝
                                        </div>
                                        <div>
                                            <p className="font-medium text-text-main">Transcript</p>
                                            <p className="text-xs text-text-secondary">TXT • 15 KB</p>
                                        </div>
                                    </CourseCard>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Playlist Sidebar */}
                <div className={`${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full'} lg:translate-x-0 lg:w-96 bg-bg-panel border-l border-border transition-all duration-300 flex flex-col shrink-0 absolute lg:relative right-0 h-full z-20`}>
                    <div className="p-4 border-b border-border bg-bg-panel sticky top-0 z-10">
                        <h3 className="font-bold text-text-main">Course Content</h3>
                        <div className="mt-2 w-full bg-bg-dark h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-success h-full transition-all duration-500"
                                style={{ width: `${(completedTopics.size / 8) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 pb-20">
                        {MOCK_MODULES.map((module) => (
                            <div key={module.id} className="border-b border-border last:border-0">
                                <button
                                    onClick={() => setActiveModule(activeModule === module.id ? null : module.id)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-hover transition-colors text-left"
                                >
                                    <span className="font-semibold text-text-main text-sm">{module.title}</span>
                                    <span className={`text-text-secondary transition-transform duration-200 ${activeModule === module.id ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>

                                <div className={`overflow-hidden transition-all duration-300 ${activeModule === module.id ? 'max-h-[1000px]' : 'max-h-0'}`}>
                                    {module.topics.map((topic) => (
                                        <div
                                            key={topic.id}
                                            onClick={() => handleTopicClick(topic)}
                                            className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors border-l-4 ${activeTopic.id === topic.id
                                                    ? 'bg-primary/5 border-primary'
                                                    : 'hover:bg-bg-hover border-transparent'
                                                }`}
                                        >
                                            <div className="pt-1" onClick={(e) => toggleCompletion(topic.id, e)}>
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${completedTopics.has(topic.id)
                                                        ? 'bg-success border-success text-white'
                                                        : 'border-text-muted hover:border-primary'
                                                    }`}>
                                                    {completedTopics.has(topic.id) && '✓'}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium mb-1 ${activeTopic.id === topic.id ? 'text-primary' : 'text-text-main'}`}>
                                                    {topic.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                    <span>{topic.type === 'video' ? '🎥' : '📄'}</span>
                                                    <span>{topic.duration}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectDetails;
