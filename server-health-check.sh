#!/bin/bash

# Ubuntu Server Health Check Script for chillman.com/ourchillman.com
# This script checks nginx config, database connection, vite configs, and site availability

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Adjust these paths based on your server setup
NGINX_CONFIG_PATH="/etc/nginx/sites-available/chillman.com"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/chillman.com"
PROJECT_PATH="/var/www/chillman.com"  # Adjust to your project path
VITE_TS_PATH="$PROJECT_PATH/server/vite.ts"
VITE_CONFIG_PATH="$PROJECT_PATH/vite.config.ts"
DOMAIN_PRIMARY="chillman.com"
DOMAIN_SECONDARY="ourchillman.com"
DB_NAME="your_database_name"  # Adjust to your database name
DB_USER="your_db_user"        # Adjust to your database user

# Logging
LOG_FILE="/var/log/site-health-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    Server Health Check Started${NC}"
echo -e "${BLUE}    Time: $TIMESTAMP${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to log messages
log_message() {
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
    echo -e "$1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check service status
check_service() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        log_message "${GREEN}✓ $service is running${NC}"
        return 0
    else
        log_message "${RED}✗ $service is not running${NC}"
        return 1
    fi
}

# Function to test database connection
test_database() {
    log_message "${BLUE}🔍 Testing database connection...${NC}"
    
    if command_exists psql; then
        # PostgreSQL test
        if sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
            log_message "${GREEN}✓ PostgreSQL database connection successful${NC}"
            return 0
        else
            log_message "${RED}✗ PostgreSQL database connection failed${NC}"
            log_message "${YELLOW}   Check database name: $DB_NAME${NC}"
            return 1
        fi
    elif command_exists mysql; then
        # MySQL test
        if mysql -u "$DB_USER" -p -e "USE $DB_NAME; SELECT 1;" >/dev/null 2>&1; then
            log_message "${GREEN}✓ MySQL database connection successful${NC}"
            return 0
        else
            log_message "${RED}✗ MySQL database connection failed${NC}"
            return 1
        fi
    else
        log_message "${YELLOW}⚠ No database client found (psql/mysql)${NC}"
        return 1
    fi
}

# Function to check nginx configuration
check_nginx_config() {
    log_message "${BLUE}🔍 Checking nginx configuration...${NC}"
    
    # Check if nginx is installed
    if ! command_exists nginx; then
        log_message "${RED}✗ Nginx is not installed${NC}"
        return 1
    fi
    
    # Check nginx service
    if ! check_service nginx; then
        log_message "${YELLOW}   Attempting to start nginx...${NC}"
        if sudo systemctl start nginx; then
            log_message "${GREEN}✓ Nginx started successfully${NC}"
        else
            log_message "${RED}✗ Failed to start nginx${NC}"
            return 1
        fi
    fi
    
    # Check configuration files
    if [[ -f "$NGINX_CONFIG_PATH" ]]; then
        log_message "${GREEN}✓ Nginx config file exists: $NGINX_CONFIG_PATH${NC}"
        
        # Check if config is enabled
        if [[ -L "$NGINX_ENABLED_PATH" ]]; then
            log_message "${GREEN}✓ Nginx config is enabled${NC}"
        else
            log_message "${RED}✗ Nginx config is not enabled${NC}"
            log_message "${YELLOW}   Run: sudo ln -s $NGINX_CONFIG_PATH $NGINX_ENABLED_PATH${NC}"
        fi
        
        # Test nginx configuration syntax
        if sudo nginx -t >/dev/null 2>&1; then
            log_message "${GREEN}✓ Nginx configuration syntax is valid${NC}"
        else
            log_message "${RED}✗ Nginx configuration syntax error${NC}"
            sudo nginx -t
            return 1
        fi
        
        # Check for domain configuration
        if grep -q "$DOMAIN_PRIMARY" "$NGINX_CONFIG_PATH"; then
            log_message "${GREEN}✓ Domain $DOMAIN_PRIMARY found in nginx config${NC}"
        else
            log_message "${YELLOW}⚠ Domain $DOMAIN_PRIMARY not found in nginx config${NC}"
        fi
        
        if grep -q "$DOMAIN_SECONDARY" "$NGINX_CONFIG_PATH"; then
            log_message "${GREEN}✓ Domain $DOMAIN_SECONDARY found in nginx config${NC}"
        else
            log_message "${YELLOW}⚠ Domain $DOMAIN_SECONDARY not found in nginx config${NC}"
        fi
        
    else
        log_message "${RED}✗ Nginx config file not found: $NGINX_CONFIG_PATH${NC}"
        return 1
    fi
    
    return 0
}

