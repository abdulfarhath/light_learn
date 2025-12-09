import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import useAuthStore from '../../stores/authStore';
import api from '../../shared/utils/api';
import { useNavigate } from 'react-router-dom';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * SMART LESSON RECORDING SYSTEM
 * Event-based recording with:
 * - Opus-compressed audio (16kbps)
 * - JSONL event log (slide changes + drawing packets)
 * - No video capture
 */

const LessonRecorder = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    // State
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [pdfDocument, setPdfDocument] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [brushColor, setBrushColor] = useState('#ff0000');
    const [brushSize, setBrushSize] = useState(3);
    const [activeTool, setActiveTool] = useState('pen');
    const [isUploading, setIsUploading] = useState(false);
    const [title, setTitle] = useState('Untitled Lesson');
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    const [audioDevices, setAudioDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');

    // Refs
    const pdfCanvasRef = useRef(null);
    const drawingCanvasRef = useRef(null);
    const containerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const eventsRef = useRef([]); // JSONL events
    const startTimeRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef(null);
    const pdfFileRef = useRef(null);
    const renderTaskRef = useRef(null);
    
    // Pause logic refs
    const pauseStartTimeRef = useRef(0);
    const totalPausedTimeRef = useRef(0);

    // Audio visualization
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [micGain, setMicGain] = useState(1.0); // Default gain 1.0 (100%)
    const [pdfQuality, setPdfQuality] = useState('original'); // original, high, medium, low
    const [compressionProgress, setCompressionProgress] = useState(0);

    // Get current timestamp (t) relative to recording start
    const getTimestamp = () => {
        if (!startTimeRef.current) return 0;
        let currentPauseDuration = 0;
        if (isPaused && pauseStartTimeRef.current > 0) {
            currentPauseDuration = Date.now() - pauseStartTimeRef.current;
        }
        return Date.now() - startTimeRef.current - totalPausedTimeRef.current - currentPauseDuration;
    };

    // Initialize canvas size on mount
    useEffect(() => {
        if (containerRef.current && !pdfDocument) {
            const width = containerRef.current.clientWidth - 40;
            const height = width * 0.75; // 4:3 aspect ratio
            setCanvasSize({ width, height });
            if (drawingCanvasRef.current) {
                drawingCanvasRef.current.width = width;
                drawingCanvasRef.current.height = height;
            }
            if (pdfCanvasRef.current) {
                pdfCanvasRef.current.width = width;
                pdfCanvasRef.current.height = height;
            }
        }
    }, [pdfDocument]);

    // Fetch Audio Devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                // Request permission first to get labels
                await navigator.mediaDevices.getUserMedia({ audio: true });
                
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(device => device.kind === 'audioinput');
                setAudioDevices(audioInputs);
                
                if (audioInputs.length > 0) {
                    // Prefer default if available, otherwise first one
                    const defaultDevice = audioInputs.find(d => d.deviceId === 'default');
                    setSelectedDeviceId(defaultDevice ? defaultDevice.deviceId : audioInputs[0].deviceId);
                }
            } catch (err) {
                console.error("Error fetching audio devices:", err);
            }
        };
        getDevices();
    }, []);

    // Load PDF
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        pdfFileRef.current = file;

        const fileReader = new FileReader();
        fileReader.onload = async function () {
            const typedarray = new Uint8Array(this.result);
            try {
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                setPdfDocument(pdf);
                setNumPages(pdf.numPages);
                setCurrentSlide(1);
            } catch (error) {
                console.error('Error loading PDF:', error);
            }
        };
        fileReader.readAsArrayBuffer(file);
    };

    // Render PDF Page
    const renderPage = useCallback(async () => {
        if (!pdfDocument || !pdfCanvasRef.current) return;

        // Cancel previous render if it exists
        if (renderTaskRef.current) {
            try {
                renderTaskRef.current.cancel();
            } catch (e) {
                // Ignore cancellation errors
            }
        }

        const page = await pdfDocument.getPage(currentSlide);
        const canvas = pdfCanvasRef.current;
        const context = canvas.getContext('2d');

        // Calculate scale to fit container width (max width 1000px for example)
        const containerWidth = containerRef.current ? containerRef.current.clientWidth - 40 : 800;
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(containerWidth / viewport.width, 1.5); // Cap scale
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        // Update drawing canvas size to match
        if (drawingCanvasRef.current) {
            drawingCanvasRef.current.height = scaledViewport.height;
            drawingCanvasRef.current.width = scaledViewport.width;
            setCanvasSize({ width: scaledViewport.width, height: scaledViewport.height });
        }

        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        try {
            await renderTask.promise;
        } catch (error) {
            if (error.name !== 'RenderingCancelledException') {
                console.error('Render error:', error);
            }
        }
        
        // Clear drawing canvas on slide change (or we could persist per slide if we stored history)
        // For this MVP, we clear the visual canvas, but the events are recorded.
        // If we want to support "going back" and seeing drawings, we'd need to replay events.
        // For now, let's just clear.
        const ctx = drawingCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

    }, [pdfDocument, currentSlide]);

    useEffect(() => {
        renderPage();
    }, [renderPage]);

    // === RECORDING LOGIC ===
    const startRecording = async () => {
        try {
            console.log('🎙️ Starting recording...');
            console.log('Selected device:', selectedDeviceId);
            
            // Disable processing for raw audio, we will handle gain manually
            const constraints = { 
                audio: selectedDeviceId ? { 
                    deviceId: { exact: selectedDeviceId },
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    channelCount: 1
                } : {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    channelCount: 1
                }
            };
            
            console.log('Requesting audio with constraints:', constraints);
            const rawStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Raw audio stream obtained:', rawStream);
            
            // --- Audio Processing (Gain + Visualization) ---
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
            
            const source = audioContext.createMediaStreamSource(rawStream);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = micGain; // Apply initial gain
            
            const destination = audioContext.createMediaStreamDestination();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            
            // Connect: Source -> Gain -> Destination (for recording)
            //                  |-> Analyser (for visualizer)
            source.connect(gainNode);
            gainNode.connect(destination);
            gainNode.connect(analyser);
            
            analyserRef.current = analyser;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            dataArrayRef.current = dataArray;

            const updateVolume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                let sum = 0;
                for(let i = 0; i < bufferLength; i++) {
                    sum += dataArrayRef.current[i];
                }
                const average = sum / bufferLength;
                setAudioLevel(average);
                animationFrameRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();
            
            // Use the processed stream for recording
            const stream = destination.stream;
            // ---------------------------------

            // Codec selection: Prefer Opus, fallback to standard WebM
            // Increase bitrate to 128kbps for better quality
            let options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 };
            
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.warn('Opus codec not supported, trying default audio/webm');
                options = { mimeType: 'audio/webm', audioBitsPerSecond: 128000 };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                     console.warn('audio/webm not supported, letting browser choose default');
                     options = {}; // Browser default
                }
            }
            
            console.log(`Recording with options:`, options);
            
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            eventsRef.current = [];
            
            // Reset timers
            totalPausedTimeRef.current = 0;
            pauseStartTimeRef.current = 0;
            
            console.log('MediaRecorder state:', mediaRecorder.state);
            
            // Record initial slide event
            eventsRef.current.push({
                t: 0,
                type: 'slide',
                page: currentSlide
            });

            mediaRecorder.ondataavailable = (event) => {
                console.log('📦 Data available:', event.data.size, 'bytes');
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    console.log('Total chunks collected:', audioChunksRef.current.length);
                }
            };

            mediaRecorder.onerror = (e) => {
                console.error('❌ MediaRecorder error:', e);
                alert('Recording error occurred: ' + (e.error?.message || 'Unknown error'));
            };

            mediaRecorder.onstart = () => {
                console.log('✅ MediaRecorder started');
            };

            mediaRecorder.onstop = () => {
                console.log('⏹️ MediaRecorder stopped');
                console.log('Final audio chunks:', audioChunksRef.current.length);
            };

            mediaRecorder.start(1000);
            console.log('MediaRecorder.start(1000) called');
            
            startTimeRef.current = Date.now();
            setIsRecording(true);
            setIsPaused(false);

            timerIntervalRef.current = setInterval(() => {
                if (!isPaused) {
                    // Calculate elapsed time excluding pauses
                    const now = Date.now();
                    const totalPaused = totalPausedTimeRef.current;
                    setElapsedTime(Math.floor((now - startTimeRef.current - totalPaused) / 1000));
                }
            }, 1000);

        } catch (err) {
            console.error("❌ Error starting recording:", err);
            alert(`Could not start recording: ${err.message}\nPlease ensure microphone access is granted.`);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                // Resume
                const pauseDuration = Date.now() - pauseStartTimeRef.current;
                totalPausedTimeRef.current += pauseDuration;
                pauseStartTimeRef.current = 0;
                
                mediaRecorderRef.current.resume();
                setIsPaused(false);
                
                // Resume audio context if suspended (some browsers suspend it)
                if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume();
                }
            } else {
                // Pause
                pauseStartTimeRef.current = Date.now();
                mediaRecorderRef.current.pause();
                setIsPaused(true);
                
                // Optional: Suspend audio context to save resources
                // if (audioContextRef.current) audioContextRef.current.suspend();
            }
        }
    };

    const stopRecording = async () => {
        if (mediaRecorderRef.current) {
            const stopPromise = new Promise(resolve => {
                mediaRecorderRef.current.onstop = resolve;
            });
            
            mediaRecorderRef.current.stop();
            clearInterval(timerIntervalRef.current);
            
            // Stop visualization
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            setAudioLevel(0);

            setIsRecording(false);
            setIsPaused(false);
            
            // Stop all tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            
            await stopPromise;
            setTimeout(async () => {
                await saveRecording();
            }, 200);
        }
    };

    const compressPdf = async () => {
        if (!pdfDocument || pdfQuality === 'original') return pdfFileRef.current;

        console.log(`Compressing PDF with quality: ${pdfQuality}`);
        const doc = new jsPDF();
        const totalPages = pdfDocument.numPages;
        
        let scale = 1.0;
        let jpegQuality = 0.9;

        if (pdfQuality === 'high') { scale = 1.5; jpegQuality = 0.8; }
        if (pdfQuality === 'medium') { scale = 1.0; jpegQuality = 0.6; }
        if (pdfQuality === 'low') { scale = 0.7; jpegQuality = 0.4; }

        for (let i = 1; i <= totalPages; i++) {
            setCompressionProgress(Math.round((i / totalPages) * 100));
            
            const page = await pdfDocument.getPage(i);
            const viewport = page.getViewport({ scale: scale });
            
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            
            await page.render({ canvasContext: ctx, viewport }).promise;
            
            const imgData = canvas.toDataURL('image/jpeg', jpegQuality);
            
            if (i > 1) doc.addPage();
            
            // Calculate aspect ratio to fit A4 or keep original size
            // For simplicity, we set the PDF page size to match the image
            doc.setPage(i);
            doc.internal.pageSize.width = viewport.width * 0.264583; // px to mm
            doc.internal.pageSize.height = viewport.height * 0.264583;
            doc.addImage(imgData, 'JPEG', 0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height);
        }

        const pdfBlob = doc.output('blob');
        console.log(`Original PDF: ${(pdfFileRef.current.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Compressed PDF: ${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB`);
        return pdfBlob;
    };

    const saveRecording = async () => {
        if (audioChunksRef.current.length === 0) {
            alert("Recording failed: No audio data collected.");
            setIsUploading(false);
            return;
        }

        setIsUploading(true);
        setCompressionProgress(0);
        
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log(`Audio size: ${(audioBlob.size / 1024).toFixed(2)} KB`);
        
        // Compress PDF if needed
        let finalPdfBlob = pdfFileRef.current;
        if (pdfDocument && pdfQuality !== 'original') {
            try {
                finalPdfBlob = await compressPdf();
            } catch (err) {
                console.error("PDF Compression failed, using original", err);
                alert("PDF Compression failed. Uploading original file.");
            }
        }

        // Create JSONL file - each event on a new line
        const jsonlContent = eventsRef.current.map(event => JSON.stringify(event)).join('\n');
        const eventsBlob = new Blob([jsonlContent], { type: 'application/x-jsonlines' });
        console.log(`Events: ${eventsRef.current.length} entries, ${(eventsBlob.size / 1024).toFixed(2)} KB`);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'lesson_audio.webm');
        formData.append('events', eventsBlob, 'lesson_events.jsonl');
        if (finalPdfBlob) {
            formData.append('pdf', finalPdfBlob, 'slides.pdf');
        }
        formData.append('title', title);
        formData.append('duration', elapsedTime);
        formData.append('teacher_id', user.id);

        try {
            const response = await api.post('/lessons/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('Upload success:', response.data);
            alert(`✅ Lesson saved!\nAudio: ${(audioBlob.size / 1024).toFixed(2)} KB\nEvents: ${eventsRef.current.length}`);
            navigate('/dashboard');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to save lesson. Please try again.');
        } finally {
            setIsUploading(false);
            setCompressionProgress(0);
        }
    };

    // === DRAWING LOGIC ===
    const getCoordinates = (e) => {
        const canvas = drawingCanvasRef.current;
        
        // Method 1: Try using native offsetX/Y (most robust for simple cases)
        if (e.nativeEvent && typeof e.nativeEvent.offsetX === 'number') {
            // Calculate scale in case CSS size differs from internal resolution
            const scaleX = canvas.width / canvas.clientWidth;
            const scaleY = canvas.height / canvas.clientHeight;
            return {
                x: Math.round(e.nativeEvent.offsetX * scaleX),
                y: Math.round(e.nativeEvent.offsetY * scaleY)
            };
        }

        // Method 2: Fallback to client rect (standard approach)
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // Handle touch events if present (though we primarily use mouse here)
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        return {
            x: Math.round((clientX - rect.left) * scaleX),
            y: Math.round((clientY - rect.top) * scaleY)
        };
    };

    const startDrawing = (e) => {
        if (isPaused) return;
        
        isDrawingRef.current = true;
        const { x, y } = getCoordinates(e);
        lastPointRef.current = { x, y };
        
        // Record draw_start event
        if (isRecording) {
            const canvas = drawingCanvasRef.current;
            eventsRef.current.push({
                t: getTimestamp(),
                type: 'draw_start',
                x,
                y,
                nx: x / canvas.width,
                ny: y / canvas.height
            });
        }
    };

    const draw = (e) => {
        if (!isDrawingRef.current || isPaused) return;
        
        const { x, y } = getCoordinates(e);
        const ctx = drawingCanvasRef.current.getContext('2d');
        
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        
        if (activeTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = Math.max(brushSize, 20);
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
        }
        
        ctx.lineCap = 'round';
        ctx.stroke();

        // Record draw event with action: move
        if (isRecording) {
            const canvas = drawingCanvasRef.current;
            eventsRef.current.push({
                t: getTimestamp(),
                type: 'draw',
                x,
                y,
                nx: x / canvas.width,
                ny: y / canvas.height,
                color: activeTool === 'eraser' ? '#eraser' : brushColor,
                width: activeTool === 'eraser' ? Math.max(brushSize, 20) : brushSize,
                action: 'move'
            });
        }

        lastPointRef.current = { x, y };
    };

    const stopDrawing = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        
        // Record draw_end event
        if (isRecording) {
            eventsRef.current.push({
                t: getTimestamp(),
                type: 'draw_end'
            });
        }
    };

    const changeSlide = (newSlide) => {
        if (newSlide < 1 || newSlide > numPages) return;
        setCurrentSlide(newSlide);
        
        // Record slide change event
        if (isRecording) {
            eventsRef.current.push({
                t: getTimestamp(),
                type: 'slide',
                page: newSlide
            });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isRecording}
                        className="text-xl font-bold border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none disabled:opacity-50"
                        placeholder="Enter lesson title"
                    />
                    {isRecording && (
                        <span className="text-red-600 font-mono text-xl animate-pulse flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-600 rounded-full"></span>
                            {new Date(elapsedTime * 1000).toISOString().substr(11, 8)}
                        </span>
                    )}
                </div>
                <div className="flex gap-3 items-center">
                    {/* Audio Level Indicator */}
                    {isRecording && (
                        <div className="flex items-center gap-2 mr-2" title="Microphone Level">
                            <span className="text-xs text-gray-500">🎤</span>
                            <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                                <div 
                                    className={`h-full transition-all duration-75 ${audioLevel > 5 ? 'bg-green-500' : 'bg-gray-300'}`}
                                    style={{ width: `${Math.min((audioLevel / 50) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {!isRecording && (
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <label className="text-[10px] text-gray-500 font-semibold uppercase">Mic Gain: {(micGain * 100).toFixed(0)}%</label>
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="5.0" 
                                    step="0.1" 
                                    value={micGain} 
                                    onChange={(e) => setMicGain(parseFloat(e.target.value))}
                                    className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                                    title="Adjust Microphone Sensitivity"
                                />
                            </div>
                            <select 
                                value={selectedDeviceId} 
                                onChange={(e) => setSelectedDeviceId(e.target.value)}
                                className="border rounded px-3 py-2 text-sm max-w-[200px] bg-white"
                                title="Select Microphone"
                            >
                                {audioDevices.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {!isRecording ? (
                        <button 
                            onClick={startRecording} 
                            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 font-semibold"
                        >
                            <span className="w-3 h-3 bg-white rounded-full"></span>
                            Start Recording
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={pauseRecording}
                                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                            >
                                {isPaused ? '▶ Resume' : '⏸ Pause'}
                            </button>
                            <button 
                                onClick={stopRecording}
                                className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900"
                            >
                                ⏹ Stop & Save
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-72 bg-white border-r p-4 flex flex-col gap-6 overflow-y-auto">
                    {/* PDF Upload */}
                    {!pdfDocument && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <p className="text-gray-500 mb-3 text-sm">Upload PDF slides</p>
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                onChange={handleFileChange}
                                disabled={isRecording}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                            />
                        </div>
                    )}

                    {/* PDF Quality Selector */}
                    {pdfDocument && !isRecording && (
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                            <label className="text-xs font-semibold text-gray-600 block mb-2">PDF Upload Quality</label>
                            <select 
                                value={pdfQuality} 
                                onChange={(e) => setPdfQuality(e.target.value)}
                                className="w-full text-sm border rounded p-1"
                            >
                                <option value="original">Original (No Compression)</option>
                                <option value="high">High Quality (Large)</option>
                                <option value="medium">Medium Quality (Balanced)</option>
                                <option value="low">Low Quality (Smallest)</option>
                            </select>
                            <p className="text-[10px] text-gray-500 mt-1">
                                {pdfQuality === 'original' ? 'Uploads the exact file you selected.' : 'Re-encodes pages to save space.'}
                            </p>
                        </div>
                    )}

                    {/* Slide Navigation */}
                    {pdfDocument && (
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Slides</h3>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                <button 
                                    onClick={() => changeSlide(currentSlide - 1)}
                                    disabled={currentSlide <= 1}
                                    className="p-2 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    ◀
                                </button>
                                <span className="font-mono font-semibold">{currentSlide} / {numPages}</span>
                                <button 
                                    onClick={() => changeSlide(currentSlide + 1)}
                                    disabled={currentSlide >= numPages}
                                    className="p-2 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    ▶
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Drawing Tools */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3">Whiteboard Tools</h3>
                        
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setActiveTool('pen')}
                                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                                    activeTool === 'pen' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                ✏️ Pen
                            </button>
                            <button
                                onClick={() => setActiveTool('eraser')}
                                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                                    activeTool === 'eraser' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                🧹 Eraser
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs text-gray-600 font-medium mb-2 block">Colors</label>
                            <div className="grid grid-cols-5 gap-2">
                                {['#ff0000', '#00ff00', '#0000ff', '#000000', '#ffff00'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            setBrushColor(color);
                                            setActiveTool('pen');
                                        }}
                                        className={`w-10 h-10 rounded border-2 transition-transform ${
                                            brushColor === color && activeTool === 'pen' 
                                            ? 'border-gray-800 scale-110 shadow-lg' 
                                            : 'border-gray-300'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-600 font-medium">
                                {activeTool === 'eraser' ? 'Eraser' : 'Brush'} Size: {brushSize}px
                            </label>
                            <input 
                                type="range" 
                                min="1" 
                                max="50" 
                                value={brushSize} 
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {isRecording && (
                        <div className="p-3 bg-blue-50 rounded border border-blue-200 text-xs">
                            <p className="text-blue-800 font-semibold mb-1">📹 Recording Active</p>
                            <p className="text-blue-600">Events captured: {eventsRef.current.length}</p>
                        </div>
                    )}
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-gray-50 flex justify-center items-center overflow-auto p-8" ref={containerRef}>
                    <div className="relative shadow-2xl bg-white rounded-lg overflow-hidden" style={{ width: canvasSize.width, height: canvasSize.height }}>
                        <canvas 
                            ref={pdfCanvasRef} 
                            className="absolute top-0 left-0 z-0 w-full h-full"
                        />
                        <canvas 
                            ref={drawingCanvasRef}
                            className="absolute top-0 left-0 z-10 cursor-crosshair w-full h-full"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                        {!pdfDocument && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-0 pointer-events-none">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">📝</div>
                                    <div className="font-semibold">Whiteboard Mode</div>
                                    <div className="text-sm">Upload PDF or draw freely</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isUploading && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-xl font-bold mb-2">Saving Lesson...</p>
                        {compressionProgress > 0 && compressionProgress < 100 ? (
                            <div>
                                <p className="text-sm text-blue-600 font-semibold mb-1">Compressing PDF: {compressionProgress}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${compressionProgress}%` }}></div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">Uploading audio + events (JSONL)</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">This may take a moment</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonRecorder;
