#!/bin/bash

# ChillMan.com Setup Script for Ubuntu Server
# This script will configure and start your CryptoWallet Pro application

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_PATH="/var/www/html/chillman"
APP_PORT="5771"
NGINX_SITE="ourchillman.com"
NGINX_CONFIG="/etc/nginx/sites-available/$NGINX_SITE"
DB_URL="postgresql://postgres:Octamy#1234@127.0.0.1/chillmandb?sslmode=require&channel_binding=require"

# Logging
log_message() {
    echo -e "$1"
}

log_message "${BLUE}========================================${NC}"
log_message "${BLUE}    ChillMan.com Setup Script${NC}"
log_message "${BLUE}    Time: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
log_message "${BLUE}========================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check prerequisites
log_message "${BLUE}🔍 Checking prerequisites...${NC}"

if [[ ! -d "$PROJECT_PATH" ]]; then
    log_message "${RED}✗ Project directory not found: $PROJECT_PATH${NC}"
    exit 1
fi

if ! command_exists node; then
    log_message "${RED}✗ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    log_message "${RED}✗ npm not found. Please install npm first.${NC}"
    exit 1
fi

log_message "${GREEN}✓ Prerequisites check passed${NC}"

# Step 2: Navigate to project directory
cd "$PROJECT_PATH" || exit 1
log_message "${GREEN}✓ Changed to project directory: $PROJECT_PATH${NC}"

# Step 3: Create/update .env file
log_message "${BLUE}🔧 Setting up environment variables...${NC}"

cat > .env << EOF
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL="$DB_URL"
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=Octamy#1234
PGDATABASE=chillmandb

# Session configuration
SESSION_SECRET=$(openssl rand -base64 32)

# Add any additional environment variables here
# OPENAI_API_KEY=your_openai_key_if_needed
# OTHER_API_KEYS=your_keys_here
EOF

log_message "${GREEN}✓ .env file created/updated${NC}"

# Step 4: Install dependencies (if node_modules is missing or outdated)
log_message "${BLUE}📦 Checking dependencies...${NC}"

if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
    log_message "${YELLOW}⚠ Installing/updating dependencies...${NC}"
    npm install
    if [[ $? -eq 0 ]]; then
        log_message "${GREEN}✓ Dependencies installed successfully${NC}"
    else
        log_message "${RED}✗ Failed to install dependencies${NC}"
        exit 1
    fi
else
    log_message "${GREEN}✓ Dependencies are up to date${NC}"
fi

# Step 5: Check Vite configuration for proper binding
log_message "${BLUE}🔧 Checking Vite server configuration...${NC}"

# Check if server/vite.ts exists and is configured correctly
if [[ -f "server/vite.ts" ]]; then
    # Check if vite.ts is configured to bind to 0.0.0.0 and correct port
    if grep -q "host.*0\.0\.0\.0\|host.*true" "server/vite.ts" && grep -q "port.*$APP_PORT" "server/vite.ts"; then
        log_message "${GREEN}✓ Vite server configuration looks correct${NC}"
    else
        log_message "${YELLOW}⚠ Updating Vite server configuration...${NC}"
        
        # Create backup
        cp "server/vite.ts" "server/vite.ts.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Update vite.ts to ensure it binds to 0.0.0.0:5771
        sed -i "s/host: ['\"][^'\"]*['\"]/host: '0.0.0.0'/g" "server/vite.ts"
        sed -i "s/port: [0-9]*/port: $APP_PORT/g" "server/vite.ts"
        
        log_message "${GREEN}✓ Vite configuration updated${NC}"
    fi
else
    log_message "${YELLOW}⚠ server/vite.ts not found${NC}"
fi

# Step 6: Prepare application for development
log_message "${BLUE}🏗️ Preparing application...${NC}"

# Since we're using npm run dev, we don't need to build
# The dev server serves files directly and handles hot reload
log_message "${GREEN}✓ Will use development server (npm run dev)${NC}"

# Step 7: Update nginx configuration to proxy to development server
log_message "${BLUE}🔧 Updating nginx configuration...${NC}"

# Backup existing config
sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"

# Create new nginx config for development server
sudo tee "$NGINX_CONFIG" > /dev/null << EOF
server {
    listen 80;
    server_name ourchillman.com www.ourchillman.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Proxy everything to the development server
    # The Vite dev server handles both frontend and backend
    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        
        # Handle WebSocket connections for hot reload
        proxy_set_header Origin http://127.0.0.1:$APP_PORT;
    }
    
    # Optional: Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Test nginx configuration
if sudo nginx -t; then
    log_message "${GREEN}✓ Nginx configuration is valid${NC}"
    
    # Reload nginx
    sudo systemctl reload nginx
    log_message "${GREEN}✓ Nginx reloaded${NC}"
else
    log_message "${RED}✗ Nginx configuration error${NC}"
    log_message "${YELLOW}   Restoring backup configuration...${NC}"
    sudo cp "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)" "$NGINX_CONFIG"
    exit 1
fi

# Step 8: Check database connection
log_message "${BLUE}🗄️ Testing database connection...${NC}"

if command_exists psql; then
    if psql "$DB_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        log_message "${GREEN}✓ Database connection successful${NC}"
    else
        log_message "${YELLOW}⚠ Database connection failed, but continuing...${NC}"
        log_message "${YELLOW}   Check database credentials and ensure PostgreSQL is running${NC}"
    fi
else
    log_message "${YELLOW}⚠ psql not found, skipping database test${NC}"
fi

# Step 9: Run database migrations (if needed)
log_message "${BLUE}🗄️ Running database setup...${NC}"

