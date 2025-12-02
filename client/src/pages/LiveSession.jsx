import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import "../App.css";
import Navbar from "../shared/components/Navbar";
import { useAuth } from "../features/auth";

const SOCKET_URL = "http://localhost:3001";

GlobalWorkerOptions.workerSrc = pdfWorker;

const socket = io.connect(SOCKET_URL, {
    transportOptions: { polling: { extraHeaders: { "ngrok-skip-browser-warning": "true" } } },
});

let audioCtx;
let nextStartTime = 0;

function LiveSession() {
    const { user } = useAuth();

    // --- CLASSROOM STATE ---
    const [room, setRoom] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState(user?.role || "student");

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

    // QUIZ STATE
    const [savedQuizzes, setSavedQuizzes] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizStats, setQuizStats] = useState({ A: 0, B: 0, C: 0, D: 0 });
    const [showLaunchPad, setShowLaunchPad] = useState(false);

    // CHAT STATE
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

        socket.on("receive_message", (msgData) => {
            setMessages(prev => [...prev, msgData]);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => {
            socket.off('connect'); socket.off('disconnect');
            socket.off("receive_video_frame"); socket.off("receive_audio_stream");
            socket.off("receive_draw_data"); socket.off("receive_background_image");
            socket.off("receive_quiz"); socket.off("receive_answer"); socket.off("board_access_changed");
            socket.off("receive_message");
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
    const stopDrawing = (e) => { if (!canIDraw()) return; if (e.type === 'touchend') document.body.style.overflow = 'auto'; ctxRef.current.closePath(); socket.emit("draw_data", { room, x, y, y: 0, type: "end" }); };
    useEffect(() => { if (isJoined && canvasRef.current) { canvasRef.current.width = 1280; canvasRef.current.height = 720; ctxRef.current = canvasRef.current.getContext("2d"); ctxRef.current.lineCap = "round"; } }, [isJoined]);

    // --- RENDER JOIN PAGE (directly) ---
    if (!isJoined) {
        return (
            <div className="join-container">
                <h1>Join Session</h1>
                <input className="join-input" placeholder="Name" onChange={(e) => setUsername(e.target.value)} />
                <input className="join-input" placeholder="Room ID" onChange={(e) => setRoom(e.target.value)} />
                <button className="join-button" onClick={handleJoin}>
                    Join as {user?.role === 'teacher' ? 'Teacher' : 'Student'}
                </button>
            </div>
        );
    }

    // --- RENDER LIVE CLASSROOM ---
    return (
        <>
            <Navbar />
            <div className="App">
                <div className="classroom-view">
                    <div className="board-container">
                        <div className="canvas-frame">
                            {bgImage && <img src={bgImage} style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute' }} alt="Slide" />}
                            <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{ width: '100%', height: '100%', position: 'absolute', cursor: canIDraw() ? (tool === 'eraser' ? 'cell' : 'crosshair') : 'not-allowed', background: 'transparent', touchAction: 'none' }} />
                        </div>
                        {canIDraw() && (
                            <div className="floating-toolbar">
                                <div className={"tool-btn " + (tool === 'pen' ? 'active' : '')} onClick={() => setTool('pen')}>✎</div>
                                <div className={"tool-btn " + (tool === 'eraser' ? 'active' : '')} onClick={() => setTool('eraser')}>🧹</div>
                                <div style={{ height: '1px', background: '#555', margin: '5px 0' }}></div>
                                {['black', 'red', 'blue', 'green'].map(c => <div key={c} className={"color-dot " + (penColor === c ? 'active' : '')} style={{ background: c }} onClick={() => { setTool('pen'); setPenColor(c) }}></div>)}
                            </div>
                        )}
                    </div>

                    <div className="sidebar">
                        <div className="video-box">
                            <video ref={myVideo} autoPlay muted playsInline className="video-feed" />
                            <div className="label">Me ({role})</div>
                        </div>
                        <div className="video-box">
                            <img ref={userImage} className="video-feed" style={{ background: '#000' }} alt="Peer" />
                            <div className="label">Teacher Stream</div>
                        </div>

                        {showChat && (
                            <div className="chat-panel" style={{ height: '150px', background: '#222', margin: '10px 0', padding: '5px', borderRadius: '4px', border: '1px solid #444', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #444', paddingBottom: '2px', marginBottom: '5px', fontSize: '12px' }}>
                                    <span>💬 Chat</span>
                                    <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>×</button>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', fontSize: '12px' }}>
                                    {messages.map((m, i) => (
                                        <div key={i} style={{ marginBottom: '4px', color: '#ddd' }}>
                                            <b style={{ color: m.role === 'teacher' ? '#ffc107' : '#0d6efd' }}>{m.sender}:</b> {m.text}
                                        </div>
                                    ))}
                                    <div ref={chatEndRef}></div>
                                </div>
                                <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: '5px' }}>
                                    <input style={{ flex: 1, padding: '4px', borderRadius: '2px', border: 'none', background: '#111', color: 'white', fontSize: '12px' }} value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type..." />
                                </form>
                            </div>
                        )}

                        <div className="control-panel">
                            <button className={"action-btn " + (audioActive ? 'btn-success' : '')} onClick={initAudioEngine}>
                                {audioActive ? '🎤 Audio Active' : '🔇 Enable Audio'}
                            </button>

                            <button className={"action-btn " + (isLive ? 'btn-success' : 'btn-primary')} onClick={startLiveClass} disabled={isLive}>
                                {isLive ? 'Transmitting...' : 'Start Camera & Mic'}
                            </button>

                            {role === 'teacher' && (
                                <>
                                    <button className="action-btn" style={{ background: studentDrawAllowed ? '#dc3545' : '#198754' }} onClick={toggleBoardAccess}>{studentDrawAllowed ? '🔒 Lock Board' : '🔓 Unlock Board'}</button>
                                    <button className="action-btn" onClick={() => fileInputRef.current.click()}>⬆ Share Slide</button>
                                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
                                    <button className="action-btn" style={{ background: '#6610f2' }} onClick={() => setShowLaunchPad(!showLaunchPad)}>🚀 Quiz</button>
                                    {showLaunchPad && (
                                        <div style={{ background: '#222', padding: '5px', borderRadius: '4px', marginTop: '5px' }}>
                                            {savedQuizzes.map(q => <button key={q.id} onClick={() => launchQuiz(q)} style={{ width: '100%', marginBottom: '2px', padding: '4px', background: '#333', border: 'none', color: 'white', textAlign: 'left', fontSize: '10px', cursor: 'pointer' }}>▶ {q.question}</button>)}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '10px', color: '#aaa', marginTop: '5px', textAlign: 'center' }}>Results: A:{quizStats.A} B:{quizStats.B} C:{quizStats.C} D:{quizStats.D}</div>
                                    {pdfDoc && <div style={{ display: 'flex', gap: '5px' }}><button className="action-btn" style={{ flex: 1 }} onClick={() => changePage(-1)}>Prev</button><button className="action-btn" style={{ flex: 1 }} onClick={() => changePage(1)}>Next</button></div>}
                                </>
                            )}

                            <button className="action-btn" onClick={() => setShowChat(!showChat)}>💬 Chat</button>
                            <button className="action-btn btn-danger" onClick={() => setIsJoined(false)}>Leave Class</button>
                        </div>
                    </div>
                </div>

                {activeQuiz && (
                    <div style={{ position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: 'white', color: 'black', padding: '15px', borderRadius: '8px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', zIndex: 600, width: '250px' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>{activeQuiz.question}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {activeQuiz.options.map((opt, i) => <button key={i} onClick={() => submitAnswer(i)} style={{ padding: '8px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>{opt}</button>)}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default LiveSession;