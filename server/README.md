# JWT Authentication API

This server now includes JWT-based authentication for teachers and students.

## Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**
Copy `.env.example` to `.env` and update with your PostgreSQL credentials:
```bash
cp .env.example .env
```

3. **Setup Database**
```bash
./setup-db.sh
```

Or manually:
```bash
psql -U postgres -c "CREATE DATABASE learning_platform;"
psql -U postgres -d learning_platform -f database/schema.sql
```

4. **Start Server**
```bash
npm run dev  # Development mode with nodemon
npm start    # Production mode
```

## API Endpoints

### Authentication

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "teacher"  // or "student"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "teacher@example.com",
    "full_name": "John Doe",
    "role": "teacher"
  }
}
```

#### Get Current User Profile
```bash
GET /api/auth/me
Authorization: Bearer <your_jwt_token>
```

### User Routes (Protected)

#### Get User Profile
```bash
GET /api/users/profile
Authorization: Bearer <your_jwt_token>
```

#### Get All Teachers (Teacher Only)
```bash
GET /api/users/teachers
Authorization: Bearer <teacher_jwt_token>
```

#### Get All Students (Teacher Only)
```bash
GET /api/users/students
Authorization: Bearer <teacher_jwt_token>
```

## Testing with cURL

### Register a Teacher
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@example.com",
    "password": "Teacher@123",
    "full_name": "John Teacher",
    "role": "teacher"
  }'
```

### Register a Student
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student1@example.com",
    "password": "Student@123",
    "full_name": "Jane Student",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@example.com",
    "password": "Teacher@123"
  }'
```

### Access Protected Route
```bash
# Replace <TOKEN> with the token from login response
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

## Project Structure

```
server/
├── config/
│   └── database.js       # PostgreSQL connection pool
├── database/
│   └── schema.sql        # Database schema
├── middleware/
│   └── auth.js           # JWT authentication & authorization
├── routes/
│   ├── auth.js           # Authentication routes
│   └── users.js          # User management routes
├── .env                  # Environment variables (gitignored)
├── .env.example          # Environment template
├── index.js              # Main server file
├── setup-db.sh           # Database setup script
└── package.json
```

## Environment Variables

- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: learning_platform)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRES_IN` - Token expiration time (default: 24h)
- `PORT` - Server port (default: 3001)
