🎓 LightLearn 2G: The Ultra-Low Bandwidth LMS

LightLearn is a specialized Learning Management System (LMS) engineered to deliver real-time, interactive education on extremely slow internet connections (2G/EDGE speeds ~15-20 kbps).

Unlike standard video conferencing tools (Zoom, Google Meet) which require high-speed 4G/WiFi, LightLearn uses novel compression techniques to ensure rural students never miss a class due to poor connectivity.

🚀 Key Features

1. 📡 2G-Optimized Live Class

Vector Whiteboard: Instead of streaming a video of the screen, LightLearn streams mathematical coordinates (X, Y points). This reduces bandwidth usage to ~0.5 kbps while maintaining infinite resolution.

Stop-Motion Video: Teacher video is transmitted as a series of 1 FPS snapshots (~4KB each). This provides visual presence without the heavy data cost of continuous video streaming.

Walkie-Talkie Audio: Audio is recorded in 1-second chunks and sent as raw binary data via a server relay. This robust "store-and-forward" mechanism guarantees zero packet loss, ensuring clear voice even on unstable networks.

2. 📚 Interactive Learning Tools

Smart PDF Sharing: Teachers upload PDFs which are converted to lightweight images locally before sending. Students download single slides on demand, saving massive amounts of data.

Low-Data Quizzes: Teachers can create and launch pop quizzes instantly. The entire interaction uses less data than a single SMS text message.

Resource Hub: A dedicated area for students to download class notes and access audio replays of past lectures.

3. 👥 Role-Based Access Control

Teacher Mode: Full administrative control to draw on the board, upload slides, create quizzes, and manage permissions (e.g., unlocking the board for students).

Student Mode: optimized for viewing. Students can raise their hand (chat), answer quizzes, and draw on the board only when permission is explicitly granted by the teacher.

🛠️ Tech Stack

Frontend: React (Vite)

Backend: Node.js + Socket.io

Real-time Layer: WebSocket Relay (Custom binary protocol for audio/video)

PDF Engine: PDF.js (Mozilla)

Styling: CSS3 (Responsive, Dark Mode)

🏃‍♂️ How to Run Locally

Prerequisites

Node.js (v16 or higher) installed on your machine.

1. Clone the Repository

git clone [https://github.com/abdulfarhath/light_learn.git](https://github.com/abdulfarhath/light_learn.git)
cd light_learn


2. Setup the Server

Open a terminal in the root directory:

cd server
npm install
node index.js


The server will start on port 3001.

3. Setup the Client

Open a new terminal window in the root directory:

cd client
npm install
npm run build
npm run preview


The app will run on http://localhost:4173.

4. Testing 2G Conditions (Optional)

To simulate the real-world experience of a rural user:

Open Chrome DevTools (F12).

Go to the Network tab.

Under the "No throttling" dropdown, select "Slow 3G" or create a custom profile for 20kbps.

Interact with the app—you will see it continues to function smoothly!

🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

📜 License

This project is open-source and available under the MIT License.