# Function to check vite configuration files
check_vite_configs() {
    log_message "${BLUE}🔍 Checking Vite configuration files...${NC}"
    
    # Check if project directory exists
    if [[ ! -d "$PROJECT_PATH" ]]; then
        log_message "${RED}✗ Project directory not found: $PROJECT_PATH${NC}"
        return 1
    fi
    
    log_message "${GREEN}✓ Project directory exists: $PROJECT_PATH${NC}"
    
    # Check vite.ts
    if [[ -f "$VITE_TS_PATH" ]]; then
        log_message "${GREEN}✓ vite.ts file exists${NC}"
        
        # Check for common configuration issues
        if grep -q "host.*0\.0\.0\.0" "$VITE_TS_PATH"; then
            log_message "${GREEN}✓ vite.ts configured to listen on all interfaces${NC}"
        else
            log_message "${YELLOW}⚠ vite.ts may not be configured to listen on all interfaces${NC}"
        fi
        
        # Check port configuration
        if grep -q "port.*5000\|port.*3000" "$VITE_TS_PATH"; then
            PORT=$(grep -o "port.*[0-9]\+" "$VITE_TS_PATH" | grep -o "[0-9]\+")
            log_message "${GREEN}✓ vite.ts port configured: $PORT${NC}"
        else
            log_message "${YELLOW}⚠ Port configuration not clear in vite.ts${NC}"
        fi
        
    else
        log_message "${RED}✗ vite.ts file not found: $VITE_TS_PATH${NC}"
    fi
    
    # Check vite.config.ts
    if [[ -f "$VITE_CONFIG_PATH" ]]; then
        log_message "${GREEN}✓ vite.config.ts file exists${NC}"
        
        # Check for build configuration
        if grep -q "build" "$VITE_CONFIG_PATH"; then
            log_message "${GREEN}✓ Build configuration found in vite.config.ts${NC}"
        else
            log_message "${YELLOW}⚠ Build configuration not found in vite.config.ts${NC}"
        fi
        
    else
        log_message "${RED}✗ vite.config.ts file not found: $VITE_CONFIG_PATH${NC}"
    fi
    
    # Check if node_modules exists
    if [[ -d "$PROJECT_PATH/node_modules" ]]; then
        log_message "${GREEN}✓ node_modules directory exists${NC}"
    else
        log_message "${RED}✗ node_modules directory not found${NC}"
        log_message "${YELLOW}   Run: cd $PROJECT_PATH && npm install${NC}"
    fi
    
    # Check package.json
    if [[ -f "$PROJECT_PATH/package.json" ]]; then
        log_message "${GREEN}✓ package.json exists${NC}"
    else
        log_message "${RED}✗ package.json not found${NC}"
    fi
}

# Function to check application process
check_app_process() {
    log_message "${BLUE}🔍 Checking application process...${NC}"
    
    # Check for Node.js processes
    if pgrep -f "node\|npm\|tsx" >/dev/null; then
        PROCESSES=$(pgrep -af "node\|npm\|tsx" | head -5)
        log_message "${GREEN}✓ Node.js processes found:${NC}"
        echo "$PROCESSES" | while read -r line; do
            log_message "   $line"
        done
    else
        log_message "${RED}✗ No Node.js processes found${NC}"
        log_message "${YELLOW}   Application may not be running${NC}"
    fi
    
    # Check for PM2 processes if PM2 is installed
    if command_exists pm2; then
        PM2_PROCESSES=$(pm2 list 2>/dev/null | grep -v "│")
        if [[ -n "$PM2_PROCESSES" ]]; then
            log_message "${GREEN}✓ PM2 processes found${NC}"
        else
            log_message "${YELLOW}⚠ No PM2 processes running${NC}"
        fi
    fi
}

# Function to test website availability
test_website() {
    local domain=$1
    local protocol=$2
    
    log_message "${BLUE}🔍 Testing website: $protocol://$domain${NC}"
    
    # Test with curl
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$protocol://$domain")
    
    if [[ "$http_code" == "200" ]]; then
        log_message "${GREEN}✓ $domain is responding (HTTP $http_code)${NC}"
        
        # Test response content
        local content=$(curl -s --connect-timeout 10 --max-time 30 "$protocol://$domain" | head -c 1000)
        if [[ -n "$content" ]]; then
            if echo "$content" | grep -qi "html\|doctype"; then
                log_message "${GREEN}✓ $domain serving HTML content${NC}"
            else
                log_message "${YELLOW}⚠ $domain not serving HTML content${NC}"
            fi
        else
            log_message "${YELLOW}⚠ $domain responding but no content received${NC}"
        fi
        
        return 0
    else
        log_message "${RED}✗ $domain not responding properly (HTTP $http_code)${NC}"
        
        # Additional diagnostics
        if curl -s --connect-timeout 5 "$protocol://$domain" >/dev/null 2>&1; then
            log_message "${YELLOW}   Connection successful but wrong HTTP code${NC}"
        else
            log_message "${RED}   Connection failed - check network/DNS/firewall${NC}"
        fi
        
        return 1
    fi
}

