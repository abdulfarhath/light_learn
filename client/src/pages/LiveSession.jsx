import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import useAuthStore from "../stores/authStore";
import Navbar from "../shared/components/Navbar";

const SOCKET_URL = "http://localhost:3001";

GlobalWorkerOptions.workerSrc = pdfWorker;

const socket = io.connect(SOCKET_URL, {
    transportOptions: { polling: { extraHeaders: { "ngrok-skip-browser-warning": "true" } } },
});

let audioCtx;
let nextStartTime = 0;

function LiveSession() {
    const { user } = useAuthStore();

    // --- NAVIGATION STATE ---
    const [currentView, setCurrentView] = useState("dashboard");

    // --- CLASSROOM STATE ---
    const [room, setRoom] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("student");

    const [isJoined, setIsJoined] = useState(false);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [isLive, setIsLive] = useState(false);
    const [audioActive, setAudioActive] = useState(false);

    // Tools
    const [tool, setTool] = useState("pen");
    const [penColor, setPenColor] = useState("black");
    const [bgImage, setBgImage] = useState(null);
    const [studentDrawAllowed, setStudentDrawAllowed] = useState(false);

    // Features
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // 🆕 QUIZ STATE
    const [savedQuizzes, setSavedQuizzes] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizStats, setQuizStats] = useState({ A: 0, B: 0, C: 0, D: 0 });
    const [showLaunchPad, setShowLaunchPad] = useState(false);

    // 🆕 RESOURCES STATE
    const [resourceList, setResourceList] = useState([]);
    const resourceInputRef = useRef(null);

    // 🆕 CHAT STATE
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);

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

        socket.on("resource_list_update", (list) => setResourceList(list));
        socket.on("new_resource_available", (meta) => setResourceList(prev => [...prev, meta]));
        socket.on("receive_download_data", (file) => {
            const a = document.createElement("a");
            a.href = file.dataURL;
            a.download = file.name;
            a.click();
        });

        socket.on("receive_message", (msgData) => {
            setMessages(prev => [...prev, msgData]);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => {
            socket.off('connect'); socket.off('disconnect');
            socket.off("receive_video_frame"); socket.off("receive_audio_stream");
            socket.off("receive_draw_data"); socket.off("receive_background_image");
            socket.off("receive_quiz"); socket.off("receive_answer"); socket.off("board_access_changed");
            socket.off("resource_list_update"); socket.off("new_resource_available"); socket.off("receive_download_data");
            socket.off("receive_message");
        };
    }, [isJoined, role]);

    // --- ACTIONS ---
    const handleJoin = (selectedRole) => {
        if (!room || !username) return alert("Enter Name and Room ID");
        setRole(selectedRole);
        socket.emit("join_room", { room, username, role: selectedRole });
        setIsJoined(true);
    };

    const toggleBoardAccess = () => {
        const newState = !studentDrawAllowed;
        setStudentDrawAllowed(newState);
        socket.emit("toggle_board_access", { room, allowStudentsToDraw: newState });
    };

    const saveQuiz = (e) => {
        e.preventDefault();
        const newQuiz = {
            id: Date.now(),
            question: e.target.q.value,
            options: [e.target.o1.value, e.target.o2.value, e.target.o3.value, e.target.o4.value]
        };
        setSavedQuizzes([...savedQuizzes, newQuiz]);
        e.target.reset();
        alert("Quiz Saved! You can launch it during the Live Class.");
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

    // 🆕 CHAT SENDER
    const sendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const msgData = { sender: username, text: chatInput, role: role };
        socket.emit("send_message", { room, ...msgData });
        setMessages(prev => [...prev, msgData]);
        setChatInput("");
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    // 🆕 RESOURCE ACTIONS
    const uploadResource = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const fileData = {
                name: file.name,
                type: file.type,
                size: (file.size / 1024).toFixed(1) + " KB",
                dataURL: event.target.result
            };
            socket.emit("upload_resource", fileData);
            alert("Resource Uploaded to Class!");
        };
    };

    const downloadResource = (id) => {
        // Request heavy data from server
        socket.emit("request_download", id);
    };

    // ... (Media Engine & PDF Logic preserved) ...
    const initAudioEngine = () => { if (!audioCtx) { const AudioContext = window.AudioContext || window.webkitAudioContext; audioCtx = new AudioContext(); } if (audioCtx.state === 'suspended') audioCtx.resume(); setAudioActive(true); alert("Audio Enabled!"); };
    const startLiveClass = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); if (myVideo.current) myVideo.current.srcObject = stream; setIsLive(true); setAudioActive(true); startVideoSnapshots(stream); startAudioRecorder(stream); } catch (err) { alert("Mic denied!"); } };
    const startAudioRecorder = (stream) => { if (!stream.active) return; let recorder = new MediaRecorder(stream); recorder.ondataavailable = async (e) => { if (e.data.size > 0 && socket.connected) { const ab = await e.data.arrayBuffer(); socket.emit("audio_stream", { room, audio: ab }); } }; recorder.start(); audioLoopRef.current = setTimeout(() => { if (recorder.state === "recording") recorder.stop(); if (stream.active) startAudioRecorder(stream); }, 1000); };
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

    // --- RENDER DASHBOARD/JOIN ---
    if (!isJoined) {
        if (currentView === 'dashboard') {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-bg-dark text-text-main p-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-2">👋 LightLearn LMS</h1>
                        <p className="text-text-muted">Preparation & Live Classes</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                        <div className="bg-bg-panel p-6 rounded-xl border border-border cursor-pointer hover:bg-bg-hover transition-all text-center" onClick={() => setCurrentView('join')}>
                            <h3 className="text-xl font-semibold mb-2">🏫 Enter Class</h3>
                            <p className="text-text-muted">Join live session.</p>
                        </div>
                        <div className="bg-bg-panel p-6 rounded-xl border border-border cursor-pointer hover:bg-bg-hover transition-all text-center" onClick={() => setCurrentView('quiz_prep')}>
                            <h3 className="text-xl font-semibold mb-2">📝 Quiz Prep</h3>
                            <p className="text-text-muted">Teacher Tools</p>
                        </div>
                        {/* 🆕 RESOURCES BUTTON */}
                        <div className="bg-bg-panel p-6 rounded-xl border border-border cursor-pointer hover:bg-bg-hover transition-all text-center" onClick={() => setCurrentView('resources')}>
                            <h3 className="text-xl font-semibold mb-2">📚 Resources</h3>
                            <p className="text-text-muted">Upload/Download Materials</p>
                        </div>
                    </div>
                </div>
            );
        }
        if (currentView === 'quiz_prep') {
            return (
                <div className="flex flex-col items-center min-h-screen bg-bg-dark text-text-main p-4">
                    <button className="self-start mb-6 text-text-muted hover:text-text-main" onClick={() => setCurrentView('dashboard')}>← Back</button>
                    <h2 className="text-2xl font-bold mb-6">Quiz Prep</h2>
                    <form className="bg-bg-panel p-6 rounded-xl border border-border w-full max-w-md space-y-4" onSubmit={saveQuiz}>
                        <input className="w-full bg-bg-dark border border-border rounded p-3 text-text-main" name="o4" placeholder="Option D" required />
                        <input className="w-full bg-bg-dark border border-border rounded p-3 text-white" name="o1" placeholder="Option A" required />
                        <input className="w-full bg-bg-dark border border-border rounded p-3 text-white" name="o2" placeholder="Option B" required />
                        <input className="w-full bg-bg-dark border border-border rounded p-3 text-white" name="o3" placeholder="Option C" required />
                        <input className="w-full bg-bg-dark border border-border rounded p-3 text-white" name="o4" placeholder="Option D" required />
                        <button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded transition-colors">Save</button>
                    </form>
                    <div className="bg-bg-panel p-6 rounded-xl border border-border w-full max-w-md mt-6">
                        <h3 className="text-xl font-semibold mb-4">Saved Quizzes ({savedQuizzes.length})</h3>
                        {savedQuizzes.map((q, i) => (
                            <div key={q.id} className="border-b border-border py-3 last:border-0">
                                <div className="font-medium">{i + 1}. {q.question}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 🆕 RESOURCES VIEW
        if (currentView === 'resources') {
            return (
                <div className="flex flex-col items-center min-h-screen bg-bg-dark text-text-main p-4">
                    <div className="w-full max-w-4xl flex justify-between items-center mb-8">
                        <div className="text-2xl font-bold">Class<span className="text-primary">Materials</span></div>
                        <button className="text-text-muted hover:text-text-main" onClick={() => setCurrentView('dashboard')}>Back</button>
                    </div>

                    {/* TEACHER UPLOAD */}
                    <div className="bg-bg-panel p-6 rounded-xl border border-border w-full max-w-4xl mb-8">
                        <h3 className="text-xl font-semibold mb-2">📤 Upload New Material (Teacher)</h3>
                        <p className="text-text-muted mb-4">Share PDF notes or Audio recordings.</p>
                        <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded transition-colors" onClick={() => resourceInputRef.current.click()}>Select File</button>
                        <input type="file" ref={resourceInputRef} className="hidden" onChange={uploadResource} />
                    </div>

                    {/* STUDENT LIST */}
                    <div className="w-full max-w-4xl">
                        <h2 className="text-xl font-semibold mb-4">Available Downloads</h2>
                        {resourceList.length === 0 ? <p className="text-text-muted">No resources shared yet.</p> :
                            resourceList.map(res => (
                                <div key={res.id} className="flex justify-between items-center bg-bg-panel p-4 rounded-xl border border-border mb-3">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl">📄</div>
                                        <div>
                                            <h4 className="font-medium">{res.name}</h4>
                                            <p className="text-xs text-text-muted">{res.size} • {res.type}</p>
                                        </div>
                                    </div>
                                    <button className="bg-bg-dark hover:bg-bg-hover border border-border px-4 py-2 rounded transition-colors" onClick={() => downloadResource(res.id)}>Download</button>
                                </div>
                            ))
                        }
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-bg-dark text-text-main p-4">
                <h1 className="text-3xl font-bold mb-8">Join Session</h1>
                <div className="w-full max-w-xs space-y-4">
                    <input className="w-full bg-bg-panel border border-border rounded p-3 text-text-main" placeholder="Room ID" onChange={(e) => setRoom(e.target.value)} />
                    <input className="w-full bg-bg-panel border border-border rounded p-3 text-white" placeholder="Room ID" onChange={(e) => setRoom(e.target.value)} />
                    <div className="flex gap-3">
                        <button className="flex-1 bg-bg-panel hover:bg-bg-hover border border-border py-3 rounded transition-colors" onClick={() => handleJoin('student')}>Join as Student</button>
                        <button className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded transition-colors" onClick={() => handleJoin('teacher')}>Join as Teacher</button>
                    </div>
                    <button className="w-full text-text-muted hover:text-text-main py-2" onClick={() => setCurrentView('dashboard')}>Back</button>
                </div>
            </div>
        );
    }

    // --- RENDER LIVE CLASSROOM ---
    return (
        <div className="flex h-screen bg-bg-dark text-text-main overflow-hidden">
            <div className="flex-1 relative bg-black">
                <div className="absolute inset-0">
                    {bgImage && <img src={bgImage} className="w-full h-full object-contain absolute" alt="Slide" />}
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className={`w-full h-full absolute touch-none ${canIDraw() ? (tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair') : 'cursor-not-allowed'}`}
                    />
                </div>
                {canIDraw() && (
                    <div className="absolute top-4 left-4 bg-bg-panel border border-border p-2 rounded-lg flex flex-col gap-2 shadow-lg z-10">
                        <div className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${tool === 'pen' ? 'bg-primary text-white' : 'hover:bg-bg-hover'}`} onClick={() => setTool('pen')}>✎</div>
                        <div className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${tool === 'eraser' ? 'bg-primary text-white' : 'hover:bg-bg-hover'}`} onClick={() => setTool('eraser')}>🧹</div>
                        <div className="h-px bg-border my-1"></div>
                        {['black', 'red', 'blue', 'green'].map(c => (
                            <div key={c} className={`w-6 h-6 rounded-full cursor-pointer border-2 ${penColor === c ? 'border-white' : 'border-transparent'}`} style={{ background: c }} onClick={() => { setTool('pen'); setPenColor(c) }}></div>
                        ))}
                    </div>
                )}
            </div>

            <div className="w-80 bg-bg-panel border-l border-border flex flex-col p-4 gap-4 z-20 shadow-xl">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-border">
                    <video ref={myVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs">Me ({role})</div>
                </div>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-border">
                    <img ref={userImage} className="w-full h-full object-cover" alt="Peer" />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs">Teacher Stream</div>
                </div>

                {/* 🆕 CHAT PANEL */}
                {showChat && (
                    <div className="flex-1 bg-bg-dark rounded-lg border border-border flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-2 border-b border-border bg-bg-panel">
                            <span className="text-xs font-semibold">💬 Chat</span>
                            <button onClick={() => setShowChat(false)} className="text-text-muted hover:text-text-main">×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 text-xs space-y-1">
                            {messages.map((m, i) => (
                                <div key={i} className="text-text-secondary">
                                    <b style={{ color: m.role === 'teacher' ? '#ffc107' : '#0d6efd' }}>{m.sender}:</b> {m.text}
                                </div>
                            ))}
                            <div ref={chatEndRef}></div>
                        </div>
                        <form onSubmit={sendMessage} className="p-2 border-t border-border bg-bg-panel">
                            <input className="w-full bg-bg-dark border border-border rounded px-2 py-1 text-xs text-text-main focus:outline-none focus:border-primary" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type..." />
                        </form>
                    </div>
                )}

                <div className="flex flex-col gap-2 mt-auto">
                    <button className={`w-full py-2 rounded text-sm font-medium transition-colors ${audioActive ? 'bg-success text-white' : 'bg-bg-dark border border-border hover:bg-bg-hover'}`} onClick={initAudioEngine}>
                        {audioActive ? '🎤 Audio Active' : '🔇 Enable Audio'}
                    </button>

                    {/* Everyone can start video */}
                    <button className={`w-full py-2 rounded text-sm font-medium transition-colors ${isLive ? 'bg-success text-white' : 'bg-primary hover:bg-primary-dark text-white'}`} onClick={startLiveClass} disabled={isLive}>
                        {isLive ? 'Transmitting...' : 'Start Camera & Mic'}
                    </button>

                    {role === 'teacher' && (
                        <>
                            <button className={`w-full py-2 rounded text-sm font-medium transition-colors ${studentDrawAllowed ? 'bg-danger text-white' : 'bg-success text-white'}`} onClick={toggleBoardAccess}>{studentDrawAllowed ? '🔒 Lock Board' : '🔓 Unlock Board'}</button>
                            <button className="w-full py-2 rounded text-sm font-medium bg-bg-dark border border-border hover:bg-bg-hover transition-colors" onClick={() => fileInputRef.current.click()}>⬆ Share Slide</button>
                            <input type="file" accept="image/*,application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            <button className="w-full py-2 rounded text-sm font-medium bg-primary hover:bg-primary-dark text-white transition-colors" onClick={() => setShowLaunchPad(!showLaunchPad)}>🚀 Quiz</button>
                            {showLaunchPad && (
                                <div className="bg-bg-dark p-2 rounded border border-border space-y-1">
                                    {savedQuizzes.map(q => <button key={q.id} onClick={() => launchQuiz(q)} className="w-full text-left text-xs p-2 rounded hover:bg-bg-hover truncate">▶ {q.question}</button>)}
                                </div>
                            )}
                            <div className="text-xs text-center text-text-muted">Results: A:{quizStats.A} B:{quizStats.B} C:{quizStats.C} D:{quizStats.D}</div>
                            {pdfDoc && <div className="flex gap-2"><button className="flex-1 py-1 bg-bg-dark border border-border rounded hover:bg-bg-hover text-xs" onClick={() => changePage(-1)}>Prev</button><button className="flex-1 py-1 bg-bg-dark border border-border rounded hover:bg-bg-hover text-xs" onClick={() => changePage(1)}>Next</button></div>}
                        </>
                    )}

                    <button className="w-full py-2 rounded text-sm font-medium bg-bg-dark border border-border hover:bg-bg-hover transition-colors" onClick={() => setShowChat(!showChat)}>💬 Chat</button>
                    <button className="w-full py-2 rounded text-sm font-medium bg-danger hover:bg-red-700 text-white transition-colors" onClick={() => { setIsJoined(false); setCurrentView('dashboard'); }}>Leave Class</button>
                </div>
            </div>

            {activeQuiz && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white text-black p-6 rounded-xl shadow-2xl z-50 w-80 animate-slide-up">
                    <h4 className="font-bold mb-4 text-lg">{activeQuiz.question}</h4>
                    <div className="flex flex-col gap-2">
                        {activeQuiz.options.map((opt, i) => <button key={i} onClick={() => submitAnswer(i)} className="p-3 bg-gray-100 border border-gray-200 rounded hover:bg-primary hover:text-white transition-colors text-left">{opt}</button>)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default LiveSession;