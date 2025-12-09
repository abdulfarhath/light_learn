import React, { useState, useEffect, useRef } from 'react';
import transcriptService from '../services/transcriptService';
import summarizationService from '../services/summarizationService';

// Demo transcript text - will be spoken aloud and displayed word by word
const DEMO_TEXT = "Welcome to the real-time transcription demo. This feature converts speech to text instantly, just like ChatGPT or Perplexity voice mode. The transcription appears word by word as the audio plays, providing a seamless real-time experience. Students can use this to transcribe lectures, take notes automatically, and generate AI-powered summaries of any spoken content. This is completely free and works directly in your browser.";

const TranscriptModal = ({ isOpen, onClose, topicTitle }) => {
    const [status, setStatus] = useState('idle'); // idle, listening, demo, processing, done, error
    const [transcript, setTranscript] = useState('');
    const [interimText, setInterimText] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState('');
    const [recordingTime, setRecordingTime] = useState(0);
    const [demoProgress, setDemoProgress] = useState(0);

    // Timer for recording duration
    useEffect(() => {
        let interval;
        if (status === 'listening' || status === 'demo') {
            interval = setInterval(() => setRecordingTime(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Setup transcription callbacks
    useEffect(() => {
        if (status === 'listening') {
            transcriptService.setOnTranscriptUpdate(({ final, interim }) => {
                setTranscript(final);
                setInterimText(interim);
            });
            transcriptService.setOnStatusChange((newStatus, errorMsg) => {
                if (newStatus === 'error') {
                    setError(`Speech recognition error: ${errorMsg}`);
                    setStatus('error');
                }
            });
        }
        return () => {
            if (status === 'listening') {
                transcriptService.stop();
            }
        };
    }, [status]);

    // Cleanup speech synthesis on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis?.cancel();
        };
    }, []);

    const handleDemoComplete = async (text) => {
        setStatus('processing');
        try {
            const result = await summarizationService.analyzeTranscript(text);
            setAnalysis(result);
            setStatus('done');
        } catch {
            setError('Failed to generate summary');
            setStatus('error');
        }
    };

    // Start demo - speak the text aloud while showing transcription
    const startDemo = () => {
        if (!window.speechSynthesis) {
            setError('Speech synthesis not supported in this browser');
            return;
        }

        setError('');
        setTranscript('');
        setInterimText('');
        setAnalysis(null);
        setRecordingTime(0);
        setDemoProgress(0);
        setStatus('demo');

        const utterance = new SpeechSynthesisUtterance(DEMO_TEXT);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Get a good English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
            || voices.find(v => v.lang.startsWith('en-US'))
            || voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;

        const words = DEMO_TEXT.split(' ');

        // Update transcript as words are spoken
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const spokenText = DEMO_TEXT.substring(0, event.charIndex + event.charLength);
                const spokenWords = spokenText.split(' ').filter(w => w);
                const finalWords = spokenWords.slice(0, -1);
                const currentWord = spokenWords[spokenWords.length - 1] || '';

                setTranscript(finalWords.join(' '));
                setInterimText(currentWord);
                setDemoProgress((spokenWords.length / words.length) * 100);
            }
        };

        utterance.onend = () => {
            setTranscript(DEMO_TEXT);
            setInterimText('');
            setDemoProgress(100);
            handleDemoComplete(DEMO_TEXT);
        };

        utterance.onerror = () => {
            setError('Speech synthesis error');
            setStatus('error');
        };

        window.speechSynthesis.speak(utterance);
    };

    // Stop demo
    const stopDemo = () => {
        window.speechSynthesis?.cancel();
        const currentText = (transcript + ' ' + interimText).trim();
        setInterimText('');
        if (currentText) {
            handleDemoComplete(currentText);
        } else {
            setStatus('idle');
        }
    };

    // Start speech recognition
    const startListening = () => {
        if (!transcriptService.isSupported()) {
            setError('Speech recognition not supported. Please use Chrome or Edge browser.');
            setStatus('error');
            return;
        }
        setError('');
        setTranscript('');
        setInterimText('');
        setAnalysis(null);
        setRecordingTime(0);
        transcriptService.start();
        setStatus('listening');
    };

    // Stop and generate summary
    const stopAndAnalyze = async () => {
        const finalTranscript = transcriptService.stop();
        setTranscript(finalTranscript);

        if (!finalTranscript.trim()) {
            setError('No speech detected. Please try again.');
            setStatus('error');
            return;
        }

        setStatus('processing');

        try {
            const result = await summarizationService.analyzeTranscript(finalTranscript);
            setAnalysis(result);
            setStatus('done');
        } catch {
            setError('Failed to generate summary');
            setStatus('error');
        }
    };

    // Reset everything
    const reset = () => {
        setStatus('idle');
        setTranscript('');
        setInterimText('');
        setAnalysis(null);
        setError('');
        setRecordingTime(0);
    };

    const downloadTranscript = () => {
        let content = `📝 AI TRANSCRIPT ANALYSIS\n`;
        content += `Topic: ${topicTitle}\n`;
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `${'═'.repeat(60)}\n\n`;

        if (analysis) {
            content += `📊 QUICK STATS\n`;
            content += `• Words: ${analysis.wordCount} | Reading Time: ${analysis.estimatedReadTime}\n`;
            content += `• Complexity: ${analysis.insights?.complexity || 'N/A'}\n\n`;

            content += `📌 SUMMARY\n${analysis.summary}\n\n`;

            if (analysis.keyPoints?.length > 0) {
                content += `🎯 KEY POINTS\n`;
                analysis.keyPoints.forEach((kp, i) => {
                    content += `${i + 1}. ${kp.point}\n`;
                });
                content += '\n';
            }

            if (analysis.topics?.length > 0) {
                content += `📚 TOPICS COVERED\n`;
                content += analysis.topics.map(t => `• ${t.name} (${t.mentions} mentions)`).join('\n');
                content += '\n\n';
            }

            if (analysis.insights?.recommendation) {
                content += `💡 STUDY TIP\n${analysis.insights.recommendation}\n\n`;
            }
        }

        content += `${'═'.repeat(60)}\n`;
        content += `📄 FULL TRANSCRIPT\n${'─'.repeat(60)}\n`;
        content += transcript;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript_${topicTitle.replace(/\s+/g, '_')}_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-bg-panel border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                            🎤 Speech to Text
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">{topicTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-hover rounded-lg text-text-muted text-xl">✕</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                    {/* Error */}
                    {error && (
                        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 flex items-center gap-2">
                            <span>⚠️</span>
                            <p className="text-sm text-danger">{error}</p>
                            <button onClick={reset} className="ml-auto text-xs text-danger hover:underline">Dismiss</button>
                        </div>
                    )}

                    {/* Idle State - Start Buttons */}
                    {status === 'idle' && !error && (
                        <div className="text-center py-6">
                            <div className="text-6xl mb-4">🎤</div>
                            <p className="text-text-secondary mb-6">Real-time speech transcription like ChatGPT voice mode</p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                                <button
                                    onClick={startListening}
                                    className="flex-1 px-6 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>🎤</span> Start Recording
                                </button>
                                <button
                                    onClick={startDemo}
                                    className="flex-1 px-6 py-4 bg-accent text-white rounded-xl font-bold text-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>▶️</span> Play Demo
                                </button>
                            </div>

                            <p className="text-xs text-text-muted mt-4">
                                Demo plays audio & shows real-time transcription
                            </p>
                        </div>
                    )}

                    {/* Demo Mode - Playing audio with transcription */}
                    {status === 'demo' && (
                        <div className="space-y-4">
                            {/* Playing indicator */}
                            <div className="flex items-center justify-between p-4 bg-accent/10 border border-accent/30 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className="w-1 bg-accent rounded-full animate-bounce"
                                                style={{ height: `${8 + Math.random() * 12}px`, animationDelay: `${i * 0.1}s` }} />
                                        ))}
                                    </div>
                                    <span className="font-medium text-accent">🔊 Playing Audio + Transcribing...</span>
                                </div>
                                <span className="font-mono text-2xl text-accent">{formatTime(recordingTime)}</span>
                            </div>

                            {/* Live transcript */}
                            <div className="p-4 bg-bg-dark rounded-xl min-h-[150px] max-h-[250px] overflow-y-auto">
                                <p className="text-text-main leading-relaxed text-lg">
                                    {transcript}
                                    <span className="text-accent font-medium animate-pulse"> {interimText}</span>
                                    <span className="inline-block w-0.5 h-5 bg-accent ml-1 animate-pulse"></span>
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-bg-dark rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-accent transition-all duration-200"
                                    style={{ width: `${demoProgress}%` }}
                                />
                            </div>

                            {/* Stop button */}
                            <button
                                onClick={stopDemo}
                                className="w-full py-3 bg-danger text-white rounded-xl font-bold hover:bg-danger/90 transition-all"
                            >
                                ⏹️ Stop & Generate Summary
                            </button>
                        </div>
                    )}

                    {/* Listening State (Microphone) */}
                    {status === 'listening' && (
                        <div className="space-y-4">
                            {/* Recording indicator */}
                            <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                                    </div>
                                    <span className="font-medium text-red-400">🎤 Recording...</span>
                                </div>
                                <span className="font-mono text-2xl text-red-400">{formatTime(recordingTime)}</span>
                            </div>

                            {/* Live transcript */}
                            <div className="p-4 bg-bg-dark rounded-xl min-h-[150px] max-h-[250px] overflow-y-auto">
                                <p className="text-text-main leading-relaxed text-lg">
                                    {transcript}
                                    <span className="text-primary font-medium animate-pulse"> {interimText}</span>
                                    {!transcript && !interimText && (
                                        <span className="text-text-muted">Start speaking...</span>
                                    )}
                                    {(transcript || interimText) && (
                                        <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse"></span>
                                    )}
                                </p>
                            </div>

                            {/* Stop button */}
                            <button
                                onClick={stopAndAnalyze}
                                className="w-full py-3 bg-danger text-white rounded-xl font-bold hover:bg-danger/90 transition-all"
                            >
                                ⏹️ Stop & Generate Summary
                            </button>
                        </div>
                    )}

                    {/* Processing Status */}
                    {status === 'processing' && (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-text-main font-medium">Generating AI Summary...</p>
                            <p className="text-sm text-text-muted mt-1">This may take a few seconds</p>
                        </div>
                    )}

                    {/* Results Display */}
                    {status === 'done' && analysis && (
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="flex gap-4 text-sm">
                                <span className="text-text-muted">{analysis.wordCount} words</span>
                                <span className="text-text-muted">•</span>
                                <span className="text-text-muted">{analysis.estimatedReadTime} read</span>
                            </div>

                            {/* Summary */}
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                <h3 className="font-bold text-text-main mb-2">📌 Summary</h3>
                                <p className="text-text-main leading-relaxed">{analysis.summary}</p>
                            </div>

                            {/* Key Points */}
                            {analysis.keyPoints?.length > 0 && (
                                <div className="p-4 bg-bg-dark border border-border rounded-xl">
                                    <h3 className="font-bold text-text-main mb-3">🎯 Key Points</h3>
                                    <ul className="space-y-2">
                                        {analysis.keyPoints.map((kp) => (
                                            <li key={kp.id} className="flex items-start gap-2 text-text-secondary">
                                                <span className="text-primary">•</span>
                                                {kp.point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Full Transcript */}
                            <details className="bg-bg-dark border border-border rounded-xl">
                                <summary className="p-3 cursor-pointer hover:bg-bg-hover font-medium text-text-main">
                                    📄 Full Transcript
                                </summary>
                                <div className="p-3 border-t border-border max-h-[150px] overflow-y-auto">
                                    <p className="text-text-secondary text-sm whitespace-pre-wrap">{transcript}</p>
                                </div>
                            </details>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={reset}
                                    className="flex-1 py-2.5 bg-bg-dark border border-border text-text-main rounded-lg hover:bg-bg-hover transition-colors font-medium"
                                >
                                    New Recording
                                </button>
                                <button
                                    onClick={downloadTranscript}
                                    className="flex-1 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TranscriptModal;