if [[ -f "package.json" ]] && grep -q "db:push" package.json; then
    npm run db:push
    log_message "${GREEN}✓ Database schema updated${NC}"
else
    log_message "${YELLOW}⚠ No db:push script found, skipping database migration${NC}"
fi

# Step 10: Setup cronjob for monitoring
log_message "${BLUE}⏰ Setting up monitoring cronjob...${NC}"

# Create monitoring script
cat > "$PROJECT_PATH/monitor.sh" << 'EOF'
#!/bin/bash
# Simple monitoring script

APP_PORT=5771
PROJECT_PATH="/var/www/html/chillman"

# Check if app is running
if ! curl -f http://localhost:$APP_PORT/api/health >/dev/null 2>&1; then
    echo "$(date): App not responding, attempting restart..." >> /var/log/chillman-monitor.log
    
    # Kill existing process
    pkill -f "node.*$PROJECT_PATH"
    
    # Wait a moment
    sleep 5
    
    # Restart app
    cd "$PROJECT_PATH"
    nohup npm run dev > /var/log/chillman-app.log 2>&1 &
    
    echo "$(date): App restart attempted" >> /var/log/chillman-monitor.log
fi
EOF

chmod +x "$PROJECT_PATH/monitor.sh"

# Add to crontab (check every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * $PROJECT_PATH/monitor.sh") | crontab -

log_message "${GREEN}✓ Monitoring cronjob setup complete${NC}"

# Step 11: Kill any existing processes on the port
log_message "${BLUE}🔄 Cleaning up existing processes...${NC}"

# Kill any process using our port
if lsof -ti:$APP_PORT >/dev/null 2>&1; then
    log_message "${YELLOW}⚠ Killing existing process on port $APP_PORT${NC}"
    sudo kill -9 $(lsof -ti:$APP_PORT) 2>/dev/null || true
    sleep 2
fi

# Kill any node processes in our project directory
pkill -f "node.*$PROJECT_PATH" 2>/dev/null || true
sleep 2

log_message "${GREEN}✓ Cleanup complete${NC}"

# Step 12: Start the application
log_message "${BLUE}🚀 Starting the application...${NC}"

# Create log directory
sudo mkdir -p /var/log/chillman
sudo chown $USER:$USER /var/log/chillman

# Start the application in background
echo "Starting application on port $APP_PORT..."
nohup npm run dev > /var/log/chillman/app.log 2>&1 &
APP_PID=$!

# Wait a moment for startup
sleep 10

# Check if application is running
if kill -0 $APP_PID 2>/dev/null; then
    log_message "${GREEN}✓ Application started successfully (PID: $APP_PID)${NC}"
    
    # Test the application
    if curl -f http://localhost:$APP_PORT >/dev/null 2>&1; then
        log_message "${GREEN}✓ Application responding on port $APP_PORT${NC}"
    else
        log_message "${YELLOW}⚠ Application started but not responding yet${NC}"
        log_message "${YELLOW}   Check logs: tail -f /var/log/chillman/app.log${NC}"
    fi
else
    log_message "${RED}✗ Application failed to start${NC}"
    log_message "${YELLOW}   Check logs: tail -f /var/log/chillman/app.log${NC}"
    exit 1
fi

# Step 13: Test website accessibility
log_message "${BLUE}🌐 Testing website accessibility...${NC}"

sleep 5

# Test local access
if curl -f http://localhost >/dev/null 2>&1; then
    log_message "${GREEN}✓ Website accessible locally${NC}"
else
    log_message "${YELLOW}⚠ Website not accessible locally${NC}"
fi

# Test API endpoint
if curl -f http://localhost/api/website/settings >/dev/null 2>&1; then
    log_message "${GREEN}✓ API endpoints accessible${NC}"
else
    log_message "${YELLOW}⚠ API endpoints may not be accessible${NC}"
fi

# Final summary
log_message "${BLUE}========================================${NC}"
log_message "${GREEN}🎉 Setup Complete!${NC}"
log_message "${BLUE}========================================${NC}"

echo -e "${GREEN}✅ Your application should now be running at:${NC}"
echo -e "   • http://ourchillman.com"
echo -e "   • http://www.ourchillman.com"
echo -e "   • http://localhost (for testing)"
echo ""
echo -e "${BLUE}📋 Important Information:${NC}"
echo -e "   • Application PID: $APP_PID"
echo -e "   • Application Port: $APP_PORT"
echo -e "   • Project Path: $PROJECT_PATH"
echo -e "   • Logs: /var/log/chillman/app.log"
echo -e "   • Monitor: /var/log/chillman-monitor.log"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo -e "   • View app logs: tail -f /var/log/chillman/app.log"
echo -e "   • View nginx logs: sudo tail -f /var/log/nginx/error.log"
echo -e "   • Check app status: curl http://localhost:$APP_PORT"
echo -e "   • Kill app: kill $APP_PID"
echo -e "   • Restart nginx: sudo systemctl reload nginx"
echo ""
echo -e "${YELLOW}⚠️ Note: If you want to move to PM2 later:${NC}"
echo -e "   1. Kill current process: kill $APP_PID"
echo -e "   2. Install PM2: npm install -g pm2"
echo -e "   3. Start with PM2: pm2 start npm --name chillman -- run dev"
echo ""

# Save PID for easy reference
echo $APP_PID > "$PROJECT_PATH/app.pid"
log_message "${GREEN}✓ Process ID saved to app.pid${NC}"

log_message "${BLUE}========================================${NC}"