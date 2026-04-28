# iLead VPS Deployment Guide

This guide explains how to deploy iLead on a fresh Ubuntu VPS, step by step.

Assumption:

- VPS OS: Ubuntu 22.04 or 24.04
- Domain example: `ilead.yourdomain.com`
- Backend runs on port `3003`
- Frontend is built as static files and served by Nginx
- Database: PostgreSQL on the same VPS

Replace these placeholders with your real values:

```text
YOUR_DOMAIN       = ilead.yourdomain.com
YOUR_VPS_IP       = 1.2.3.4
YOUR_SERVER_USER  = deploy
APP_DIR           = /var/www/ilead
DB_NAME           = ilead_db
DB_USER           = ilead_user
DB_PASSWORD       = choose_a_strong_password
```

---

## 1. Point your domain to the VPS

In your domain DNS panel, create an A record:

```text
Type: A
Name: ilead
Value: YOUR_VPS_IP
```

Wait a few minutes, then test from your computer:

```bash
ping YOUR_DOMAIN
```

If it shows your VPS IP, DNS is ready.

---

## 2. SSH into the VPS

From your computer:

```bash
ssh root@YOUR_VPS_IP
```

Update the server:

```bash
apt update && apt upgrade -y
```

---

## 3. Create a normal deploy user

Do not run the app as `root`.

```bash
adduser deploy
usermod -aG sudo deploy
```

Switch to the deploy user:

```bash
su - deploy
```

From now on, use this user unless the command needs `sudo`.

---

## 4. Install required software

Install Node.js, PostgreSQL, Nginx, Git, and PM2.

```bash
sudo apt install -y curl git nginx postgresql postgresql-contrib
```

Install Node.js 22 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Check versions:

```bash
node -v
npm -v
```

Install PM2:

```bash
sudo npm install -g pm2
```

---

## 5. Create the PostgreSQL database

Open PostgreSQL shell:

```bash
sudo -u postgres psql
```

Run these SQL commands. Change the password.

```sql
CREATE DATABASE ilead_db;
CREATE USER ilead_user WITH ENCRYPTED PASSWORD 'DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE ilead_db TO ilead_user;
ALTER DATABASE ilead_db OWNER TO ilead_user;
\q
```

Test login:

```bash
psql "postgresql://ilead_user:DB_PASSWORD@localhost:5432/ilead_db"
```

If you enter PostgreSQL successfully, type:

```sql
\q
```

---

## 6. Upload the project to the VPS

### Option A — If you have GitHub/GitLab

On the VPS:

```bash
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www
cd /var/www
git clone YOUR_REPO_URL ilead
cd ilead
```

### Option B — If the code is only on your Mac

From your Mac, run:

```bash
rsync -av --exclude node_modules --exclude .git \
  /Users/123ang/Desktop/Websites/iLead/ \
  deploy@YOUR_VPS_IP:/var/www/ilead/
```

Then SSH into the VPS:

```bash
ssh deploy@YOUR_VPS_IP
cd /var/www/ilead
```

---

## 7. Create environment files

Create backend environment file:

```bash
cd /var/www/ilead
cp backend/.env.example backend/.env
nano backend/.env
```

Use this as a beginner-friendly production example:

```env
DATABASE_URL="postgresql://ilead_user:DB_PASSWORD@localhost:5432/ilead_db"
PORT=3003
NODE_ENV="production"
FRONTEND_URL="https://YOUR_DOMAIN"
TIMEZONE="Asia/Kuala_Lumpur"

JWT_ACCESS_SECRET="replace_with_a_long_random_secret"
JWT_REFRESH_SECRET="replace_with_another_long_random_secret"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

Generate random secrets like this:

```bash
openssl rand -base64 48
openssl rand -base64 48
```

Create frontend environment file:

```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```

Use:

```env
VITE_API_BASE_URL="https://YOUR_DOMAIN/api"
VITE_APP_TIMEZONE="Asia/Kuala_Lumpur"
VITE_APP_NAME="iLead"
```

Important: frontend `.env` is read during build time. If you change it later, run `npm run build` again.

---

## 8. Install dependencies

From `/var/www/ilead`:

```bash
npm install
```

---

## 9. Prepare Prisma database tables

Generate Prisma client:

```bash
npm run prisma:generate
```

Because this early scaffold may not have migration files yet, use `db push` for the first VPS setup:

```bash
cd backend
npx prisma db push
npm run seed
cd ..
```

Later, after proper migrations exist, production should use:

```bash
cd backend
npx prisma migrate deploy
cd ..
```

---

## 10. Build the app

From `/var/www/ilead`:

```bash
npm run build
```

This builds:

- backend syntax check
- frontend static files in `frontend/dist`

---

## 11. Start backend with PM2

From `/var/www/ilead`:

```bash
pm2 start backend/src/server.js --name ilead-api
pm2 save
pm2 startup
```

`pm2 startup` will print one command. Copy and run that command with `sudo`.

Check backend status:

```bash
pm2 status
pm2 logs ilead-api
```

Test locally on the VPS:

```bash
curl http://localhost:3003/health
```

You should see something like:

```json
{"ok":true,"service":"ilead-api"}
```

---

## 12. Configure Nginx

Create a new Nginx config:

```bash
sudo nano /etc/nginx/sites-available/ilead
```

Paste this. Replace `YOUR_DOMAIN`.

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    root /var/www/ilead/frontend/dist;
    index index.html;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://127.0.0.1:3003/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:3003/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/ilead /etc/nginx/sites-enabled/ilead
```

