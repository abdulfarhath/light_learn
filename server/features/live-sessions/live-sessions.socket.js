const fs = require('fs');
const path = require('path');
const transcriptionService = require('./transcription.service');

/**
 * Live Sessions Socket Handler
 * Handles real-time communication for live classes
 */

class LiveSessionsSocket {
    constructor() {
        this.attendanceLog = {};
        this.activeRecordings = {}; // room -> { eventStream, audioStream, startTime, id }
        this.storageDir = path.join(__dirname, '../../storage/recordings');
        this.io = null; // Store io reference for async operations
    }

    /**
     * Initialize socket handlers
     */
    init(io) {
        this.io = io; // Store for async operations

        io.on('connection', (socket) => {
            console.log(`User Connected: ${socket.id}`);
            this.attendanceLog[socket.id] = { joinTime: Date.now() };

            // Room management
            socket.on('join_room', (data) => {
                socket.join(data.room);
                console.log(`${data.username} (${data.role}) joined ${data.room}`);
                
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

            socket.on('stop_recording', async (data) => {
                const { room } = data;
                const rec = this.activeRecordings[room];
                if (!rec) return;

                const sessionId = rec.id;
                console.log(`Stopped recording for room ${room}, session: ${sessionId}`);

                rec.eventStream.end();
                rec.audioStream.end();
                delete this.activeRecordings[room];

                // Notify recording stopped
                io.to(room).emit('recording_status', { isRecording: false });

                // Emit session ended with sessionId for processing
                io.to(room).emit('session_ended', {
                    sessionId,
                    room,
                    message: 'Recording stopped. Processing transcription...'
                });

                // Process transcription asynchronously
                try {
                    console.log(`Starting transcription for session: ${sessionId}`);
                    io.to(room).emit('transcription_status', {
                        status: 'processing',
                        sessionId,
                        message: 'Transcribing audio...'
                    });

                    const result = await transcriptionService.processSession(sessionId);

                    console.log(`Transcription complete for session: ${sessionId}`);
                    io.to(room).emit('transcription_complete', {
                        sessionId,
                        transcription: result.transcription,
                        summary: result.summary,
                        mock: result.mock
                    });

                } catch (error) {
                    console.error(`Transcription failed for session ${sessionId}:`, error.message);
                    io.to(room).emit('transcription_error', {
                        sessionId,
                        error: error.message
                    });
                }
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
