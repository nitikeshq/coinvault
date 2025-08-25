#!/bin/bash

# Quick fix for port mismatch issue
# Run this on your Ubuntu server

cd /var/www/html/chillman

echo "🔄 Stopping existing processes..."
sudo pkill -f "node" 2>/dev/null || true
sudo pkill -f "npm" 2>/dev/null || true

echo "⚙️ Setting up environment..."
export NODE_ENV=development
export PORT=5771

echo "🚀 Starting app on port 5771..."
npm run dev