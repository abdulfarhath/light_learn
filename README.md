# LightLearn 2G

LightLearn is a specialized Learning Management System (LMS) engineered to deliver real-time, interactive education on extremely slow internet connections (2G/EDGE speeds ~15-20 kbps). It features a live classroom with whiteboard, audio/video streaming, and interactive quizzes.

## Features

### 2G-Optimized Live Class:

*   **Vector Whiteboard:** Uses mathematical coordinates (~0.5 kbps) instead of video streaming for crystal clear, low-bandwidth drawing.
*   **Stop-Motion Video:** Transmits teacher video as 1 FPS snapshots (~4KB), providing visual presence without heavy data usage.
*   **Walkie-Talkie Audio:** Sends audio in 1-second raw binary chunks via a server relay to guarantee zero packet loss.

### Interactive Learning Tools:

*   **Smart PDF Sharing:** Converts PDFs to lightweight images locally before sending, allowing students to download single slides on demand.
*   **Low-Data Quizzes:** Enables teachers to create and launch instant pop quizzes with minimal data usage.
*   **Resource Hub:** Dedicated area for downloading class notes and audio replays.

### Role-Based Access:

*   **Teacher Mode:** Admin controls for drawing, uploading, quizzes, and board unlocking.
*   **Student Mode:** Viewer-optimized with hand-raising (chat) and permission-based interaction.

### Responsive Design:
*   Fully responsive UI that adapts to desktop (side-by-side view) and mobile (stacked view) layouts.

## Tech Stack

*   **Frontend Framework:** React (Vite)
*   **Styling:** CSS3 (Responsive, Dark Mode)
*   **Real-time Communication:** Socket.io & WebSocket Relay
*   **PDF Engine:** PDF.js (Mozilla)
*   **Backend:** Node.js & Express

## How to Run Locally

### Prerequisites

*   Node.js (v16 or higher) installed.

### 1. Clone the Repository

```bash
git clone https://github.com/abdulfarhath/light_learn.git
cd light_learn
```

### 2. Setup the Server

Open a terminal in the root directory:

```bash
cd server
npm install
node index.js
```

The server will start on port 3001.

### 3. Setup the Client

Open a new terminal window in the root directory:

```bash
cd client
npm install
npm run build
npm run preview
```

The app will run on http://localhost:4173.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is open-source and available under the MIT License.