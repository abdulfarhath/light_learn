import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import useAuthStore from "../stores/authStore";
import Navbar from "../shared/components/Navbar";

const SOCKET_URL = "https://8eb2acee1ab2.ngrok-free.app";

GlobalWorkerOptions.workerSrc = pdfWorker;

const socket = io.connect(SOCKET_URL, {
    transportOptions: { polling: { extraHeaders: { "ngrok-skip-browser-warning": "true" } } },
});

let audioCtx;
let nextStartTime = 0;

function LiveSession() {
    const { user } = useAuthStore();

    // --- CLASSROOM STATE ---
    const [room, setRoom] = useState("");
    const [username, setUsername] = useState(user?.full_name || "");
    const [role, setRole] = useState(user?.role || "student");

    const [isJoined, setIsJoined] = useState(false);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [isLive, setIsLive] = useState(false);
    const [audioActive, setAudioActive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // Tools
    const [tool, setTool] = useState("pen");
    const [penColor, setPenColor] = useState("black");
    const [bgImage, setBgImage] = useState(null);
    const [studentDrawAllowed, setStudentDrawAllowed] = useState(false);

    // Features
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // QUIZ STATE
    const [savedQuizzes, setSavedQuizzes] = useState([
        { id: 1, question: "What is React?", options: ["Library", "Framework", "Language", "Database"], answer: 0 },
        { id: 2, question: "What is 2+2?", options: ["3", "4", "5", "6"], answer: 1 }
    ]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizStats, setQuizStats] = useState({ A: 0, B: 0, C: 0, D: 0 });
    const [showLaunchPad, setShowLaunchPad] = useState(false);

    // CHAT STATE
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);

    // MOBILE STATE
    const [showSidebar, setShowSidebar] = useState(false);

    const myVideo = useRef(null);
    const userImage = useRef(null);
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const fileInputRef = useRef(null);
    const snapshotIntervalRef = useRef(null);
    const audioLoopRef = useRef(null);

    useEffect(() => {
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        socket.on("receive_draw_data", (data) => {
            if (!isJoined || !ctxRef.current) return;
            const { x, y, type, color, width, composite } = data;
            const ctx = ctxRef.current;
            const prevComp = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = composite || 'source-over';
            ctx.strokeStyle = color; ctx.lineWidth = width;
            if (type === "start") { ctx.beginPath(); ctx.moveTo(x, y); }
            else if (type === "draw") { ctx.lineTo(x, y); ctx.stroke(); }
            else if (type === "end") { ctx.closePath(); }
            ctx.globalCompositeOperation = prevComp;
        });

        socket.on("board_access_changed", (allowed) => {
            setStudentDrawAllowed(allowed);
            if (role === 'student') alert(allowed ? "✏️ Teacher enabled drawing!" : "🔒 Teacher locked the board.");
        });

        socket.on("receive_video_frame", (data) => { if (userImage.current && data.image) userImage.current.src = data.image; });

        socket.on("receive_audio_stream", async (ab) => {
            try {
                if (!audioCtx) return;
                const audioBuffer = await audioCtx.decodeAudioData(ab);
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);
                if (nextStartTime < audioCtx.currentTime) nextStartTime = audioCtx.currentTime;
                source.start(nextStartTime);
                nextStartTime += audioBuffer.duration;
            } catch (e) { }
        });

        socket.on("receive_background_image", (img) => { setBgImage(img); setPdfDoc(null); });
        socket.on("receive_quiz", (quiz) => setActiveQuiz(quiz));
        socket.on("receive_answer", (data) => {
            setQuizStats(prev => {
                const keys = ['A', 'B', 'C', 'D'];
                const k = keys[data.optionIndex];
                return { ...prev, [k]: prev[k] + 1 };
            });
        });

        socket.on("receive_message", (msgData) => {
            setMessages(prev => [...prev, msgData]);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        socket.on("recording_status", (data) => {
            setIsRecording(data.isRecording);
            
            // If recording started AND we are streaming audio, restart recorder to send header
            if (data.isRecording && audioLoopRef.current && myVideo.current && myVideo.current.srcObject) {
                // Stop old recorder if running
                try {
                    if (audioLoopRef.current.state !== 'inactive') {
                        audioLoopRef.current.stop();
                    }
                } catch (e) { console.error(e); }

                // Start new recorder to generate fresh header
                const stream = myVideo.current.srcObject;
                startAudioRecorder(stream);
            }
        });

        return () => {
            socket.off('connect'); socket.off('disconnect');
            socket.off("receive_video_frame"); socket.off("receive_audio_stream");
            socket.off("receive_draw_data"); socket.off("receive_background_image");
            socket.off("receive_quiz"); socket.off("receive_answer"); socket.off("board_access_changed");
            socket.off("receive_message"); socket.off("recording_status");
        };
    }, [isJoined, role]);

    // --- ACTIONS ---
    const handleJoin = () => {
        if (!room || !username) return alert("Enter Name and Room ID");
        const userRole = user?.role || "student";
        setRole(userRole);
        socket.emit("join_room", { room, username, role: userRole });
        setIsJoined(true);
    };

    const toggleBoardAccess = () => {
        const newState = !studentDrawAllowed;
        setStudentDrawAllowed(newState);
        socket.emit("toggle_board_access", { room, allowStudentsToDraw: newState });
    };

    const toggleRecording = () => {
        if (isRecording) {
            socket.emit("stop_recording", { room });
        } else {
            socket.emit("start_recording", { room });
        }
    };

    const launchQuiz = (quiz) => {
        setQuizStats({ A: 0, B: 0, C: 0, D: 0 });
        socket.emit("send_quiz", { room, ...quiz });
        setShowLaunchPad(false);
    };

    const submitAnswer = (idx) => {
        socket.emit("submit_answer", { room, optionIndex: idx });
        setActiveQuiz(null); alert("Answer Sent!");
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const msgData = { sender: username, text: chatInput, role: role };
        socket.emit("send_message", { room, ...msgData });
        setMessages(prev => [...prev, msgData]);
        setChatInput("");
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const initAudioEngine = () => { if (!audioCtx) { const AudioContext = window.AudioContext || window.webkitAudioContext; audioCtx = new AudioContext(); } if (audioCtx.state === 'suspended') audioCtx.resume(); setAudioActive(true); alert("Audio Enabled!"); };
    const startLiveClass = async () => { 
        try { 
            // OPTIMIZATION: Request low-bandwidth audio constraints
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: {
                    sampleRate: 16000, // 16kHz is sufficient for voice
                    channelCount: 1,   // Mono audio saves bandwidth
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            }); 
            if (myVideo.current) myVideo.current.srcObject = stream; 
            setIsLive(true); 
            setAudioActive(true); 
            startVideoSnapshots(stream); 
            startAudioRecorder(stream); 
        } catch (err) { 
            alert("Mic denied!"); 
        } 
    };
    const startAudioRecorder = (stream) => { 
        if (!stream.active) return; 
        
        // OPTIMIZATION: Use Opus codec with low bitrate (Target ~8-12kbps)
        const options = {
            audioBitsPerSecond: 12000, 
        };
        
        // Prefer Opus if available (Standard for high quality at low bitrate)
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            options.mimeType = "audio/webm;codecs=opus";
        }

        // Use a single recorder instance with timeslice
        const recorder = new MediaRecorder(stream, options); 
        
        recorder.ondataavailable = async (e) => { 
            if (e.data.size > 0 && socket.connected) { 
                const ab = await e.data.arrayBuffer(); 
                socket.emit("audio_stream", { room, audio: ab }); 
            } 
        }; 
        
        // Start recording and fire dataavailable every 1000ms
        // This ensures the first chunk has the header and subsequent chunks are continuous
        recorder.start(1000); 
        
        // Store recorder in ref to stop it if needed (optional but good practice)
        // We reuse audioLoopRef to store the recorder instance instead of a timeout ID
        audioLoopRef.current = recorder;
    };
    const startVideoSnapshots = (stream) => { const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 120; const ctx = canvas.getContext('2d'); snapshotIntervalRef.current = setInterval(() => { if (!myVideo.current) return; try { ctx.drawImage(myVideo.current, 0, 0, canvas.width, canvas.height); const dataURL = canvas.toDataURL('image/jpeg', 0.1); socket.emit("video_frame", { room, image: dataURL }); } catch (e) { } }, 1000); };
    const handleFileUpload = async (e) => { const file = e.target.files[0]; if (!file) return; if (file.type === "application/pdf") { const reader = new FileReader(); reader.readAsArrayBuffer(file); reader.onload = async (event) => { try { const loadingTask = getDocument(event.target.result); const pdf = await loadingTask.promise; setPdfDoc(pdf); setTotalPages(pdf.numPages); setPageNum(1); renderPdfPage(pdf, 1); } catch (err) { alert("PDF Error: " + err.message); } }; } else { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = (evt) => processAndSendImage(evt.target.result); } };
    const renderPdfPage = async (pdf, num) => { const page = await pdf.getPage(num); const viewport = page.getViewport({ scale: 1.5 }); const canvas = document.createElement("canvas"); const context = canvas.getContext("2d"); canvas.height = viewport.height; canvas.width = viewport.width; await page.render({ canvasContext: context, viewport }).promise; processAndSendImage(canvas.toDataURL("image/jpeg", 0.7)); };
    const changePage = (delta) => { if (!pdfDoc) return; const newPage = pageNum + delta; if (newPage >= 1 && newPage <= totalPages) { setPageNum(newPage); renderPdfPage(pdfDoc, newPage); } };
    const processAndSendImage = (imgSrc) => { const img = new Image(); img.src = imgSrc; img.onload = () => { const elem = document.createElement('canvas'); const scaleFactor = 800 / img.width; elem.width = 800; elem.height = img.height * scaleFactor; const ctx = elem.getContext('2d'); ctx.drawImage(img, 0, 0, elem.width, elem.height); const compressed = elem.toDataURL('image/jpeg', 0.5); setBgImage(compressed); socket.emit("background_image", { room, image: compressed }); }; };
    const getPos = (e) => { const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }; };
    const canIDraw = () => { if (role === 'teacher') return true; if (role === 'student' && studentDrawAllowed) return true; return false; };
    const startDrawing = (e) => { if (!canIDraw()) return; if (e.type === 'touchstart') document.body.style.overflow = 'hidden'; const { x, y } = getPos(e); const composite = tool === 'eraser' ? 'destination-out' : 'source-over'; const color = tool === 'eraser' ? 'rgba(0,0,0,1)' : penColor; const width = tool === 'eraser' ? 30 : 2; ctxRef.current.globalCompositeOperation = composite; ctxRef.current.strokeStyle = color; ctxRef.current.lineWidth = width; ctxRef.current.beginPath(); ctxRef.current.moveTo(x, y); socket.emit("draw_data", { room, x, y, type: "start", color, width, composite }); };
    const draw = (e) => { if (!canIDraw()) return; if (e.buttons !== 1 && e.type !== 'touchmove') return; const { x, y } = getPos(e); const composite = tool === 'eraser' ? 'destination-out' : 'source-over'; const color = tool === 'eraser' ? 'rgba(0,0,0,1)' : penColor; const width = tool === 'eraser' ? 30 : 2; ctxRef.current.globalCompositeOperation = composite; ctxRef.current.strokeStyle = color; ctxRef.current.lineWidth = width; ctxRef.current.lineTo(x, y); ctxRef.current.stroke(); socket.emit("draw_data", { room, x, y, type: "draw", color, width, composite }); };
    const stopDrawing = (e) => { if (!canIDraw()) return; if (e.type === 'touchend') document.body.style.overflow = 'auto'; ctxRef.current.closePath(); socket.emit("draw_data", { room, x: 0, y: 0, type: "end" }); };
    useEffect(() => { if (isJoined && canvasRef.current) { canvasRef.current.width = 1280; canvasRef.current.height = 720; ctxRef.current = canvasRef.current.getContext("2d"); ctxRef.current.lineCap = "round"; } }, [isJoined]);

    // --- RENDER JOIN PAGE (directly) ---
    if (!isJoined) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-bg-dark text-text-main p-4">
                <div className="w-full max-w-md bg-bg-panel p-8 rounded-xl shadow-2xl border border-border">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            {user?.role === 'teacher' ? 'Start Live Session' : 'Join Live Session'}
                        </h1>
                        <p className="text-text-muted">
                            {user?.role === 'teacher' 
                                ? 'Create a room for your students to join' 
                                : 'Enter the room ID provided by your teacher'}
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Your Name</label>
                            <input 
                                className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary" 
                                placeholder="Name" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)} 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Room ID</label>
                            <input 
                                className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary" 
                                placeholder="e.g. MATH101" 
                                value={room}
                                onChange={(e) => setRoom(e.target.value)} 
                            />
                        </div>

                        <button 
                            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg transition-colors font-bold text-lg shadow-lg mt-4" 
                            onClick={handleJoin}
                        >
                            {user?.role === 'teacher' ? '🚀 Start Session' : '👋 Join Session'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER LIVE CLASSROOM ---
    return (
        <div className="flex flex-col md:flex-row h-screen bg-bg-dark text-text-main overflow-hidden">
            {/* Mobile Controls Toggle */}
            <button
                className="md:hidden fixed top-4 right-4 z-50 bg-primary text-white p-3 rounded-full shadow-lg"
                onClick={() => setShowSidebar(!showSidebar)}
            >
                {showSidebar ? '✕' : '☰'}
            </button>

            <div className="flex-1 relative bg-black">
                <div className="absolute inset-0">
                    {bgImage && <img src={bgImage} className="w-full h-full object-contain absolute z-0" alt="Slide" />}
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className={`w-full h-full absolute z-10 touch-none ${canIDraw() ? (tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair') : 'cursor-not-allowed'}`}
                    />
                </div>
                {canIDraw() && (
                    <>
                        {/* Desktop Toolbar - Left Side */}
                        <div className="hidden md:flex absolute top-4 left-4 bg-bg-panel border border-border p-2 rounded-lg flex-col gap-2 shadow-lg z-10">
                            <div className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${tool === 'pen' ? 'bg-primary text-white' : 'hover:bg-bg-hover'}`} onClick={() => setTool('pen')}>✎</div>
                            <div className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${tool === 'eraser' ? 'bg-primary text-white' : 'hover:bg-bg-hover'}`} onClick={() => setTool('eraser')}>🧹</div>
                            <div className="h-px bg-border my-1"></div>
                            {['black', 'red', 'blue', 'green'].map(c => (
                                <div key={c} className={`w-6 h-6 rounded-full cursor-pointer border-2 ${penColor === c ? 'border-white' : 'border-transparent'}`} style={{ background: c }} onClick={() => { setTool('pen'); setPenColor(c) }}></div>
                            ))}
                        </div>

                        {/* Recording Indicator */}
                        {isRecording && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse shadow-lg z-20 flex items-center gap-2">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                REC
                            </div>
                        )}

                        {/* Mobile Toolbar - Bottom Center */}
                        <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-bg-panel border border-border p-3 rounded-full flex gap-3 shadow-lg z-10">
                            <div className={`w-11 h-11 flex items-center justify-center rounded-full cursor-pointer text-lg ${tool === 'pen' ? 'bg-primary text-white' : 'hover:bg-bg-hover'}`} onClick={() => setTool('pen')}>✎</div>
                            <div className={`w-11 h-11 flex items-center justify-center rounded-full cursor-pointer text-lg ${tool === 'eraser' ? 'bg-primary text-white' : 'hover:bg-bg-hover'}`} onClick={() => setTool('eraser')}>🧹</div>
                            <div className="w-px bg-border"></div>
                            {['black', 'red', 'blue', 'green'].map(c => (
                                <div key={c} className={`w-9 h-9 rounded-full cursor-pointer border-2 ${penColor === c ? 'border-white' : 'border-transparent'}`} style={{ background: c }} onClick={() => { setTool('pen'); setPenColor(c) }}></div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Sidebar - Desktop: Right panel, Mobile: Bottom sheet */}
            <div className={`
                fixed md:relative
                ${showSidebar ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                transition-transform duration-300 ease-in-out
                bottom-0 md:bottom-auto
                left-0 md:left-auto
                right-0 md:right-auto
                max-h-[80vh] md:max-h-none
                w-full md:w-80
                bg-bg-panel border-t md:border-l md:border-t-0 border-border
                flex flex-col p-4 gap-4 z-20 shadow-xl
                overflow-y-auto
            `}>
                {/* Video Streams - Side by side on mobile, stacked on desktop */}
                <div className="flex md:flex-col gap-2">
                    <div className="relative flex-1 md:flex-none aspect-video bg-black rounded-lg overflow-hidden border border-border">
                        <video ref={myVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                            {role === 'teacher' ? 'My Camera (Teacher)' : 'My Camera'}
                        </div>
                    </div>
                    <div className="relative flex-1 md:flex-none aspect-video bg-black rounded-lg overflow-hidden border border-border">
                        <img ref={userImage} className="w-full h-full object-cover" alt="Peer" />
                        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                            {role === 'teacher' ? 'Student Stream' : 'Teacher Stream'}
                        </div>
                    </div>
                </div>

                {/* CHAT PANEL - Full screen on mobile when open */}
                {showChat && (
                    <div className="fixed md:relative inset-0 md:inset-auto flex-1 bg-bg-dark md:rounded-lg border md:border border-border flex flex-col overflow-hidden z-30">
                        <div className="flex justify-between items-center p-3 md:p-2 border-b border-border bg-bg-panel">
                            <span className="text-sm md:text-xs font-semibold">💬 Chat</span>
                            <button onClick={() => setShowChat(false)} className="text-text-muted hover:text-text-main text-2xl md:text-xl">×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 md:p-2 text-sm md:text-xs space-y-2 md:space-y-1">
                            {messages.map((m, i) => (
                                <div key={i} className="text-text-secondary">
                                    <b style={{ color: m.role === 'teacher' ? '#ffc107' : '#0d6efd' }}>{m.sender}:</b> {m.text}
                                </div>
                            ))}
                            <div ref={chatEndRef}></div>
                        </div>
                        <form onSubmit={sendMessage} className="p-3 md:p-2 border-t border-border bg-bg-panel">
                            <input className="w-full bg-bg-dark border border-border rounded px-3 py-2 md:px-2 md:py-1 text-sm md:text-xs text-text-main focus:outline-none focus:border-primary" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type..." />
                        </form>
                    </div>
                )}

                <div className="flex flex-col gap-2 mt-auto">
                    <button className={`w-full py-3 md:py-2 rounded text-base md:text-sm font-medium transition-colors ${audioActive ? 'bg-success text-white' : 'bg-bg-dark border border-border hover:bg-bg-hover'}`} onClick={initAudioEngine}>
                        {audioActive ? '🎤 Audio Active' : '🔇 Enable Audio'}
                    </button>

                    <button className={`w-full py-3 md:py-2 rounded text-base md:text-sm font-medium transition-colors ${isLive ? 'bg-success text-white' : 'bg-primary hover:bg-primary-dark text-white'}`} onClick={startLiveClass} disabled={isLive}>
                        {isLive ? 'Transmitting...' : 'Start Camera & Mic'}
                    </button>

                    {role === 'teacher' && (
                        <>
                            <button className={`w-full py-3 md:py-2 rounded text-base md:text-sm font-medium transition-colors ${studentDrawAllowed ? 'bg-danger text-white' : 'bg-success text-white'}`} onClick={toggleBoardAccess}>{studentDrawAllowed ? '🔒 Lock Board' : '🔓 Unlock Board'}</button>
                            
                            <button className="w-full py-3 md:py-2 rounded text-base md:text-sm font-medium bg-bg-dark border border-border hover:bg-bg-hover transition-colors" onClick={() => fileInputRef.current.click()}>⬆ Share Slide</button>
                            <input type="file" accept="image/*,application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            <button className="w-full py-3 md:py-2 rounded text-base md:text-sm font-medium bg-primary hover:bg-primary-dark text-white transition-colors" onClick={() => setShowLaunchPad(!showLaunchPad)}>🚀 Quiz</button>
                            {showLaunchPad && (
                                <div className="bg-bg-dark p-2 rounded border border-border space-y-1">
                                    {savedQuizzes.map(q => <button key={q.id} onClick={() => launchQuiz(q)} className="w-full text-left text-sm md:text-xs p-2 rounded hover:bg-bg-hover truncate">▶ {q.question}</button>)}
                                </div>
                            )}
                            <div className="text-sm md:text-xs text-center text-text-muted">Results: A:{quizStats.A} B:{quizStats.B} C:{quizStats.C} D:{quizStats.D}</div>
                            {pdfDoc && <div className="flex gap-2"><button className="flex-1 py-2 md:py-1 bg-bg-dark border border-border rounded hover:bg-bg-hover text-sm md:text-xs" onClick={() => changePage(-1)}>Prev</button><button className="flex-1 py-2 md:py-1 bg-bg-dark border border-border rounded hover:bg-bg-hover text-sm md:text-xs" onClick={() => changePage(1)}>Next</button></div>}
                        </>
                    )}

                    <button className="w-full py-3 md:py-2 rounded text-base md:text-sm font-medium bg-bg-dark border border-border hover:bg-bg-hover transition-colors" onClick={() => setShowChat(!showChat)}>💬 Chat</button>
                    <button className="w-full py-3 md:py-2 rounded text-base md:text-sm font-medium bg-danger hover:bg-red-700 text-white transition-colors" onClick={() => setIsJoined(false)}>Leave Class</button>
                </div>
            </div>

            {activeQuiz && (
                <div className="absolute bottom-20 md:bottom-20 left-1/2 -translate-x-1/2 bg-white text-black p-6 md:p-6 rounded-xl shadow-2xl z-50 w-[90%] max-w-md md:w-80 animate-slide-up">
                    <h4 className="font-bold mb-4 text-lg md:text-lg">{activeQuiz.question}</h4>
                    <div className="flex flex-col gap-3 md:gap-2">
                        {activeQuiz.options.map((opt, i) => <button key={i} onClick={() => submitAnswer(i)} className="p-4 md:p-3 bg-gray-100 border border-gray-200 rounded hover:bg-primary hover:text-white transition-colors text-left text-base md:text-sm min-h-[48px]">{opt}</button>)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default LiveSession;
