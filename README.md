🎓 LightLearn 2G: The Low-Bandwidth LMS

LightLearn is a specialized Learning Management System (LMS) engineered to deliver real-time education on extremely slow internet connections (2G/EDGE speeds ~15-20 kbps).

Unlike Zoom or Google Meet which require high-speed 4G/WiFi, LightLearn uses novel compression techniques to ensure rural students never miss a class.

🚀 Key Features

1. 📡 2G-Optimized Live Class

Vector Whiteboard: Instead of streaming video, we stream mathematical coordinates (X, Y points). This uses ~0.5 kbps bandwidth.

Stop-Motion Video: Teacher video is sent as a series of 1 FPS snapshots (~4KB each), providing visual presence without the heavy data cost of streaming.

Walkie-Talkie Audio: Audio is recorded in 1-second chunks and sent as raw binary data via a server relay. This guarantees zero packet loss even on unstable networks.

2. 📚 Interactive Learning Tools

Smart PDF Sharing: Teachers upload PDFs which are converted to lightweight images locally before sending. Students download single slides on demand.

Low-Data Quizzes: Teachers can create and launch pop quizzes instantly. The entire interaction uses less data than a single SMS.

Resource Hub: A dedicated area for students to download class notes and audio replays.

3. 👥 Role-Based Access

Teacher Mode: Full control to draw, upload slides, create quizzes, and unlock the board for students.

Student Mode: Viewer-only by default to prevent chaos. Can raise hand (chat) or draw when permission is granted.

🛠️ Tech Stack

Frontend: React (Vite)

Backend: Node.js + Socket.io

Real-time Layer: WebSocket Relay (Custom binary protocol for audio/video)

PDF Engine: PDF.js (Mozilla)

🏃‍♂️ How to Run Locally

Prerequisites

Node.js installed on your machine.

1. Clone the Repository

git clone [https://github.com/abdulfarhath/light_learn.git](https://github.com/abdulfarhath/light_learn.git)
cd light_learn


2. Setup the Server

cd server
npm install
node index.js


The server will start on port 3001.

3. Setup the Client

Open a new terminal:

cd client
npm install
npm run build
npm run preview


The app will run on http://localhost:4173.

4. Testing with 2G (Optional)

To simulate the real-world experience:

Open Chrome DevTools (F12).

Go to the Network tab.

Under "Throttling", select "Slow 3G" or create a custom profile for 20kbps.

The app will continue to function smoothly!

🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements.

📜 License

This project is open-source and available under the MIT License.