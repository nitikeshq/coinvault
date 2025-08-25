#!/bin/bash

# Complete Ubuntu Production Setup for ChillMan
# Fix database connection and port configuration

set -e

PROJECT_PATH="/var/www/html/chillman"
APP_PORT="5771"

echo "🔧 Configuring ChillMan for Ubuntu production..."

# Navigate to project directory
cd "$PROJECT_PATH" || {
    echo "❌ Error: Project directory not found: $PROJECT_PATH"
    exit 1
}

# Kill any existing processes
echo "🔄 Stopping existing processes..."
sudo pkill -f "node.*dev" 2>/dev/null || true
sudo pkill -f "npm.*dev" 2>/dev/null || true
sudo pkill -f "tsx.*index" 2>/dev/null || true

# Create environment file with correct database connection (no SSL for local PostgreSQL)
echo "⚙️ Creating production environment configuration..."
cat > .env << EOF
NODE_ENV=development
PORT=$APP_PORT

# Local PostgreSQL Database (no SSL)
DATABASE_URL=postgresql://postgres:Octamy#1234@127.0.0.1/chillmandb
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=Octamy#1234
PGDATABASE=chillmandb

# Security
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "production-secret-$(date +%s)")

# Development Vite settings
VITE_API_URL=http://localhost:$APP_PORT
EOF

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Push database schema (force if needed)
echo "🗃️ Syncing database schema..."
npm run db:push --force || {
    echo "⚠️ Database push failed, continuing anyway..."
}

# Set proper permissions
echo "🔒 Setting file permissions..."
sudo chown -R www-data:www-data "$PROJECT_PATH" 2>/dev/null || true
chmod -R 755 "$PROJECT_PATH"

echo "🚀 Starting ChillMan on port $APP_PORT..."

# Set environment variables and start
export NODE_ENV=development
export PORT=$APP_PORT
export DATABASE_URL="postgresql://postgres:Octamy#1234@127.0.0.1/chillmandb"

# Start the application
npm run dev