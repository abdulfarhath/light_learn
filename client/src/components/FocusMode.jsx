import React, { useState, useEffect } from 'react';

const FocusMode = ({ socket, room, isTeacher }) => {
    const [focusTime, setFocusTime] = useState(25 * 60); // 25 minutes in seconds
    const [isActive, setIsActive] = useState(false);
    const [reactions, setReactions] = useState([]);
    const [showReactions, setShowReactions] = useState(true);

    useEffect(() => {
        if (!socket) return;

        socket.on('focus-timer-update', (data) => {
            setFocusTime(data.time);
            setIsActive(data.isActive);
        });

        socket.on('reaction-sent', (data) => {
            const newReaction = {
                id: Date.now() + Math.random(),
                emoji: data.emoji,
                user: data.user,
                // Restrict to 30-60% to avoid Navbar/Toolbar (left) and Video Sidebar (right)
                x: Math.random() * 30 + 30, 
            };
            setReactions(prev => [...prev, newReaction]);
            
            // Remove reaction after animation
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== newReaction.id));
            }, 3000);
        });

        return () => {
            socket.off('focus-timer-update');
            socket.off('reaction-sent');
        };
    }, [socket]);

    useEffect(() => {
        let interval;
        if (isActive && focusTime > 0) {
            interval = setInterval(() => {
                setFocusTime(prev => {
                    const newTime = prev - 1;
                    if (isTeacher && newTime >= 0) {
                        socket?.emit('focus-timer-update', { room, time: newTime, isActive: true });
                    }
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, focusTime, isTeacher, socket, room]);

    const toggleTimer = () => {
        if (isTeacher) {
            const newActive = !isActive;
            setIsActive(newActive);
            socket?.emit('focus-timer-update', { room, time: focusTime, isActive: newActive });
        }
    };

    const resetTimer = (minutes) => {
        if (isTeacher) {
            const newTime = minutes * 60;
            setFocusTime(newTime);
            setIsActive(false);
            socket?.emit('focus-timer-update', { room, time: newTime, isActive: false });
        }
    };

    const sendReaction = (emoji) => {
        socket?.emit('send-reaction', { room, emoji, user: socket.id });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (focusTime > 300) return 'text-success'; // > 5 min
        if (focusTime > 60) return 'text-warning'; // > 1 min
        return 'text-danger'; // < 1 min
    };

    return (
        <div className="fixed top-4 left-20 md:left-96 z-50 space-y-3">
            {/* Focus Timer */}
            <div className="bg-bg-panel/95 backdrop-blur-sm border border-border rounded-2xl shadow-2xl p-4 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-text-muted">Focus Timer</span>
                    {isTeacher && (
                        <button
                            onClick={() => setShowReactions(!showReactions)}
                            className="text-xs text-primary hover:text-primary-dark"
                        >
                            {showReactions ? '👁️' : '👁️‍🗨️'}
                        </button>
                    )}
                </div>
                
                <div className={`text-4xl font-bold text-center mb-3 ${getTimerColor()} transition-colors`}>
                    {formatTime(focusTime)}
                </div>

                {isTeacher ? (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <button
                                onClick={toggleTimer}
                                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                                    isActive 
                                        ? 'bg-danger/20 text-danger hover:bg-danger/30' 
                                        : 'bg-primary/20 text-primary hover:bg-primary/30'
                                }`}
                            >
                                {isActive ? '⏸️ Pause' : '▶️ Start'}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => resetTimer(15)} className="flex-1 px-2 py-1 bg-bg-dark hover:bg-bg-hover rounded text-xs text-text-main">15m</button>
                            <button onClick={() => resetTimer(25)} className="flex-1 px-2 py-1 bg-bg-dark hover:bg-bg-hover rounded text-xs text-text-main">25m</button>
                            <button onClick={() => resetTimer(45)} className="flex-1 px-2 py-1 bg-bg-dark hover:bg-bg-hover rounded text-xs text-text-main">45m</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-xs text-text-muted">
                        {isActive ? '🎯 Stay focused!' : '⏸️ Break time'}
                    </div>
                )}
            </div>

            {/* Quick Reactions */}
            <div className="bg-bg-panel/95 backdrop-blur-sm border border-border rounded-2xl shadow-2xl p-3">
                <div className="text-xs font-medium text-text-muted mb-2 text-center">Quick React</div>
                <div className="flex gap-2 justify-center">
                    {['👍', '❤️', '🤔', '✋'].map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => sendReaction(emoji)}
                            className="w-10 h-10 rounded-full bg-bg-dark hover:bg-primary/20 hover:scale-110 transition-all text-xl flex items-center justify-center"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Floating Reactions */}
            {showReactions && reactions.map((reaction) => (
                <div
                    key={reaction.id}
                    className="fixed pointer-events-none animate-float-up z-50"
                    style={{
                        left: `${reaction.x}%`,
                        bottom: '10%',
                        fontSize: '3rem',
                        animation: 'floatUp 3s ease-out forwards',
                    }}
                >
                    {reaction.emoji}
                </div>
            ))}
        </div>
    );
};

export default FocusMode;

