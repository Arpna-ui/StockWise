# StockWise - Production Deployment Instructions

This guide provides instructions for deploying StockWise to cloud production environments (Docker, Render, Railway, Vercel, or traditional VPS).

---

## 1. Environment Checklist for Production

Before deploying, ensure all production environment variables are configured:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-domain.com
MONGODB_URI=mongodb+srv://<user>:<pass>@your-cluster.mongodb.net/stockwise?retryWrites=true&w=majority
JWT_SECRET=use_a_cryptographically_secure_random_256_bit_string_here
JWT_EXPIRES_IN=7d
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_FROM=StockWise Support <noreply@yourdomain.com>
MARKET_DATA_PROVIDER=sample
MARKET_DATA_CACHE_TTL_SECONDS=60
```

---

## 2. Docker Deployment

Create a `Dockerfile` in the root directory:

```dockerfile
# Stage 1: Build Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY server/ ./server/
COPY --from=client-builder /app/dist ./dist

EXPOSE 5000
CMD ["node", "server/index.js"]
```

Build and run with Docker:
```bash
docker build -t stockwise:latest .
docker run -d -p 5000:5000 --env-file .env stockwise:latest
```

---

## 3. Render / Railway Deployment

### Backend (Node.js Web Service)
1. Link your GitHub repository to Render or Railway.
2. Configure settings:
   - **Environment:** Node
   - **Build Command:** `npm ci`
   - **Start Command:** `node server/index.js`
3. Add environment variables from your `.env`.

### Frontend (Static Site on Vercel or Render)
1. Configure settings:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
2. Add environment variable:
   - `VITE_API_BASE_URL`: `https://your-backend-api-url.com`

---

## 4. Production Security Recommendations

1. **Enforce HTTPS:** Route all traffic over TLS/SSL certificates (e.g. Let's Encrypt / Cloudflare).
2. **Reverse Proxy:** Run behind Nginx or AWS CloudFront with HTTP/2 and gzip/brotli compression.
3. **Database Security:** Restrict MongoDB Atlas Network Access whitelist to the specific IP addresses of your web servers.
4. **Token Security:** Store JWT tokens securely and rotate `JWT_SECRET` periodically.
