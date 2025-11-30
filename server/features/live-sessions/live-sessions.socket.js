/**
 * Live Sessions Socket Handler
 * Handles real-time communication for live classes
 */

class LiveSessionsSocket {
    constructor() {
        this.attendanceLog = {};
    }

    /**
     * Initialize socket handlers
     */
    init(io) {
        io.on('connection', (socket) => {
            console.log(`User Connected: ${socket.id}`);
            this.attendanceLog[socket.id] = { joinTime: Date.now() };

            // Room management
            socket.on('join_room', (data) => {
                socket.join(data.room);
                console.log(`${data.username} (${data.role}) joined ${data.room}`);
            });

            // Core relays - drawing, video, audio
            socket.on('draw_data', (data) => {
                socket.to(data.room).emit('receive_draw_data', data);
            });

            socket.on('background_image', (data) => {
                socket.to(data.room).emit('receive_background_image', data.image);
            });

            socket.on('video_frame', (data) => {
                socket.to(data.room).emit('receive_video_frame', data);
            });

            socket.on('audio_stream', (data) => {
                socket.to(data.room).emit('receive_audio_stream', data.audio);
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
