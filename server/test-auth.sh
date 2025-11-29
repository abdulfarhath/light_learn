#!/bin/bash

# Quick test script for JWT Authentication API
# This script tests all authentication endpoints

echo "🧪 Testing JWT Authentication API"
echo "=================================="
echo ""

BASE_URL="http://localhost:3001"

# Check if server is running
echo "1️⃣  Checking if server is running..."
if ! curl -s "${BASE_URL}/api/health" > /dev/null 2>&1; then
    echo "❌ Server is not running!"
    echo"   Start the server first with: npm run dev"
    exit 1
fi
echo "✅ Server is running"
echo ""

# Test 1: Register Teacher
echo "2️⃣  Testing Teacher Registration..."
TEACHER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher_test@example.com",
    "password": "Teacher@123",
    "full_name": "Test Teacher",
    "role": "teacher"
  }')
echo "Response: $TEACHER_RESPONSE"
echo ""

# Test 2: Register Student
echo "3️⃣  Testing Student Registration..."
STUDENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student_test@example.com",
    "password": "Student@123",
    "full_name": "Test Student",
    "role": "student"
  }')
echo "Response: $STUDENT_RESPONSE"
echo ""

# Test 3: Login as Teacher
echo "4️⃣  Testing Teacher Login..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher_test@example.com",
    "password": "Teacher@123"
  }')
echo "$LOGIN_RESPONSE"

# Extract token (requires jq)
if command -v jq &> /dev/null; then
    TEACHER_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
    echo "Token: $TEACHER_TOKEN"
else
    echo "⚠️  Install 'jq' to extract token automatically"
    echo "   For now, copy the token manually from above"
fi
echo ""

# Test 4: Access Protected Route
if [ -n "$TEACHER_TOKEN" ] && [ "$TEACHER_TOKEN" != "null" ]; then
    echo "5️⃣  Testing Protected Route (Get Current User)..."
    curl -s -X GET "${BASE_URL}/api/auth/me" \
      -H "Authorization: Bearer $TEACHER_TOKEN"
    echo ""
    echo ""

    echo "6️⃣  Testing Role-Based Access (Get Students - Teacher Only)..."
    curl -s -X GET "${BASE_URL}/api/users/students" \
      -H "Authorization: Bearer $TEACHER_TOKEN"
    echo ""
fi

echo ""
echo "✅ Testing complete!"
