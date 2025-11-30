# Backend API Documentation

Complete list of all available APIs in the LightLearn platform backend.

**Base URL:** `http://localhost:3001/api`

---

## 🔐 Authentication APIs

### 1. Register User
**Endpoint:** `POST /auth/register`  
**Access:** Public  
**Description:** Register a new user (teacher or student)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "teacher"  // or "student"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "teacher",
    "created_at": "2025-11-29T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Validation error (invalid email, password too short, etc.)
- `409` - User already exists
- `500` - Server error

---

### 2. Login User
**Endpoint:** `POST /auth/login`  
**Access:** Public  
**Description:** Login and receive JWT token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "teacher"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid credentials
- `500` - Server error

---

### 3. Get Current User Profile
**Endpoint:** `GET /auth/me`  
**Access:** Private (requires JWT token)  
**Description:** Get authenticated user's profile

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "teacher",
    "created_at": "2025-11-29T10:30:00Z"
  }
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Invalid/expired token
- `404` - User not found
- `500` - Server error

---

## 👥 User Management APIs

### 4. Get User Profile
**Endpoint:** `GET /users/profile`  
**Access:** Private  
**Description:** Get authenticated user's profile (same as /auth/me)

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "teacher",
    "created_at": "2025-11-29T10:30:00Z"
  }
}
```

---

### 5. Get All Teachers
**Endpoint:** `GET /users/teachers`  
**Access:** Private - Teacher only  
**Description:** Get list of all teachers

**Headers:**
```
Authorization: Bearer <teacher_jwt_token>
```

**Success Response (200):**
```json
{
  "teachers": [
    {
      "id": 1,
      "email": "teacher1@example.com",
      "full_name": "John Teacher",
      "created_at": "2025-11-29T10:30:00Z"
    },
    {
      "id": 2,
      "email": "teacher2@example.com",
      "full_name": "Jane Teacher",
      "created_at": "2025-11-29T11:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Not a teacher
- `500` - Server error

---

### 6. Get All Students
**Endpoint:** `GET /users/students`  
**Access:** Private - Teacher only  
**Description:** Get list of all students

**Headers:**
```
Authorization: Bearer <teacher_jwt_token>
```

**Success Response (200):**
```json
{
  "students": [
    {
      "id": 3,
      "email": "student1@example.com",
      "full_name": "Bob Student",
      "created_at": "2025-11-29T10:45:00Z"
    }
  ]
}
```

---

## 🎓 Class Management APIs

### 7. Create Class
**Endpoint:** `POST /classes/create`  
**Access:** Private - Teacher only  
**Description:** Create a new class with auto-generated class code

**Headers:**
```
Authorization: Bearer <teacher_jwt_token>
```

**Request Body:**
```json
{
  "class_name": "Math 101"
}
```

**Success Response (201):**
```json
{
  "message": "Class created successfully",
  "class": {
    "id": 1,
    "class_code": "MTH4821",
    "class_name": "Math 101",
    "created_at": "2025-11-29T12:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Class name required
- `401` - Not authenticated
- `403` - Not a teacher
- `500` - Server error

---

### 8. Join Class
**Endpoint:** `POST /classes/join`  
**Access:** Private - Student only  
**Description:** Join a class using class code

**Headers:**
```
Authorization: Bearer <student_jwt_token>
```

**Request Body:**
```json
{
  "class_code": "MTH4821"
}
```

**Success Response (200):**
```json
{
  "message": "Enrolled successfully",
  "class": {
    "id": 1,
    "class_code": "MTH4821",
    "class_name": "Math 101"
  }
}
```

**Error Responses:**
- `400` - Class code required
- `401` - Not authenticated
- `403` - Not a student
- `404` - Class not found
- `409` - Already enrolled
- `500` - Server error

---

### 9. Get Teacher's Classes
**Endpoint:** `GET /classes/my-classes`  
**Access:** Private - Teacher only  
**Description:** Get all classes created by the teacher with student counts

**Headers:**
```
Authorization: Bearer <teacher_jwt_token>
```

**Success Response (200):**
```json
{
  "classes": [
    {
      "id": 1,
      "class_code": "MTH4821",
      "class_name": "Math 101",
      "teacher_id": 1,
      "created_at": "2025-11-29T12:00:00Z",
      "student_count": "5"
    },
    {
      "id": 2,
      "class_code": "PHY2341",
      "class_name": "Physics A",
      "teacher_id": 1,
      "created_at": "2025-11-29T13:00:00Z",
      "student_count": "3"
    }
  ]
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Not a teacher
- `500` - Server error

---

### 10. Get Student's Enrolled Classes
**Endpoint:** `GET /classes/enrolled`  
**Access:** Private - Student only  
**Description:** Get all classes the student is enrolled in

**Headers:**
```
Authorization: Bearer <student_jwt_token>
```

**Success Response (200):**
```json
{
  "classes": [
    {
      "id": 1,
      "class_code": "MTH4821",
      "class_name": "Math 101",
      "teacher_id": 1,
      "teacher_name": "John Teacher",
      "created_at": "2025-11-29T12:00:00Z",
      "enrolled_at": "2025-11-29T14:00:00Z",
      "student_count": "5"
    }
  ]
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Not a student
- `500` - Server error

---

### 11. Get Class Details
**Endpoint:** `GET /classes/:id`  
**Access:** Private  
**Description:** Get detailed information about a specific class

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**URL Parameters:**
- `id` (integer) - Class ID

**Example:** `GET /classes/1`

**Success Response (200):**
```json
{
  "class": {
    "id": 1,
    "class_code": "MTH4821",
    "class_name": "Math 101",
    "teacher_id": 1,
    "teacher_name": "John Teacher",
    "created_at": "2025-11-29T12:00:00Z",
    "student_count": "5"
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `404` - Class not found
- `500` - Server error

---

### 12. Get Class Students
**Endpoint:** `GET /classes/:id/students`  
**Access:** Private - Teacher only (must own the class)  
**Description:** Get all students enrolled in a specific class

**Headers:**
```
Authorization: Bearer <teacher_jwt_token>
```

**URL Parameters:**
- `id` (integer) - Class ID

**Example:** `GET /classes/1/students`

**Success Response (200):**
```json
{
  "students": [
    {
      "id": 3,
      "full_name": "Bob Student",
      "email": "student1@example.com",
      "enrolled_at": "2025-11-29T14:00:00Z"
    },
    {
      "id": 4,
      "full_name": "Alice Student",
      "email": "student2@example.com",
      "enrolled_at": "2025-11-29T14:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Not a teacher or doesn't own this class
- `500` - Server error

---

## 🏥 Health Check API

### 13. Health Check
**Endpoint:** `GET /health`  
**Access:** Public  
**Description:** Check if server is running

**Success Response (200):**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

## 🔑 Authentication Notes

### Using JWT Tokens

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiration

- Default expiration: 24 hours
- Tokens are automatically validated on each request
- Expired tokens return `403 Forbidden`

### Role-Based Access

- **Teacher-only endpoints:** Will return `403` if accessed by students
- **Student-only endpoints:** Will return `403` if accessed by teachers
- **Private endpoints:** Require valid JWT token for any role

---

## 📝 Common Error Responses

### 400 Bad Request
```json
{
  "errors": [
    {
      "msg": "Valid email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

Or for role-based access:
```json
{
  "error": "Access denied. Insufficient permissions.",
  "required": ["teacher"],
  "current": "student"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "User with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Server error during registration"
}
```

---

## 🧪 Testing with cURL

### Example: Complete Flow

```bash
# 1. Register a teacher
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "teacher123",
    "full_name": "John Teacher",
    "role": "teacher"
  }'

# 2. Login as teacher
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "teacher123"
  }'

# Save the token from response

# 3. Create a class
curl -X POST http://localhost:3001/api/classes/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -d '{
    "class_name": "Math 101"
  }'

# 4. Register a student
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "student123",
    "full_name": "Bob Student",
    "role": "student"
  }'

# 5. Login as student
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "student123"
  }'

# 6. Join the class
curl -X POST http://localhost:3001/api/classes/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -d '{
    "class_code": "MTH4821"
  }'

# 7. Get enrolled classes
curl -X GET http://localhost:3001/api/classes/enrolled \
  -H "Authorization: Bearer <STUDENT_TOKEN>"
```

---

## 📊 API Summary Table

| # | Endpoint | Method | Access | Description |
|---|----------|--------|--------|-------------|
| 1 | `/auth/register` | POST | Public | Register new user |
| 2 | `/auth/login` | POST | Public | Login user |
| 3 | `/auth/me` | GET | Private | Get current user |
| 4 | `/users/profile` | GET | Private | Get user profile |
| 5 | `/users/teachers` | GET | Teacher | List all teachers |
| 6 | `/users/students` | GET | Teacher | List all students |
| 7 | `/classes/create` | POST | Teacher | Create new class |
| 8 | `/classes/join` | POST | Student | Join class |
| 9 | `/classes/my-classes` | GET | Teacher | Get teacher's classes |
| 10 | `/classes/enrolled` | GET | Student | Get enrolled classes |
| 11 | `/classes/:id` | GET | Private | Get class details |
| 12 | `/classes/:id/students` | GET | Teacher | Get class students |
| 13 | `/health` | GET | Public | Health check |

---

## 🚀 Ready for Frontend Integration

All APIs are:
- ✅ Fully functional
- ✅ Role-based access control implemented
- ✅ Input validation in place
- ✅ Error handling complete
- ✅ JWT authentication ready
- ✅ CORS enabled

You can now build the frontend using these endpoints!
