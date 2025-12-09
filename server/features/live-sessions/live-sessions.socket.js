const fs = require('fs');
const path = require('path');
const liveSessionsService = require('./live-sessions.service');

/**
 * Live Sessions Socket Handler
 * Handles real-time communication for live classes
 */

class LiveSessionsSocket {
    constructor() {
        this.attendanceLog = {};
        this.activeRecordings = {}; // room -> { eventStream, audioStream, startTime }
        this.storageDir = path.join(__dirname, '../../storage/recordings');
    }

    /**
     * Initialize socket handlers
     */
    init(io) {
        io.on('connection', (socket) => {
            console.log(`User Connected: ${socket.id}`);
            this.attendanceLog[socket.id] = { joinTime: Date.now() };

            // Room management
            socket.on('join_room', async (data) => {
                socket.join(data.room);
                console.log(`${data.username} (${data.role}) joined ${data.room}`);

                // Get or create session state and send to joining user
                try {
                    const sessionState = await liveSessionsService.getOrCreateSession(
                        data.room,
                        data.role === 'teacher' ? data.userId : null
                    );

                    // Send current focus timer state to the joining user
                    socket.emit('focus-timer-update', {
                        time: sessionState.focus_timer_seconds,
                        isActive: sessionState.focus_timer_active
                    });

                    socket.emit('focus-visibility-update', {
                        isVisible: sessionState.focus_timer_visible
                    });
                } catch (error) {
                    console.error('Error loading session state:', error);
                }

                // Notify if recording is active
                if (this.activeRecordings[data.room]) {
                    socket.emit('recording_status', { isRecording: true });
                }
            });

            // --- RECORDING CONTROLS ---
            socket.on('start_recording', (data) => {
                const { room } = data;
                if (this.activeRecordings[room]) return;

                const timestamp = Date.now();
                const sessionId = `${room}_${timestamp}`;
                
                console.log(`Started recording for room ${room}`);

                // Create streams
                const eventPath = path.join(this.storageDir, `${sessionId}.jsonl`);
                const audioPath = path.join(this.storageDir, `${sessionId}.webm`); // Storing raw chunks, usually webm/opus

                this.activeRecordings[room] = {
                    id: sessionId,
                    startTime: timestamp,
                    eventStream: fs.createWriteStream(eventPath, { flags: 'a' }),
                    audioStream: fs.createWriteStream(audioPath, { flags: 'a' })
                };

                // Notify everyone
                io.to(room).emit('recording_status', { isRecording: true });
            });

            socket.on('stop_recording', (data) => {
                const { room } = data;
                const rec = this.activeRecordings[room];
                if (!rec) return;

                console.log(`Stopped recording for room ${room}`);
                
                rec.eventStream.end();
                rec.audioStream.end();
                delete this.activeRecordings[room];

                io.to(room).emit('recording_status', { isRecording: false });
            });

            // Core relays - drawing, video, audio
            socket.on('draw_data', (data) => {
                socket.to(data.room).emit('receive_draw_data', data);
                
                // Record Event
                const rec = this.activeRecordings[data.room];
                if (rec) {
                    const event = {
                        type: 'draw',
                        timestamp: Date.now() - rec.startTime,
                        data: data
                    };
                    rec.eventStream.write(JSON.stringify(event) + '\n');
                }
            });

            socket.on('background_image', (data) => {
                socket.to(data.room).emit('receive_background_image', data.image);
                
                // Record Event
                const rec = this.activeRecordings[data.room];
                if (rec) {
                    const event = {
                        type: 'bg',
                        timestamp: Date.now() - rec.startTime,
                        data: data.image
                    };
                    rec.eventStream.write(JSON.stringify(event) + '\n');
                }
            });

            socket.on('video_frame', (data) => {
                socket.to(data.room).emit('receive_video_frame', data);
                // We do NOT record video frames to save bandwidth/storage
                // This is the "Smart" part - only audio + board
            });

            socket.on('audio_stream', (data) => {
                socket.to(data.room).emit('receive_audio_stream', data.audio);
                
                // Record Audio
                const rec = this.activeRecordings[data.room];
                if (rec) {
                    // console.log(`Writing ${data.audio.byteLength} bytes to ${data.room}`);
                    rec.audioStream.write(Buffer.from(data.audio));
                } else {
                    // console.log(`No active recording for room ${data.room}`);
                }
            });

            socket.on('send_message', (data) => {
                socket.to(data.room).emit('receive_message', data);
            });

            // Teacher controls
            socket.on('toggle_board_access', (data) => {
                socket.to(data.room).emit('board_access_changed', data.allowStudentsToDraw);
            });

            socket.on('send_quiz', (data) => {
                socket.to(data.room).emit('receive_quiz', data);
            });

            socket.on('submit_answer', (data) => {
                socket.to(data.room).emit('receive_answer', data);
            });

            // --- FOCUS MODE FEATURES ---
            socket.on('focus-timer-update', async (data) => {
                try {
                    // Persist to database
                    await liveSessionsService.updateFocusTimer(
                        data.room,
                        data.time,
                        data.isActive
                    );

                    // Broadcast to all clients in the room (including sender for confirmation)
                    io.to(data.room).emit('focus-timer-update', {
                        time: data.time,
                        isActive: data.isActive
                    });
                } catch (error) {
                    console.error('Error updating focus timer:', error);
                }
            });

            socket.on('focus-visibility-update', async (data) => {
                try {
                    // Persist to database
                    await liveSessionsService.updateFocusVisibility(
                        data.room,
                        data.isVisible
                    );

                    // Broadcast visibility toggle to all students
                    socket.to(data.room).emit('focus-visibility-update', {
                        isVisible: data.isVisible
                    });
                } catch (error) {
                    console.error('Error updating focus visibility:', error);
                }
            });

            socket.on('send-reaction', (data) => {
                // Broadcast reaction to all clients in the room
                io.to(data.room).emit('reaction-sent', {
                    emoji: data.emoji,
                    user: data.user
                });
            });

            // Disconnect
            socket.on('disconnect', () => {
                if (this.attendanceLog[socket.id]) {
                    delete this.attendanceLog[socket.id];
                }
            });
        });
    }

    /**
     * Get attendance log
     */
    getAttendance() {
        return this.attendanceLog;
    }
}

module.exports = new LiveSessionsSocket();
