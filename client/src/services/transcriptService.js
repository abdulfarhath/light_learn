/**
 * Real-time Transcript Service (Web Speech API)
 * Optimized for zero-latency with immediate interim results
 */

class TranscriptService {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.transcript = '';
        this.onTranscriptUpdate = null;
        this.onStatusChange = null;
    }

    isSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    init() {
        if (!this.isSupported()) return false;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Optimized settings for real-time
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            // Process only new results for faster updates
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += text + ' ';
                } else {
                    interim = text; // Only keep latest interim for speed
                }
            }

            if (final) this.transcript += final;

            // Immediate callback - no debouncing
            this.onTranscriptUpdate?.({
                final: this.transcript.trim(),
                interim: interim
            });
        };

        this.recognition.onerror = (event) => {
            if (event.error === 'no-speech') return; // Ignore silence
            this.onStatusChange?.('error', event.error);
        };

        this.recognition.onend = () => {
            // Auto-restart for continuous recognition
            if (this.isListening) {
                try { this.recognition.start(); } catch {}
            } else {
                this.onStatusChange?.('stopped');
            }
        };

        return true;
    }

    start() {
        if (!this.recognition && !this.init()) return false;

        this.transcript = '';
        this.isListening = true;

        try {
            this.recognition.start();
            this.onStatusChange?.('listening');
            return true;
        } catch {
            return false;
        }
    }

    stop() {
        this.isListening = false;
        this.recognition?.stop();
        return this.transcript.trim();
    }

    getTranscript() { return this.transcript.trim(); }
    clear() { this.transcript = ''; }
    setOnTranscriptUpdate(cb) { this.onTranscriptUpdate = cb; }
    setOnStatusChange(cb) { this.onStatusChange = cb; }
}

export default new TranscriptService();

