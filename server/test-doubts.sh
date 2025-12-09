#!/bin/bash

# Test script for Doubts API
# This requires the server to be running

BASE_URL="http://localhost:3001"

echo "🧪 Testing Doubts API"
echo "===================="
echo ""

# Step 1: Register and login a student
echo "1️⃣  Registering a test student..."
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doubt_student_'$(date +%s)'@example.com",
    "password": "Test@123",
    "full_name": "Doubt Test Student",
    "role": "student"
  }')

echo "Register Response: $REGISTER_RESPONSE"
echo ""

# Extract email to use for login
EMAIL="doubt_student_$(date +%s)@example.com"
echo "2️⃣  Logging in as student..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "Test@123"
  }')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from login response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo ""
echo "Token: $TOKEN"
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token. Login response:"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

# Step 3: Get existing doubts
echo "3️⃣  Fetching existing doubts..."
DOUBTS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/doubts" \
  -H "Authorization: Bearer $TOKEN")
echo "Doubts Response: $DOUBTS_RESPONSE"
echo ""

# Step 4: Create a new doubt
echo "4️⃣  Creating a new doubt..."
NEW_DOUBT=$(curl -s -X POST "${BASE_URL}/api/doubts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "What is a doubly linked list?",
    "description": "I am confused about the structure of a doubly linked list and how to traverse it.",
    "classId": ""
  }')
echo "New Doubt Response: $NEW_DOUBT"
echo ""

# Step 5: Get doubts again to verify it was created
echo "5️⃣  Fetching doubts again to verify creation..."
DOUBTS_RESPONSE_2=$(curl -s -X GET "${BASE_URL}/api/doubts" \
  -H "Authorization: Bearer $TOKEN")
echo "Doubts Response (after creation): $DOUBTS_RESPONSE_2"
echo ""

echo "✅ Test completed!"
