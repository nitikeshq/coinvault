#!/bin/bash

# Complete Ubuntu Server Deployment Guide for ChillMan
# Run this script on your Ubuntu server at /var/www/html/chillman

set -e

PROJECT_PATH="/var/www/html/chillman"
APP_PORT="5771"
APP_USER="www-data"

echo "🚀 Setting up ChillMan on Ubuntu Server..."

# 1. Navigate to project directory
cd "$PROJECT_PATH" || {
    echo "❌ Error: Project directory not found: $PROJECT_PATH"
    exit 1
}

# 2. Kill any existing processes
echo "🔄 Stopping existing processes..."
sudo pkill -f "node.*dev" 2>/dev/null || true
sudo pkill -f "npm.*dev" 2>/dev/null || true
sudo pkill -f "tsx.*index" 2>/dev/null || true

# 3. Create environment file with correct port
echo "⚙️ Creating environment configuration..."
cat > .env << EOF
NODE_ENV=development
PORT=$APP_PORT
DATABASE_URL=postgresql://postgres:Octamy#1234@127.0.0.1/chillmandb?sslmode=require&channel_binding=require
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=Octamy#1234
PGDATABASE=chillmandb
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "production-secret-$(date +%s)")
EOF

# 4. Set proper permissions
echo "🔒 Setting file permissions..."
sudo chown -R $APP_USER:$APP_USER "$PROJECT_PATH"
sudo chmod -R 755 "$PROJECT_PATH"

# 5. Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 6. Create systemd service file
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/chillman.service > /dev/null << EOF
[Unit]
Description=ChillMan Crypto Wallet Application
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$PROJECT_PATH
Environment=NODE_ENV=development
Environment=PORT=$APP_PORT
EnvironmentFile=$PROJECT_PATH/.env
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=chillman

[Install]
WantedBy=multi-user.target
EOF

# 7. Enable and start the service
echo "🚀 Starting ChillMan service..."
sudo systemctl daemon-reload
sudo systemctl enable chillman
sudo systemctl restart chillman

# 8. Wait for service to start
sleep 5

# 9. Check service status
if sudo systemctl is-active --quiet chillman; then
    echo "✅ ChillMan service is running!"
    echo "📊 Service status:"
    sudo systemctl status chillman --no-pager -l
else
    echo "❌ ChillMan service failed to start!"
    echo "📋 Service logs:"
    sudo journalctl -u chillman --no-pager -l
    exit 1
fi

# 10. Test the application
echo "🔍 Testing application endpoints..."
sleep 3

if curl -s http://localhost:$APP_PORT/api/website/settings > /dev/null; then
    echo "✅ API is responding on port $APP_PORT"
else
    echo "❌ API not responding on port $APP_PORT"
fi

if curl -s http://localhost:$APP_PORT/manifest.json > /dev/null; then
    echo "✅ Manifest.json is accessible"
else
    echo "❌ Manifest.json not accessible"
fi

echo ""
echo "🎉 Deployment completed!"
echo "📋 Service commands:"
echo "   sudo systemctl status chillman    # Check status"
echo "   sudo systemctl restart chillman   # Restart service"
echo "   sudo systemctl stop chillman      # Stop service"
echo "   sudo journalctl -u chillman -f    # View live logs"
echo ""
echo "🌐 Your app should now be accessible at:"
echo "   http://localhost:$APP_PORT"
echo "   https://www.ourchillman.com"