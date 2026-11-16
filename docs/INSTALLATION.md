# StockWise - Installation & Local Startup Guide

Welcome to **StockWise** (*Learn. Trade. Grow.*), a full-stack virtual stock trading platform for Indian equity markets (NSE/BSE) with a ₹1,00,000 risk-free educational starting grant.

---

## 1. System Prerequisites

Ensure your development machine meets the following baseline requirements:

| Component | Minimum Version | Recommended Version | Check Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.0.0` or higher | `v20.x` or `v22.x` LTS | `node -v` |
| **npm** | `v9.0.0` or higher | `v10.x` | `npm -v` |
| **Git** | `v2.30.0` or higher | Latest | `git --version` |
| **MongoDB** *(Optional)* | `v6.0.0` or higher | Local daemon or Atlas | `mongod --version` |

> [!NOTE]
> **Zero-Config In-Memory Fallback:** A local MongoDB daemon is **optional** for evaluation and testing. If MongoDB is offline, StockWise seamlessly falls back to its in-memory data store with salted bcrypt password hashing and persistent sessions.

---

## 2. Installation Steps

### Step 1: Clone or Navigate to the Project Directory
```bash
cd c:\Users\DELL\OneDrive\Desktop\tradex
```

### Step 2: Install Dependencies
Install all production and development dependencies for both frontend and backend:
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to create your local `.env` configuration file:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Verify the `.env` settings:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/stockwise
JWT_SECRET=stockwise_super_secure_jwt_secret_key_2026_learn_trade_grow
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
EMAIL_SERVICE=console
EMAIL_FROM=StockWise Support <support@stockwise.trade>
MARKET_DATA_PROVIDER=sample
MARKET_DATA_CACHE_TTL_SECONDS=60
```

---

## 3. Running the Application

### Option A: Concurrent Startup (Recommended)
Starts both the Express backend API and the Vite React frontend in parallel in a single terminal:
```bash
npm run dev
```

### Option B: Separate Terminal Startup

**Terminal 1 — Backend API Server:**
```bash
npm run dev:server
# Server starts at http://localhost:5000
# Health Check endpoint: http://localhost:5000/api/health
```

**Terminal 2 — React Vite Client:**
```bash
npm run dev:client
# Vite client starts at http://localhost:3000
```

---

## 4. Accessing the Platform

Open your web browser and navigate to:
- **Web Application:** [http://localhost:3000](http://localhost:3000)
- **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Quick Demo Login (One-Click)
On the Login page (`/login`), click **"Quick Demo Login"** to instantly explore with pre-seeded data, or register a new account to receive a fresh ₹1,00,000 virtual trading grant.

---

## 5. Production Build Verification
To test creating a production-ready bundled release:
```bash
npm run build
```
The optimized bundle will be generated into the `dist/` directory with code splitting.
To preview the production build locally:
```bash
npm run preview
```
