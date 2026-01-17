#!/bin/bash

# Hostinger VPS Deployment Script for Job Scraper
# Run this on your VPS as root

echo "🚀 Starting Job Scraper Deployment on Hostinger VPS..."

# 1. Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# 2. Install dependencies
echo "📦 Installing required packages..."
apt install -y python3.11 python3.11-venv python3-pip nginx mongodb-org nodejs npm git certbot python3-certbot-nginx

# 3. Install MongoDB
echo "📦 Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# 4. Clone repository
echo "📥 Cloning repository..."
cd /var/www
git clone https://github.com/LakshyaPrd/job-scraper.git
cd job-scraper

# 5. Setup Backend
echo "🐍 Setting up Python backend..."
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 6. Create .env file (you'll need to edit this)
cat > .env << 'EOF'
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=job_scraper
CORS_ORIGINS=http://your-domain.com,https://your-domain.com
RAPIDAPI_KEY=your_rapidapi_key_here
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
EOF

echo "⚠️  IMPORTANT: Edit /var/www/job-scraper/.env with your actual API keys!"

# 7. Setup Frontend
echo "⚛️  Setting up Next.js frontend..."
cd frontend
npm install
npm run build

# Create frontend .env
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://your-domain.com
EOF

# 8. Setup systemd services

# Backend service
cat > /etc/systemd/system/job-scraper-backend.service << 'EOF'
[Unit]
Description=Job Scraper Backend API
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/job-scraper
Environment="PATH=/var/www/job-scraper/venv/bin"
ExecStart=/var/www/job-scraper/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
cat > /etc/systemd/system/job-scraper-frontend.service << 'EOF'
[Unit]
Description=Job Scraper Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/job-scraper/frontend
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 9. Setup Nginx
cat > /etc/nginx/sites-available/job-scraper << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for scraping
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 50M;
}
EOF

ln -s /etc/nginx/sites-available/job-scraper /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# 10. Set proper permissions
chown -R www-data:www-data /var/www/job-scraper

# 11. Start services
systemctl daemon-reload
systemctl enable job-scraper-backend
systemctl enable job-scraper-frontend
systemctl start job-scraper-backend
systemctl start job-scraper-frontend
systemctl restart nginx

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit /var/www/job-scraper/.env with your API keys"
echo "2. Edit /var/www/job-scraper/frontend/.env.production with your domain"
echo "3. Update 'your-domain.com' in /etc/nginx/sites-available/job-scraper"
echo "4. Restart services: systemctl restart job-scraper-backend job-scraper-frontend nginx"
echo "5. Setup SSL: certbot --nginx -d your-domain.com -d www.your-domain.com"
echo ""
echo "🌐 Your app should be running at: http://your-domain.com"
echo ""
echo "📊 Check status:"
echo "  Backend: systemctl status job-scraper-backend"
echo "  Frontend: systemctl status job-scraper-frontend"
echo "  Nginx: systemctl status nginx"
echo "  MongoDB: systemctl status mongod"
