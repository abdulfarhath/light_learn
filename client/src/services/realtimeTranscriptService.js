/**
 * Real-time Transcript Service
 * Uses Deepgram's streaming API for zero-latency speech-to-text
 * Free tier: $200 credit (enough for ~100+ hours of transcription)
 */

const DEEPGRAM_API_KEY = 'YOUR_DEEPGRAM_API_KEY'; // Get free key at console.deepgram.com

class RealtimeTranscriptService {
    constructor() {
        this.socket = null;
        this.mediaRecorder = null;
        this.stream = null;
        this.transcript = '';
        this.isListening = false;
        this.onTranscriptUpdate = null;
        this.onStatusChange = null;
    }

    /**
     * Check if browser supports required APIs
     */
    isSupported() {
        return navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.WebSocket;
    }

    /**
     * Start real-time transcription
     */
    async start() {
        if (this.isListening) return true;

        try {
            // Get microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Connect to Deepgram WebSocket
            const dgUrl = `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&model=nova-2&punctuate=true&interim_results=true`;
            
            this.socket = new WebSocket(dgUrl, ['token', DEEPGRAM_API_KEY]);

            this.socket.onopen = () => {
                console.log('Deepgram connected');
                this.isListening = true;
                this.transcript = '';
                this.onStatusChange?.('listening');
                this.startRecording();
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.channel?.alternatives?.[0]) {
                    const text = data.channel.alternatives[0].transcript;
                    const isFinal = data.is_final;

                    if (isFinal && text) {
                        this.transcript += text + ' ';
                        this.onTranscriptUpdate?.({ final: this.transcript.trim(), interim: '' });
                    } else if (text) {
                        this.onTranscriptUpdate?.({ final: this.transcript.trim(), interim: text });
                    }
                }
            };

            this.socket.onerror = (error) => {
                console.error('Deepgram error:', error);
                this.onStatusChange?.('error', 'Connection failed');
            };

            this.socket.onclose = () => {
                console.log('Deepgram disconnected');
                if (this.isListening) {
                    this.isListening = false;
                    this.onStatusChange?.('stopped');
                }
            };

            return true;
        } catch (error) {
            console.error('Failed to start:', error);
            this.onStatusChange?.('error', error.message);
            return false;
        }
    }

    /**
     * Start recording audio and sending to Deepgram
     */
    startRecording() {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(this.stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
            if (!this.isListening || this.socket?.readyState !== WebSocket.OPEN) return;

            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(inputData.length);
            
            for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
            }
            
            this.socket.send(pcm16.buffer);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        
        this.audioContext = audioContext;
        this.processor = processor;
        this.source = source;
    }

    /**
     * Stop transcription
     */
    stop() {
        this.isListening = false;
        
        // Stop audio processing
        this.processor?.disconnect();
        this.source?.disconnect();
        this.audioContext?.close();
        
        // Stop media stream
        this.stream?.getTracks().forEach(track => track.stop());
        
        // Close WebSocket
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.close();
        }

        this.onStatusChange?.('stopped');
        return this.transcript.trim();
    }

    getTranscript() { return this.transcript.trim(); }
    clear() { this.transcript = ''; }
    setOnTranscriptUpdate(cb) { this.onTranscriptUpdate = cb; }
    setOnStatusChange(cb) { this.onStatusChange = cb; }
}

export default new RealtimeTranscriptService();

