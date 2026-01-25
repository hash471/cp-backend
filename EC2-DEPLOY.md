# EC2 Ubuntu Deployment Guide

## Prerequisites

- AWS EC2 instance running Ubuntu 22.04 or later
- Security group allowing inbound traffic on ports 22 (SSH), 3000 (API), and optionally 5432 (PostgreSQL)

## 1. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## 2. Install Docker and Docker Compose

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group (logout/login required)
sudo usermod -aG docker ubuntu

# Verify installation
docker --version
docker compose version
```

## 3. Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-username/cp-backend.git
cd cp-backend

# Create environment file
cp .env.production .env

# Edit with your secure credentials
nano .env
```

Update the `.env` file:
```env
DB_USERNAME=postgres
DB_PASSWORD=YourSecurePassword123!
DB_DATABASE=complaints
AUTH_CREDENTIALS=admin:YourAdminPassword,officer:YourOfficerPassword
```

## 4. Build and Run

```bash
# Build and start services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f

# View app logs only
docker compose logs -f app
```

## 5. Seed Database (First Time)

```bash
# Run seed script inside container
docker compose exec app node -e "
const { DataSource } = require('typeorm');
const { PoliceStation } = require('./dist/police-stations/entities/police-station.entity');
// Seed will run automatically on first connection with synchronize: true
console.log('Database synchronized');
"

# Or run the seed script manually
docker compose exec app npm run seed
```

Alternative - seed from host:
```bash
# Install dependencies locally and run seed
npm install
npm run seed
```

## 6. Verify Deployment

```bash
# Test API health
curl http://localhost:3000/api

# Test with authentication
curl -u admin:YourAdminPassword http://localhost:3000/api/complaints

# Access Swagger docs (from browser)
# http://your-ec2-public-ip:3000/docs
```

## 7. Useful Commands

```bash
# Stop services
docker compose down

# Stop and remove volumes (WARNING: deletes database)
docker compose down -v

# Restart services
docker compose restart

# Rebuild and restart
docker compose up -d --build

# View resource usage
docker stats

# Access PostgreSQL
docker compose exec postgres psql -U postgres -d complaints

# Access app container shell
docker compose exec app sh
```

## 8. Setup Nginx Reverse Proxy (Optional)

For production with SSL:

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/cp-backend
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and start:
```bash
sudo ln -s /etc/nginx/sites-available/cp-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 9. Setup SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## 10. Monitoring

```bash
# Check container health
docker compose ps

# Check logs for errors
docker compose logs --tail=100 app

# Check database connections
docker compose exec postgres psql -U postgres -d complaints -c "SELECT count(*) FROM pg_stat_activity;"
```

## Security Recommendations

1. **Change default credentials** - Update `.env` with strong passwords
2. **Firewall** - Only expose necessary ports (22, 80, 443)
3. **Regular updates** - Keep Docker and Ubuntu updated
4. **Backup database** - Set up regular PostgreSQL backups:

```bash
# Manual backup
docker compose exec postgres pg_dump -U postgres complaints > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | docker compose exec -T postgres psql -U postgres complaints
```

## Troubleshooting

### Container won't start
```bash
docker compose logs app
docker compose logs postgres
```

### Database connection issues
```bash
# Check if postgres is healthy
docker compose ps
docker compose exec postgres pg_isready -U postgres
```

### Port already in use
```bash
sudo lsof -i :3000
sudo lsof -i :5432
```

### Out of disk space
```bash
docker system prune -a
docker volume prune
```
