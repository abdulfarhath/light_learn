# JWT Authentication System - Quick Start

## ⚠️ Important: Database Setup Required

Before testing the authentication system, you need to set up PostgreSQL.

### Option 1: Quick Setup (if PostgreSQL is installed)

1. **Update database password in `.env` file:**
   - Edit `/home/farhath/Documents/sih/server/.env`
   - Change `DB_PASSWORD=postgres` to your actual PostgreSQL password

2. **Run database setup:**
   ```bash
   cd /home/farhath/Documents/sih/server
   npm run db:setup
   ```

### Option 2: Manual PostgreSQL Setup

If you don't have PostgreSQL installed:

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# Then run database setup
cd /home/farhath/Documents/sih/server
npm run db:setup
```

### Option 3: Use Docker PostgreSQL

```bash
docker run --name learning-platform-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=learning_platform \
  -p 5432:5432 \
  -d postgres:15

# Then run database setup
cd /home/farhath/Documents/sih/server
npm run db:setup
```

## Testing the API

Once the database is set up, start the server:

```bash
npm run dev
```

### Test Registration (Teacher)
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

### Test Registration (Student)
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

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher1@example.com",
    "password": "Teacher@123"
  }'
```

Save the token from the response and use it for protected routes:

### Test Protected Route
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Role-Based Access (Teacher Only)
```bash
curl -X GET http://localhost:3001/api/users/students \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN_HERE"
```

## What Has Been Implemented

✅ **Complete JWT Authentication System:**
- User registration with email, password, and role (teacher/student)
- Secure password hashing with bcrypt
- JWT token generation and verification
- Login endpoint returning JWT tokens
- Protected routes requiring authentication
- Role-based authorization (teacher vs student access)

✅ **Database Schema:**
- PostgreSQL users table with proper indexes
- Email uniqueness constraint
- Role validation (teacher/student only)
- Automatic timestamp updates

✅ **API Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile (protected)
- `GET /api/users/profile` - Get user profile (protected)
- `GET /api/users/teachers` - List all teachers (teacher-only)
- `GET /api/users/students` - List all students (teacher-only)

✅ **Security Features:**
- Password hashing with bcrypt (10 rounds)
- JWT tokens with configurable expiration
- Input validation on all endpoints
- Role-based access control
- Secure token verification middleware

## Next Steps

After testing authentication successfully:

1. **Integrate with Frontend** - Create login/register forms that call these APIs
2. **Add More User Features** - Profile updates, password reset, etc.
3. **Build Core Platform Features** - Classes, lectures, resources, etc.
4. **Add Socket.io Authentication** - Secure real-time connections with JWT