Optional: remove default Nginx site:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

Test Nginx config:

```bash
sudo nginx -t
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

Open in browser:

```text
http://YOUR_DOMAIN
```

---

## 13. Enable HTTPS with SSL

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Request SSL certificate:

```bash
sudo certbot --nginx -d YOUR_DOMAIN
```

Follow the questions. Choose redirect HTTP to HTTPS when asked.

Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

Now open:

```text
https://YOUR_DOMAIN
```

---

## 14. Open firewall ports

If UFW is enabled:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Do not expose PostgreSQL publicly.

---

## 15. First login

After seeding, login with:

```text
Email: admin@ilead.local
Password: iLead2026!
```

For real production, change this password immediately after login.

---

## 16. Common commands

Check app status:

```bash
pm2 status
```

View backend logs:

```bash
pm2 logs ilead-api
```

Restart backend:

```bash
pm2 restart ilead-api
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

Check Nginx errors:

```bash
sudo tail -f /var/log/nginx/error.log
```

Check backend health:

```bash
curl https://YOUR_DOMAIN/health
```

---

## 17. How to update the app later

### If using Git

```bash
cd /var/www/ilead
git pull
npm install
npm run prisma:generate
cd backend
npx prisma db push
cd ..
npm run build
pm2 restart ilead-api
sudo systemctl reload nginx
```

### If using rsync from Mac

From Mac:

```bash
rsync -av --exclude node_modules --exclude .git \
  /Users/123ang/Desktop/Websites/iLead/ \
  deploy@YOUR_VPS_IP:/var/www/ilead/
```

Then on VPS:

```bash
cd /var/www/ilead
npm install
npm run prisma:generate
cd backend
npx prisma db push
cd ..
npm run build
pm2 restart ilead-api
sudo systemctl reload nginx
```

---

## 18. Database backup

Create backup folder:

```bash
mkdir -p ~/backups/ilead
```

Manual backup:

```bash
pg_dump "postgresql://ilead_user:DB_PASSWORD@localhost:5432/ilead_db" > ~/backups/ilead/ilead_$(date +%F).sql
```

Restore backup:

```bash
psql "postgresql://ilead_user:DB_PASSWORD@localhost:5432/ilead_db" < ~/backups/ilead/ilead_YYYY-MM-DD.sql
```

Beginner reminder: test restore on a separate database before doing it on production.

---

## 19. Troubleshooting

### Website opens but API fails

Check backend:

```bash
pm2 logs ilead-api
curl http://localhost:3003/health
```

Check Nginx:

```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Login fails

Check that seed ran:

```bash
cd /var/www/ilead/backend
npm run seed
```

Check backend `.env` database URL.

### Frontend calls wrong API URL

Edit:

```bash
nano frontend/.env
```

Then rebuild:

```bash
npm run build
sudo systemctl reload nginx
```

### Prisma cannot connect

Test database URL:

```bash
psql "postgresql://ilead_user:DB_PASSWORD@localhost:5432/ilead_db"
```

If that fails, fix PostgreSQL username/password/database first.

---

## 20. Production safety checklist

Before using real student data:

- [ ] HTTPS enabled
- [ ] Default admin password changed
- [ ] Strong JWT secrets set
- [ ] PostgreSQL not exposed to the internet
- [ ] Daily database backup configured
- [ ] VPS firewall enabled
- [ ] Only trusted users have SSH access
- [ ] PII export permissions reviewed
- [ ] Privacy notice reviewed for PDPA
- [ ] Test restore from backup

---

## 21. Simple architecture

```text
Browser
  |
  | HTTPS
  v
Nginx
  |-- serves frontend from /var/www/ilead/frontend/dist
  |
  |-- /api/* proxies to Node backend on localhost:3003

Node backend
  |
  v
PostgreSQL database
```
