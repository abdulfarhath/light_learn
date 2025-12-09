import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useParams } from 'react-router-dom';
import api from '../../shared/utils/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Haptic feedback helper
const haptic = () => {
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
};

/**
 * SMART LESSON PLAYER
 * Replays event-based recordings:
 * - Loads JSONL events (line by line)
 * - Plays Opus audio
 * - Synchronizes drawing/slides with audio timeline
 */

const LessonPlayer = () => {
    const { id } = useParams();
    const [lesson, setLesson] = useState(null);
    const [pdfDocument, setPdfDocument] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    const [controlsVisible, setControlsVisible] = useState(true);
    const [touchStart, setTouchStart] = useState(null);
    const [error, setError] = useState(null);

    const audioRef = useRef(null);
    const pdfCanvasRef = useRef(null);
    const drawingCanvasRef = useRef(null);
    const containerRef = useRef(null);
    const eventsRef = useRef([]); // Parsed JSONL events
    const lastEventIndexRef = useRef(0);
    const currentDrawingRef = useRef({ x: null, y: null, color: null, width: null });
    const renderTaskRef = useRef(null);
    const hideControlsTimeoutRef = useRef(null);

    // Helper to get correct URL (Ngrok or Localhost)
    const getFileUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        
        // Get the base URL from your API config (which is set to ngrok)
        // Removes '/api' from the end to get the root server URL
        const baseUrl = api.defaults.baseURL?.replace('/api', '') || '';
        return `${baseUrl}${path}`;
    };

    // Load Lesson Data
    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const response = await api.get(`/lessons/${id}`);
                setLesson(response.data);
                
                // FIX: Use getFileUrl for events
                const eventsUrl = getFileUrl(response.data.events_url);
                
                const eventsResponse = await fetch(eventsUrl);
                if (!eventsResponse.ok) throw new Error('Failed to load events');
                
                const eventsText = await eventsResponse.text();
                // Parse JSONL: split by newline, parse each line
                const events = eventsText
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => JSON.parse(line));
                
                eventsRef.current = events;
                console.log(`Loaded ${events.length} events from JSONL`);

                // Find initial slide
                const firstSlideEvent = events.find(e => e.type === 'slide');
                if (firstSlideEvent) {
                    setCurrentSlide(firstSlideEvent.page);
                }

                // Load PDF
                if (response.data.pdf_url) {
                    // FIX: Use getFileUrl for PDF
                    const pdfUrl = getFileUrl(response.data.pdf_url);
                        
                    const loadingTask = pdfjsLib.getDocument(pdfUrl);
                    const pdf = await loadingTask.promise;
                    setPdfDocument(pdf);
                }
            } catch (error) {
                console.error('Error loading lesson:', error);
                setError({
                    message: 'Failed to load lesson',
                    details: error.message,
                    retry: fetchLesson
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchLesson();
    }, [id]);

    // Render PDF Page
    const renderPage = useCallback(async (slideNum) => {
        if (!pdfDocument || !pdfCanvasRef.current || !slideNum) return;

        // Cancel previous render if it exists
        if (renderTaskRef.current) {
            try {
                renderTaskRef.current.cancel();
            } catch (e) {
                // Ignore cancellation errors
            }
        }

        try {
            const page = await pdfDocument.getPage(slideNum);
            const canvas = pdfCanvasRef.current;
            const context = canvas.getContext('2d');

            const containerWidth = containerRef.current ? containerRef.current.clientWidth - 40 : 800;
            const viewport = page.getViewport({ scale: 1 });
            const scale = Math.min(containerWidth / viewport.width, 1.5);
            const scaledViewport = page.getViewport({ scale });

            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;
            
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
            await renderTask.promise;
        } catch (error) {
            if (error.name !== 'RenderingCancelledException') {
                console.error('Error rendering page:', error);
            }
        }
    }, [pdfDocument]);

    // Initial Render
    useEffect(() => {
        if (pdfDocument && currentSlide) {
            renderPage(currentSlide);
        }
    }, [pdfDocument, currentSlide, renderPage]);

    // Playback Controls
    const play = () => {
        if (audioRef.current) {
            haptic();
            audioRef.current.play();
            setIsPlaying(true);
            setControlsVisible(false);
        }
    };

    const pause = () => {
        if (audioRef.current) {
            haptic();
            audioRef.current.pause();
            setIsPlaying(false);
            setControlsVisible(true);
        }
    };

    const togglePlayPause = () => {
        isPlaying ? pause() : play();
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            syncEvents(audioRef.current.currentTime * 1000); // Convert to milliseconds
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    // === EVENT SYNCHRONIZATION ===
    const syncEvents = (currentTimeMs) => {
        const ctx = drawingCanvasRef.current?.getContext('2d');
        if (!ctx) return;

        // If seeking backwards, reset
        if (lastEventIndexRef.current > 0 && 
            eventsRef.current[lastEventIndexRef.current - 1]?.t > currentTimeMs) {
            resetCanvas();
            lastEventIndexRef.current = 0;
        }

        // Process all events up to current time
        while (
            lastEventIndexRef.current < eventsRef.current.length &&
            eventsRef.current[lastEventIndexRef.current].t <= currentTimeMs
        ) {
            const event = eventsRef.current[lastEventIndexRef.current];
            processEvent(event, ctx);
            lastEventIndexRef.current++;
        }
    };

    // Process individual event
    const processEvent = (event, ctx) => {
        switch (event.type) {
            case 'slide':
                // Change slide
                if (event.page !== currentSlide) {
                    setCurrentSlide(event.page);
                    renderPage(event.page);
                    // Clear drawing canvas on slide change
                    ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
                }
                break;

            case 'draw_start':
                // Start new stroke
                {
                    const canvas = drawingCanvasRef.current;
                    const x = event.nx !== undefined ? event.nx * canvas.width : event.x;
                    const y = event.ny !== undefined ? event.ny * canvas.height : event.y;
                    
                    currentDrawingRef.current = {
                        x,
                        y,
                        color: null,
                        width: null
                    };
                }
                break;

            case 'draw':
                // Draw stroke segment
                if (currentDrawingRef.current.x !== null) {
                    const canvas = drawingCanvasRef.current;
                    const x = event.nx !== undefined ? event.nx * canvas.width : event.x;
                    const y = event.ny !== undefined ? event.ny * canvas.height : event.y;

                    ctx.beginPath();
                    ctx.moveTo(currentDrawingRef.current.x, currentDrawingRef.current.y);
                    ctx.lineTo(x, y);
                    
                    if (event.color === '#eraser') {
                        ctx.globalCompositeOperation = 'destination-out';
                        ctx.lineWidth = event.width || 20;
                    } else {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.strokeStyle = event.color;
                        ctx.lineWidth = event.width || 3;
                    }
                    
                    ctx.lineCap = 'round';
                    ctx.stroke();

                    currentDrawingRef.current.x = x;
                    currentDrawingRef.current.y = y;
                }
                break;

            case 'draw_end':
                // End stroke
                currentDrawingRef.current = { x: null, y: null, color: null, width: null };
                ctx.closePath();
                break;

            default:
                break;
        }
    };

    const resetCanvas = () => {
        const ctx = drawingCanvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        }
        currentDrawingRef.current = { x: null, y: null, color: null, width: null };

        // Reset to first slide
        const firstSlideEvent = eventsRef.current.find(e => e.type === 'slide');
        if (firstSlideEvent) {
            setCurrentSlide(firstSlideEvent.page);
            renderPage(firstSlideEvent.page);
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            haptic();
            audioRef.current.currentTime = time;
            setCurrentTime(time);
            resetCanvas();
            lastEventIndexRef.current = 0;
            syncEvents(time * 1000);
        }
    };

    // Touch gesture handlers
    const handleTouchStart = (e) => {
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        if (!touchStart) return;
        
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;
        
        // Swipe threshold: 50px
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentSlide < (pdfDocument?.numPages || 1)) {
                // Swipe left - next slide
                haptic();
                changeSlide(currentSlide + 1);
            } else if (diff < 0 && currentSlide > 1) {
                // Swipe right - previous slide
                haptic();
                changeSlide(currentSlide - 1);
            }
        }
        
        setTouchStart(null);
    };

    const handleCanvasClick = () => {
        setControlsVisible(true);
    };

    // Auto-hide controls when playing
    useEffect(() => {
        if (isPlaying && controlsVisible) {
            hideControlsTimeoutRef.current = setTimeout(() => {
                setControlsVisible(false);
            }, 3000);
        }
        
        return () => {
            if (hideControlsTimeoutRef.current) {
                clearTimeout(hideControlsTimeoutRef.current);
            }
        };
    }, [isPlaying, controlsVisible]);

    const changeSlide = (newSlide) => {
        if (newSlide < 1 || newSlide > (pdfDocument?.numPages || 1)) return;
        setCurrentSlide(newSlide);
        
        if (isRecording) {
            eventsRef.current.push({
                t: getTimestamp(),
                type: 'slide',
                page: newSlide
            });
        }
    };

    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
        try {
            return new Date(seconds * 1000).toISOString().substr(14, 5);
        } catch (e) {
            return "00:00";
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-screen bg-gray-900">
            <div className="text-center">
                {/* Loading skeleton */}
                <div className="space-y-4 animate-pulse">
                    <div className="w-64 h-8 bg-gray-700 rounded mx-auto"></div>
                    <div className="w-96 h-64 bg-gray-800 rounded mx-auto"></div>
                    <div className="w-80 h-4 bg-gray-700 rounded mx-auto"></div>
                </div>
                <p className="text-lg font-semibold text-white mt-6">Loading lesson...</p>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="flex items-center justify-center h-screen bg-gray-900 p-4">
            <div className="text-center max-w-md">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-white mb-2">{error.message}</h2>
                <p className="text-gray-400 mb-6">{error.details}</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => { setError(null); error.retry(); }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        🔄 Retry
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-semibold"
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        </div>
    );
    
    if (!lesson) return (
        <div className="flex items-center justify-center h-screen bg-gray-900">
            <div className="text-center">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-xl font-semibold text-white">Lesson not found</p>
                <button
                    onClick={() => window.history.back()}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    ← Back to Dashboard
                </button>
            </div>
        </div>
    );

    return (
        <div 
            className="flex flex-col h-screen bg-gray-900 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Mobile-optimized Header */}
            <div className={`bg-gray-800 shadow-lg p-3 md:p-4 z-10 transition-opacity duration-300 ${
                isPlaying && !controlsVisible ? 'opacity-20' : 'opacity-100'
            }`}>
                <h1 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-white truncate">{lesson.title}</h1>
                
                {/* Slide counter - mobile friendly */}
                {pdfDocument && (
                    <div className="text-sm text-gray-400 mb-2">
                        Slide {currentSlide} of {pdfDocument.numPages}
                    </div>
                )}
                
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Large touch-friendly play/pause button */}
                    <button 
                        onClick={togglePlayPause}
                        className="bg-blue-600 text-white p-4 md:px-6 md:py-3 rounded-full md:rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 min-w-[60px] min-h-[60px] md:min-w-0 md:min-h-0 shadow-lg active:scale-95 transition-transform"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        <span className="text-2xl md:text-base">{isPlaying ? '⏸' : '▶'}</span>
                        <span className="hidden md:inline">{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>
                    {/* Progress bar - larger touch target on mobile */}
                    <input 
                        type="range" 
                        min="0" 
                        max={duration || 0} 
                        value={currentTime} 
                        onChange={handleSeek}
                        className="flex-1 h-3 md:h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                        }}
                    />
                    <span className="font-mono text-xs md:text-sm text-gray-300 min-w-[80px] md:min-w-[100px] text-right">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>
                
                {/* Navigation buttons - mobile optimized */}
                {pdfDocument && (
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => changeSlide(currentSlide - 1)}
                            disabled={currentSlide <= 1}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 active:scale-95 transition-transform min-h-[44px]"
                        >
                            ← Previous
                        </button>
                        <button
                            onClick={() => changeSlide(currentSlide + 1)}
                            disabled={currentSlide >= pdfDocument.numPages}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 active:scale-95 transition-transform min-h-[44px]"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {/* Canvas Area - mobile optimized */}
            <div 
                className="flex-1 bg-gray-900 flex justify-center items-center overflow-auto p-2 md:p-8" 
                ref={containerRef}
                onClick={handleCanvasClick}
            >
                <div className="relative shadow-2xl bg-white rounded-lg overflow-hidden w-full max-w-full" style={{ maxWidth: canvasSize.width, height: 'auto' }}>
                    <canvas 
                        ref={pdfCanvasRef} 
                        className="absolute top-0 left-0 z-0 w-full h-full"
                    />
                    <canvas 
                        ref={drawingCanvasRef}
                        className="absolute top-0 left-0 z-10 pointer-events-none w-full h-full"
                    />
                    {!pdfDocument && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-0">
                            <div className="text-center">
                                <div className="text-4xl mb-2">📝</div>
                                <div className="font-semibold">Whiteboard Recording</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Audio Element */}
            {/* FIX: Use getFileUrl for Audio */}
            <audio 
                ref={audioRef} 
                src={getFileUrl(lesson.audio_url)} 
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                    console.error("Audio playback error:", e);
                    alert('Failed to load audio. Please check the file format.');
                }}
                className="hidden"
            />
        </div>
    );
};

export default LessonPlayer;
