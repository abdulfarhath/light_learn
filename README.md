# LightLearn

**Real-time education for low-bandwidth environments (2G/EDGE).**

LightLearn is a specialized Learning Management System (LMS) engineered to deliver real-time, interactive education on extremely slow internet connections (~15-20 kbps).

## 📚 Documentation

We have comprehensive documentation available in the `docs/` directory:

- **[Getting Started](./docs/GETTING_STARTED.md)**: Setup and installation guide.
- **[Architecture](./docs/ARCHITECTURE.md)**: Overview of the modular, feature-based architecture.
- **[API Reference](./docs/API_REFERENCE.md)**: Detailed backend API documentation.
- **[Contributing](./docs/CONTRIBUTING.md)**: Guidelines for contributors.

## ✨ Key Features

- **2G-Optimized Live Class**: Vector whiteboard, stop-motion video, and walkie-talkie audio.
- **Interactive Tools**: Smart PDF sharing, low-data quizzes.
- **Role-Based Access**: Dedicated Teacher and Student modes.
- **Offline First**: Resume-able downloads and caching.

## 🚀 Quick Start

1.  **Clone parts**:
    ```bash
    git clone https://github.com/abdulfarhath/light_learn.git
    ```
2.  **Server**: `cd server` -> `npm install` -> `npm run dev`
3.  **Client**: `cd client` -> `npm install` -> `npm run dev`

See [Getting Started](./docs/GETTING_STARTED.md) for full details.

## 🛠 Tech Stack

- **Frontend**: React (Vite), TailwindCSS
- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL
- **Others**: Simple-Peer (WebRTC), PDF.js

## License

MIT License.