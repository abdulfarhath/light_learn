# Getting Started with LightLearn

Welcome to LightLearn! This guide will help you set up the project locally for development.

## Prerequisites

- **Node.js**: v16 or higher
- **PostgreSQL**: Local or remote instance
- **npm**: Package manager (comes with Node.js)

## 1. Clone the Repository

```bash
git clone https://github.com/abdulfarhath/light_learn.git
cd light_learn
```

## 2. Database Setup

1.  Make sure your PostgreSQL service is running.
2.  Create a new database (e.g., `lightlearn_db`).
3.  Configure environment variables (see below).
4.  Run the database setup script (if available) or rely on migrations.

   ```bash
   cd server
   npm run db:setup 
   # Or manually create tables using the provided SQL scripts in server/database/
   ```

## 3. Server Setup

Navigate to the `server` directory:

```bash
cd server
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=3001
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lightlearn_db

# JWT Secret
JWT_SECRET=your_super_secret_key

# Optional: External Services (if used)
# OPENAI_API_KEY=...
# GEMINI_API_KEY=... 
```

### Start the Server

```bash
npm run dev
```

The server should now be running on `http://localhost:3001`.

## 4. Client Setup

Navigate to the `client` directory:

```bash
cd client
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file (or `.env.local`) in the `client` directory if needed. By default, it expects the server at `http://localhost:3001`.

```env
VITE_API_URL=http://localhost:3001/api
```

### Start the Development Server

```bash
npm run dev
```

 The client should now be running on `http://localhost:5173`.

## 5. Usage

1.  Open your browser and go to `http://localhost:5173`.
2.  **Register** a new account (Select 'Teacher' or 'Student').
3.  **Login** with your credentials.
4.  **Teachers** can create classes, start live sessions, and manage resources.
5.  **Students** can join classes using the unique class code provided by the teacher.

## Troubleshooting

- **Database Connection Error**: Double-check your `.env` DB credentials and ensure PostgreSQL is running.
- **CORS Issues**: Ensure the server is allowing the client origin.
- **Port Conflicts**: If port 3001 or 5173 is busy, change them in `.env` or `vite.config.js`.

---

For more details on the architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).
