import React, { useState } from 'react';

/**
 * SessionSummary Component
 * Displays transcription and summary after a live session ends
 * Provides download functionality for the transcription
 */
function SessionSummary({ sessionData, onClose, apiBaseUrl }) {
    const [activeTab, setActiveTab] = useState('summary');
    const [copySuccess, setCopySuccess] = useState('');

    if (!sessionData) return null;

    const { sessionId, transcription, summary, mock } = sessionData;

    const handleDownload = (content, filename) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCopy = async (content) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        } catch (err) {
            setCopySuccess('Failed to copy');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-panel rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-xl font-bold text-text-main">📝 Session Summary</h2>
                        <p className="text-sm text-text-muted mt-1">
                            Session ID: {sessionId}
                            {mock && <span className="ml-2 text-yellow-500">(Demo Mode)</span>}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-text-muted hover:text-text-main text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                            activeTab === 'summary' 
                                ? 'bg-primary text-white' 
                                : 'text-text-secondary hover:bg-bg-hover'
                        }`}
                    >
                        📋 Summary
                    </button>
                    <button
                        onClick={() => setActiveTab('transcription')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                            activeTab === 'transcription' 
                                ? 'bg-primary text-white' 
                                : 'text-text-secondary hover:bg-bg-hover'
                        }`}
                    >
                        📄 Full Transcription
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'summary' ? (
                        <div className="prose prose-invert max-w-none">
                            <div className="bg-bg-dark rounded-lg p-4 whitespace-pre-wrap text-text-main leading-relaxed">
                                {summary}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-bg-dark rounded-lg p-4">
                            <pre className="whitespace-pre-wrap text-text-main text-sm leading-relaxed font-mono">
                                {transcription}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 p-4 border-t border-border bg-bg-dark/50">
                    <button
                        onClick={() => handleCopy(activeTab === 'summary' ? summary : transcription)}
                        className="flex items-center gap-2 px-4 py-2 bg-bg-dark border border-border rounded-lg hover:bg-bg-hover transition-colors text-sm"
                    >
                        📋 {copySuccess || 'Copy to Clipboard'}
                    </button>
                    
                    <button
                        onClick={() => handleDownload(transcription, `${sessionId}_transcription.txt`)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm"
                    >
                        ⬇️ Download Transcription
                    </button>
                    
                    <button
                        onClick={() => handleDownload(summary, `${sessionId}_summary.txt`)}
                        className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                    >
                        ⬇️ Download Summary
                    </button>

                    <button
                        onClick={() => handleDownload(
                            `SESSION SUMMARY\n${'='.repeat(50)}\n\n${summary}\n\n\nFULL TRANSCRIPTION\n${'='.repeat(50)}\n\n${transcription}`,
                            `${sessionId}_full_report.txt`
                        )}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                    >
                        📑 Download Full Report
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SessionSummary;

