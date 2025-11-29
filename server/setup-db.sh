#!/bin/bash

# Database Setup Script for Learning Platform
# This script creates the database and initializes the schema

set -e  # Exit on error

echo "🔧 Setting up PostgreSQL database for Learning Platform..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  .env file not found. Using default values..."
    DB_NAME="learning_platform"
    DB_USER="postgres"
fi

echo "📦 Creating database: $DB_NAME"

# Create database (this will prompt for password if needed)
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists or creation failed"

echo "📋 Running schema migrations..."

# Run schema setup
psql -U $DB_USER -d $DB_NAME -f database/schema.sql

echo "✅ Database setup complete!"
echo ""
echo "You can now start the server with: npm run dev"
