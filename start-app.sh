#!/bin/bash

# Simple startup script for ChillMan app on port 5771

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_PATH="/var/www/html/chillman"
APP_PORT="5771"

echo -e "${GREEN}Starting ChillMan app on port $APP_PORT...${NC}"

# Navigate to project directory
cd "$PROJECT_PATH" || {
    echo -e "${RED}Error: Project directory not found: $PROJECT_PATH${NC}"
    exit 1
}

# Kill any existing process on the port
if lsof -ti:$APP_PORT >/dev/null 2>&1; then
    echo -e "${YELLOW}Killing existing process on port $APP_PORT...${NC}"
    kill -9 $(lsof -ti:$APP_PORT) 2>/dev/null || true
    sleep 2
fi

# Set environment variables
export NODE_ENV=development
export PORT=$APP_PORT

# Create .env file with correct port
cat > .env << EOF
NODE_ENV=development
PORT=$APP_PORT
DATABASE_URL="postgresql://postgres:Octamy#1234@127.0.0.1/chillmandb?sslmode=require&channel_binding=require"
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=Octamy#1234
PGDATABASE=chillmandb
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "fallback-session-secret-$(date +%s)")
EOF

echo -e "${GREEN}✓ Environment configured${NC}"

# Start the development server
echo -e "${GREEN}🚀 Starting npm run dev...${NC}"
npm run dev