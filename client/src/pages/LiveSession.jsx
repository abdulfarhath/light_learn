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
    const { user } = useAuth(); // Get authenticated user

    // --- NAVIGATION STATE ---
    const [currentView, setCurrentView] = useState("dashboard");

    // --- CLASSROOM STATE ---
    const [room, setRoom] = useState("");
    const [username, setUsername] = useState(""); // 🆕 Added Username
    const [role, setRole] = useState("student");  // 🆕 Added Role (teacher/student)

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
                <div className="dashboard-view">
                    <div className="welcome-box"><h1>👋 LightLearn LMS</h1><p>Preparation & Live Classes</p></div>
                    <div className="grid-menu">
                        <div className="card" onClick={() => setCurrentView('join')}><h3>🏫 Enter Class</h3><p>Join live session.</p></div>
                        <div className="card" onClick={() => setCurrentView('quiz_prep')}><h3>📝 Quiz Prep</h3><p>Teacher Tools</p></div>
                        {/* 🆕 RESOURCES BUTTON */}
                        <div className="card" onClick={() => setCurrentView('resources')}><h3>📚 Resources</h3><p>Upload/Download Materials</p></div>
                    </div>
                </div>
            );
        }
        if (currentView === 'quiz_prep') {
            return ( /* ... Quiz Prep Render ... */
                <div className="dashboard-view">
                    <button className="nav-link" onClick={() => setCurrentView('dashboard')}>Back</button>
                    <h2>Quiz Prep</h2>
                    <form className="card" onSubmit={saveQuiz}>
                        <input className="join-input" name="q" placeholder="Question" required />
                        <input className="join-input" name="o1" placeholder="Option A" required />
                        <input className="join-input" name="o2" placeholder="Option B" required />
                        <input className="join-input" name="o3" placeholder="Option C" required />
                        <input className="join-input" name="o4" placeholder="Option D" required />
                        <button className="action-btn btn-primary">Save</button>
                    </form>
                    <div className="card" style={{ marginTop: '20px' }}>
                        <h3>Saved Quizzes ({savedQuizzes.length})</h3>
                        {savedQuizzes.map((q, i) => (
                            <div key={q.id} style={{ borderBottom: '1px solid #333', padding: '10px 0', width: '100%' }}>
                                <div style={{ fontWeight: 'bold' }}>{i + 1}. {q.question}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 🆕 RESOURCES VIEW
        if (currentView === 'resources') {
            return (
                <div className="dashboard-view">
                    <div className="navbar" style={{ width: '100%', marginBottom: '20px' }}>
                        <div className="logo">Class<span>Materials</span></div>
                        <button className="nav-link" onClick={() => setCurrentView('dashboard')}>Back</button>
                    </div>

                    {/* TEACHER UPLOAD */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3>📤 Upload New Material (Teacher)</h3>
                        <p>Share PDF notes or Audio recordings.</p>
                        <button className="action-btn btn-primary" onClick={() => resourceInputRef.current.click()}>Select File</button>
                        <input type="file" ref={resourceInputRef} style={{ display: 'none' }} onChange={uploadResource} />
                    </div>

                    {/* STUDENT LIST */}
                    <h2>Available Downloads</h2>
                    {resourceList.length === 0 ? <p style={{ color: '#666' }}>No resources shared yet.</p> :
                        resourceList.map(res => (
                            <div key={res.id} className="resource-item" style={{ display: 'flex', justifyContent: 'space-between', background: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333', marginBottom: '10px' }}>
                                <div className="res-info">
                                    <div className="res-icon" style={{ fontSize: '24px' }}>📄</div>
                                    <div className="res-text">
                                        <h4 style={{ margin: '0 0 4px 0' }}>{res.name}</h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{res.size} • {res.type}</p>
                                    </div>
                                </div>
                                <button className="download-btn" onClick={() => downloadResource(res.id)}>Download</button>
                            </div>
                        ))
                    }
                </div>
            );
        }

        return (
            <div className="join-container">
                <h1>Join Session</h1>
                <input className="join-input" placeholder="Name" onChange={(e) => setUsername(e.target.value)} />
                <input className="join-input" placeholder="Room ID" onChange={(e) => setRoom(e.target.value)} />
                <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '320px' }}>
                    <button className="join-button" onClick={() => handleJoin('student')}>Join as Student</button>
                    <button className="join-button" style={{ background: '#6610f2' }} onClick={() => handleJoin('teacher')}>Join as Teacher</button>
                </div>
                <button className="nav-link" style={{ marginTop: '15px', border: 'none' }} onClick={() => setCurrentView('dashboard')}>Back</button>
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

                        {/* 🆕 CHAT PANEL */}
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

                            {/* Everyone can start video */}
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
                            <button className="action-btn btn-danger" onClick={() => { setIsJoined(false); setCurrentView('dashboard'); }}>Leave Class</button>
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