# Function to check SSL certificates
check_ssl() {
    local domain=$1
    
    log_message "${BLUE}🔍 Checking SSL certificate for $domain...${NC}"
    
    if command_exists openssl; then
        local ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [[ -n "$ssl_info" ]]; then
            log_message "${GREEN}✓ SSL certificate found for $domain${NC}"
            
            # Check expiration
            local expiry=$(echo "$ssl_info" | grep "notAfter" | cut -d= -f2)
            if [[ -n "$expiry" ]]; then
                log_message "   Certificate expires: $expiry"
                
                # Check if expiring soon (30 days)
                local expiry_timestamp=$(date -d "$expiry" +%s 2>/dev/null)
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                if [[ $days_until_expiry -lt 30 ]]; then
                    log_message "${YELLOW}⚠ SSL certificate expires in $days_until_expiry days${NC}"
                else
                    log_message "${GREEN}✓ SSL certificate valid for $days_until_expiry days${NC}"
                fi
            fi
        else
            log_message "${RED}✗ No SSL certificate found for $domain${NC}"
        fi
    else
        log_message "${YELLOW}⚠ OpenSSL not available for SSL check${NC}"
    fi
}

# Function to check system resources
check_system_resources() {
    log_message "${BLUE}🔍 Checking system resources...${NC}"
    
    # Check disk space
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        log_message "${RED}✗ Disk space critical: ${disk_usage}% used${NC}"
    elif [[ $disk_usage -gt 80 ]]; then
        log_message "${YELLOW}⚠ Disk space warning: ${disk_usage}% used${NC}"
    else
        log_message "${GREEN}✓ Disk space OK: ${disk_usage}% used${NC}"
    fi
    
    # Check memory usage
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ $mem_usage -gt 90 ]]; then
        log_message "${RED}✗ Memory usage critical: ${mem_usage}%${NC}"
    elif [[ $mem_usage -gt 80 ]]; then
        log_message "${YELLOW}⚠ Memory usage warning: ${mem_usage}%${NC}"
    else
        log_message "${GREEN}✓ Memory usage OK: ${mem_usage}%${NC}"
    fi
    
    # Check load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | xargs)
    log_message "   Load average: $load_avg"
}

# Function to provide fix suggestions
suggest_fixes() {
    log_message "${BLUE}🔧 Troubleshooting suggestions:${NC}"
    
    echo -e "${YELLOW}If nginx is not working:${NC}"
    echo "  • sudo systemctl restart nginx"
    echo "  • sudo nginx -t  # Check config syntax"
    echo "  • sudo systemctl enable nginx"
    
    echo -e "${YELLOW}If database connection fails:${NC}"
    echo "  • sudo systemctl status postgresql"
    echo "  • sudo systemctl restart postgresql"
    echo "  • Check database credentials in your app config"
    
    echo -e "${YELLOW}If application is not running:${NC}"
    echo "  • cd $PROJECT_PATH && npm run dev"
    echo "  • pm2 start ecosystem.config.js  # If using PM2"
    echo "  • Check application logs for errors"
    
    echo -e "${YELLOW}If website is not accessible:${NC}"
    echo "  • Check firewall: sudo ufw status"
    echo "  • Check DNS resolution: nslookup $DOMAIN_PRIMARY"
    echo "  • Check port bindings: netstat -tlnp"
    
    echo -e "${YELLOW}Common commands for debugging:${NC}"
    echo "  • sudo tail -f /var/log/nginx/error.log"
    echo "  • sudo journalctl -u nginx -f"
    echo "  • pm2 logs  # If using PM2"
}

# Main execution
main() {
    # Initial system checks
    log_message "${BLUE}📋 System Information:${NC}"
    log_message "   OS: $(lsb_release -d 2>/dev/null | cut -f2 || echo 'Unknown')"
    log_message "   Uptime: $(uptime -p 2>/dev/null || uptime)"
    
    # Track overall health
    local overall_health=0
    
    # Run all checks
    check_nginx_config || ((overall_health++))
    echo ""
    
    test_database || ((overall_health++))
    echo ""
    
    check_vite_configs || ((overall_health++))
    echo ""
    
    check_app_process
    echo ""
    
    check_system_resources
    echo ""
    
    # Test both domains with HTTPS first, then HTTP
    for domain in "$DOMAIN_PRIMARY" "$DOMAIN_SECONDARY"; do
        check_ssl "$domain"
        
        if ! test_website "$domain" "https"; then
            test_website "$domain" "http" || ((overall_health++))
        fi
        echo ""
    done
    
    # Final summary
    echo -e "${BLUE}========================================${NC}"
    if [[ $overall_health -eq 0 ]]; then
        log_message "${GREEN}🎉 All checks passed! Your site appears healthy.${NC}"
    else
        log_message "${RED}⚠ Found $overall_health issue(s) that need attention.${NC}"
        echo ""
        suggest_fixes
    fi
    echo -e "${BLUE}========================================${NC}"
    
    log_message "Health check completed. Full log: $LOG_FILE"
}

# Check if running as root for some operations
if [[ $EUID -eq 0 ]]; then
    log_message "${YELLOW}⚠ Running as root. Some checks may behave differently.${NC}"
fi

# Run main function
main "$@"