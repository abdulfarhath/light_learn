import React, { useState } from 'react';
import Card from '../../../shared/components/Card';

const DoubtList = ({ doubts, currentUser, onAddAnswer, onToggleStatus }) => {
    const [expandedDoubt, setExpandedDoubt] = useState(null);
    const [answerText, setAnswerText] = useState('');
    const [answerType, setAnswerType] = useState('text'); // text, audio, image

    const handleSubmitAnswer = (e, doubtId) => {
        e.preventDefault();
        if (!answerText.trim()) return;

        onAddAnswer(doubtId, {
            content: answerText,
            type: answerType
        });
        setAnswerText('');
    };

    const toggleExpand = (id) => {
        if (expandedDoubt === id) {
            setExpandedDoubt(null);
        } else {
            setExpandedDoubt(id);
        }
    };

    if (doubts.length === 0) {
        return (
            <div className="text-center py-12 bg-bg-panel border border-border rounded-xl border-dashed">
                <p className="text-text-muted">No doubts posted yet. Be the first to ask!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {doubts.map((doubt) => (
                <Card key={doubt.id} className={`p-6 transition-all hover:border-primary/30 ${doubt.status === 'resolved' ? 'border-success/30 bg-success/5' : ''}`}>
                    <div 
                        className="cursor-pointer"
                        onClick={() => toggleExpand(doubt.id)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                    {doubt.course}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${doubt.status === 'resolved' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                                    {doubt.status === 'resolved' ? '✅ Resolved' : '⏳ Unresolved'}
                                </span>
                                <span className="text-xs text-text-muted">
                                    {new Date(doubt.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            <span className="text-sm text-text-secondary">
                                by {doubt.studentName}
                            </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-text-main mb-2">{doubt.title}</h3>
                        <p className="text-text-secondary line-clamp-2">{doubt.description}</p>
                        
                        <div className="mt-4 flex items-center gap-2 text-sm text-primary font-medium">
                            <span>💬 {doubt.answers.length} Answers</span>
                            <span>{expandedDoubt === doubt.id ? '▲' : '▼'}</span>
                        </div>
                    </div>

                    {expandedDoubt === doubt.id && (
                        <div className="mt-6 pt-6 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="mb-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Full Question</h4>
                                    {/* Only the student who created the doubt can toggle status */}
                                    {currentUser.full_name === doubt.studentName && (
                                        <button 
                                            onClick={() => onToggleStatus(doubt.id)}
                                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                                                doubt.status === 'resolved' 
                                                    ? 'border-warning text-warning hover:bg-warning/10' 
                                                    : 'border-success text-success hover:bg-success/10'
                                            }`}
                                        >
                                            Mark as {doubt.status === 'resolved' ? 'Unresolved' : 'Resolved'}
                                        </button>
                                    )}
                                </div>
                                <p className="text-text-main whitespace-pre-wrap">{doubt.description}</p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Answers</h4>
                                {doubt.answers.length === 0 ? (
                                    <p className="text-text-muted italic text-sm">No answers yet.</p>
                                ) : (
                                    doubt.answers.map((answer) => (
                                        <div key={answer.id} className={`p-4 rounded-lg border ${answer.role === 'teacher' ? 'bg-primary/5 border-primary/20' : 'bg-bg-dark border-border'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`font-medium text-sm ${answer.role === 'teacher' ? 'text-primary' : 'text-text-main'}`}>
                                                    {answer.authorName} {answer.role === 'teacher' && '(Teacher)'}
                                                </span>
                                                <span className="text-xs text-text-muted">
                                                    {new Date(answer.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-text-main whitespace-pre-wrap">{answer.content}</p>
                                            {/* Placeholder for media types */}
                                            {answer.type !== 'text' && (
                                                <div className="mt-2 text-xs text-text-muted border border-dashed border-border p-2 rounded">
                                                    [{answer.type} attachment placeholder]
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Answer Form */}
                            <form onSubmit={(e) => handleSubmitAnswer(e, doubt.id)} className="bg-bg-dark p-4 rounded-lg border border-border">
                                <h4 className="text-sm font-medium text-text-main mb-2">Add an Answer</h4>
                                <textarea
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="w-full bg-bg-panel border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary resize-none mb-3"
                                    rows="3"
                                ></textarea>
                                
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        {/* Media Buttons (Placeholders for now) */}
                                        <button type="button" className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Upload Image">📷</button>
                                        <button type="button" className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Record Audio">🎤</button>
                                        <button type="button" className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Record Video">🎥</button>
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={!answerText.trim()}
                                        className="bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Submit Answer
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
};

export default DoubtList;
