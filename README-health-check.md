# Ubuntu Server Health Check Script

A comprehensive monitoring script for checking if your chillman.com/ourchillman.com site is running properly.

## What It Checks

✅ **Nginx Configuration**
- Service status
- Config file existence and syntax
- Domain configuration
- SSL certificates

✅ **Database Connection**
- PostgreSQL/MySQL connectivity
- Service status

✅ **Vite Configuration**
- vite.ts and vite.config.ts file checks
- Project structure validation
- Node.js dependencies

✅ **Application Process**
- Running Node.js processes
- PM2 process management (if used)

✅ **Website Availability**
- HTTP/HTTPS response testing
- Content validation
- SSL certificate expiration

✅ **System Resources**
- Disk space usage
- Memory consumption
- Load average

## Installation & Setup

1. **Download the script to your server:**
   ```bash
   wget https://your-server.com/server-health-check.sh
   # OR copy the file to your server
   ```

2. **Make it executable:**
   ```bash
   chmod +x server-health-check.sh
   ```

3. **Edit configuration variables** (lines 12-20):
   ```bash
   nano server-health-check.sh
   ```
   
   Update these paths for your setup:
   ```bash
   NGINX_CONFIG_PATH="/etc/nginx/sites-available/chillman.com"
   PROJECT_PATH="/var/www/chillman.com"  # Your project location
   DB_NAME="your_database_name"          # Your database name
   DB_USER="your_db_user"                # Your database user
   ```

## Usage

### Basic Check
```bash
./server-health-check.sh
```

### Run with sudo (recommended for full system checks)
```bash
sudo ./server-health-check.sh
```

### Schedule Regular Checks (Cron)
```bash
# Edit crontab
crontab -e

# Add line to check every 30 minutes
*/30 * * * * /path/to/server-health-check.sh

# Or check every hour and email results
0 * * * * /path/to/server-health-check.sh | mail -s "Server Health Report" admin@yoursite.com
```

## Output Examples

**✅ Healthy System:**
```
========================================
    Server Health Check Started
    Time: 2024-01-15 10:30:00
========================================
✓ nginx is running
✓ Nginx config file exists
✓ Nginx configuration syntax is valid
✓ PostgreSQL database connection successful
✓ vite.ts file exists
✓ chillman.com is responding (HTTP 200)
✓ ourchillman.com is responding (HTTP 200)
🎉 All checks passed! Your site appears healthy.
```

**⚠️ Issues Found:**
```
✗ nginx is not running
✗ Database connection failed
✗ chillman.com not responding properly (HTTP 502)
⚠ Found 3 issue(s) that need attention.

🔧 Troubleshooting suggestions:
If nginx is not working:
  • sudo systemctl restart nginx
  • sudo nginx -t
```

## Logs

- All output is logged to: `/var/log/site-health-check.log`
- View recent logs: `tail -f /var/log/site-health-check.log`

## Customization

### Add Custom Checks
You can easily add your own checks by creating new functions:

```bash
check_custom_service() {
    log_message "${BLUE}🔍 Checking custom service...${NC}"
    
    if your_custom_check; then
        log_message "${GREEN}✓ Custom service is working${NC}"
        return 0
    else
        log_message "${RED}✗ Custom service failed${NC}"
        return 1
    fi
}
```

### Modify Domains
Change the domain variables:
```bash
DOMAIN_PRIMARY="yourdomain.com"
DOMAIN_SECONDARY="www.yourdomain.com"
```

### Database Type
The script auto-detects PostgreSQL and MySQL. For other databases, modify the `test_database()` function.

## Troubleshooting

### Permission Issues
```bash
# Make sure the script can access log files
sudo chmod 755 /var/log/
sudo touch /var/log/site-health-check.log
sudo chmod 644 /var/log/site-health-check.log
```

### Nginx Issues
```bash
# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Database Issues
```bash
# PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -l

# MySQL
sudo systemctl status mysql
mysql -u root -p -e "SHOW DATABASES;"
```

### Application Issues
```bash
# Check running processes
ps aux | grep node

# Check application logs
pm2 logs  # If using PM2
```

## Integration with Monitoring Tools

### Send to Slack
```bash
# Add to the end of main() function
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"Server Health: $health_status\"}" \
  YOUR_SLACK_WEBHOOK_URL
```

### Email Notifications
```bash
# Install mail utils
sudo apt install mailutils

# Run with email
./server-health-check.sh | mail -s "Health Check" admin@yoursite.com
```

### Integration with Nagios/Zabbix
The script returns appropriate exit codes for monitoring systems:
- 0: All checks passed
- 1: Issues found

## Security Notes

- The script needs sudo access for some system checks
- Database credentials should be properly secured
- Consider running with limited permissions where possible
- Review the script before running in production

## Support

For issues or improvements, check:
1. Script permissions and paths
2. System logs for detailed error messages
3. Network connectivity and DNS resolution
4. Firewall and security group settings