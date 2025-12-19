# Nginx Configuration for Albero

## Installation

### 1. Copy configuration to nginx
```bash
sudo cp albero.conf /etc/nginx/sites-available/albero
sudo ln -s /etc/nginx/sites-available/albero /etc/nginx/sites-enabled/
```

### 2. Test configuration
```bash
sudo nginx -t
```

### 3. Reload nginx
```bash
sudo systemctl reload nginx
```

## SSL Certificate (Let's Encrypt)

### First time setup
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d new.albardaiforness.org
```

### Auto-renewal
Certbot automatically sets up a cron job for renewal. Check with:
```bash
sudo certbot renew --dry-run
```

## Logs

- Access log: `/var/log/nginx/albero-access.log`
- Error log: `/var/log/nginx/albero-error.log`

## Ports

- **Frontend (Next.js)**: 3301
- **Backend (Node.js API)**: 3300

## Monitoring

Check nginx status:
```bash
sudo systemctl status nginx
```

Check if ports are listening:
```bash
sudo netstat -tlnp | grep -E '3300|3301'
```

## Troubleshooting

### Check nginx error log
```bash
sudo tail -f /var/log/nginx/albero-error.log
```

### Check if services are running
```bash
pm2 list
```

### Restart services
```bash
pm2 restart albero-api
pm2 restart albero-frontend
```

