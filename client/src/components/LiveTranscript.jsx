import React, { useState, useEffect, useRef } from 'react';
import transcriptService from '../services/transcriptService';
import summarizationService from '../services/summarizationService';

// Demo text - will be spoken aloud and displayed word by word
const DEMO_TEXT = "Hello students, today we will learn about real-time speech transcription. This technology converts spoken words into text instantly. It's powered by advanced AI that processes audio in real-time, similar to how ChatGPT and Perplexity voice modes work.";

/**
 * LiveTranscript Component
 * Real-time transcription for students in live sessions
 */
const LiveTranscript = ({ isTeacher }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimText, setInterimText] = useState('');
    const [summary, setSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [error, setError] = useState('');
    const transcriptEndRef = useRef(null);

    // Don't render for teachers
    if (isTeacher) return null;

    // Auto-scroll transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript, interimText]);

    // Setup transcript callbacks
    useEffect(() => {
        if (isListening) {
            transcriptService.setOnTranscriptUpdate(({ final, interim }) => {
                setTranscript(final);
                setInterimText(interim);
            });
            transcriptService.setOnStatusChange((status, msg) => {
                if (status === 'error') {
                    setError(msg || 'Recognition error');
                    setIsListening(false);
                }
            });
        }
        return () => {
            if (isListening) transcriptService.stop();
        };
    }, [isListening]);

    // Cleanup speech synthesis
    useEffect(() => {
        return () => {
            window.speechSynthesis?.cancel();
        };
    }, []);

    const startDemo = () => {
        if (!window.speechSynthesis) {
            setError('Speech synthesis not supported');
            return;
        }

        setError('');
        setTranscript('');
        setInterimText('');
        setSummary('');
        setIsDemo(true);

        const utterance = new SpeechSynthesisUtterance(DEMO_TEXT);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Get English voice
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
        if (voice) utterance.voice = voice;

        // Update transcript as words are spoken
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const spokenText = DEMO_TEXT.substring(0, event.charIndex + event.charLength);
                const words = spokenText.split(' ').filter(w => w);
                setTranscript(words.slice(0, -1).join(' '));
                setInterimText(words[words.length - 1] || '');
            }
        };

        utterance.onend = () => {
            setTranscript(DEMO_TEXT);
            setInterimText('');
            setIsDemo(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    const toggleListening = () => {
        if (isDemo) {
            window.speechSynthesis?.cancel();
            setIsDemo(false);
            return;
        }
        if (isListening) {
            transcriptService.stop();
            setIsListening(false);
        } else {
            if (!transcriptService.isSupported()) {
                setError('Speech recognition not supported. Use Chrome or Edge.');
                return;
            }
            setError('');
            setTranscript('');
            setInterimText('');
            setSummary('');
            transcriptService.start();
            setIsListening(true);
        }
    };

    const generateSummary = async () => {
        if (!transcript.trim()) return;
        setIsGeneratingSummary(true);
        try {
            const result = await summarizationService.analyzeTranscript(transcript);
            setSummary(result.summary);
        } catch {
            setError('Failed to generate summary');
        }
        setIsGeneratingSummary(false);
    };

    const downloadTranscript = () => {
        let content = `📝 LIVE SESSION TRANSCRIPT\n`;
        content += `Generated: ${new Date().toLocaleString()}\n${'═'.repeat(50)}\n\n`;
        if (summary) content += `📌 SUMMARY\n${summary}\n\n${'═'.repeat(50)}\n\n`;
        content += `📄 FULL TRANSCRIPT\n${transcript}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `live_transcript_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Floating button when closed
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-40 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all"
                title="Live Transcript"
            >
                📝
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-40 w-80 max-h-[60vh] bg-bg-panel border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-bg-dark">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">📝 Live Transcript</span>
                    {(isListening || isDemo) && (
                        <div className="flex items-center gap-1">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-1 bg-accent rounded-full animate-bounce"
                                    style={{ height: `${4 + i * 2}px`, animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-main">✕</button>
            </div>

            {/* Transcript Area */}
            <div className="flex-1 p-3 overflow-y-auto max-h-[200px] bg-bg-dark/50">
                {error && <p className="text-danger text-xs mb-2">⚠️ {error}</p>}
                {!transcript && !interimText && !isListening && !isDemo && (
                    <p className="text-text-muted text-sm text-center py-4">
                        Real-time transcription like ChatGPT voice mode
                    </p>
                )}
                {(transcript || interimText) && (
                    <p className="text-sm text-text-main leading-relaxed">
                        {transcript}
                        <span className="text-accent font-medium animate-pulse"> {interimText}</span>
                        <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse"></span>
                        <span ref={transcriptEndRef} />
                    </p>
                )}
                {(isListening || isDemo) && !transcript && !interimText && (
                    <p className="text-accent text-sm text-center animate-pulse">
                        {isDemo ? '🔊 Playing...' : '🎤 Listening...'}
                    </p>
                )}
            </div>

            {/* Summary */}
            {summary && (
                <div className="p-3 border-t border-border bg-primary/5">
                    <p className="text-xs font-bold text-primary mb-1">📌 Summary</p>
                    <p className="text-xs text-text-secondary">{summary}</p>
                </div>
            )}

            {/* Controls */}
            <div className="p-2 border-t border-border flex flex-col gap-2">
                <div className="flex gap-2">
                    <button
                        onClick={toggleListening}
                        className={`flex-1 py-2 rounded text-xs font-medium transition-all ${
                            isListening || isDemo
                                ? 'bg-danger text-white animate-pulse'
                                : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                    >
                        {isListening || isDemo ? '⏹ Stop' : '🎤 Record'}
                    </button>
                    <button
                        onClick={startDemo}
                        disabled={isListening || isDemo}
                        className="flex-1 py-2 rounded text-xs font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-all"
                    >
                        ▶️ Demo
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={generateSummary}
                        disabled={!transcript || isGeneratingSummary}
                        className="flex-1 py-2 rounded text-xs font-medium bg-success text-white hover:bg-success/90 disabled:opacity-50 transition-all"
                    >
                        {isGeneratingSummary ? '...' : '✨ Summarize'}
                    </button>
                    <button
                        onClick={downloadTranscript}
                        disabled={!transcript}
                        className="py-2 px-3 rounded text-xs bg-bg-dark border border-border hover:bg-bg-hover disabled:opacity-50"
                    >
                        📥
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveTranscript;

