# StockWise — Learn. Trade. Grow.

StockWise is an enterprise-grade virtual stock trading platform designed for learning, testing investment strategies, and growing financial knowledge using **₹1,00,000** risk-free virtual paper money.

Inspired by premium fintech platforms such as Groww, Zerodha, and TradingView, StockWise delivers a high-performance web interface with real-time simulated Indian market feeds (NSE/BSE), interactive multi-timeframe charts, atomic order execution, double-entry wallet accounting, and comprehensive portfolio analytics.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Main Features](#main-features)
3. [Technology Stack](#technology-stack)
4. [Application Screenshots & Interface Previews](#application-screenshots--interface-previews)
5. [Project Folder Structure](#project-folder-structure)
6. [Installation Instructions](#installation-instructions)
7. [Environment Variable Setup](#environment-variable-setup)
8. [Database Configuration](#database-configuration)
9. [Local Development Instructions](#local-development-instructions)
10. [REST API Documentation](#rest-api-documentation)
11. [Automated Testing & QA](#automated-testing--qa)
12. [Production Deployment Instructions](#production-deployment-instructions)
13. [Virtual Trading Disclaimer](#virtual-trading-disclaimer)

---

## 1. Project Overview

StockWise is built to democratize financial literacy and trading practice in the Indian equity markets. Every newly registered user automatically receives ₹1,00,000 in virtual paper capital, allowing beginners and seasoned traders alike to practice executing market and limit orders, track portfolio performance, and observe real-time sector movements without risking actual funds.

---

## 2. Main Features

- **User Authentication & Persistent Sessions:** Secure registration and login using either email or username, bcrypt password hashing (10 salt rounds), JWT Bearer token authentication, and email password reset flows.
- **₹1,00,000 Virtual Starting Capital:** Exactly ₹1,00,000 credited once upon user signup; strictly prevents negative balances and overdraft debits.
- **Stock Market Explorer:** Comprehensive NSE/BSE equities catalog with real-time quotes, day price changes, market capitalization, P/E ratios, sector categorization (Banking, IT, Auto, Pharma, Energy, FMCG), search, and pagination.
- **Interactive Multi-Timeframe Charts:** High-performance Recharts area and candle charts supporting `1D`, `1W`, `1M`, `3M`, `6M`, and `1Y` historical intervals with Level 2 market depth.
- **Atomic Trading Engine:** Fully functional BUY and SELL operations:
  - Validates cash balance and share holdings.
  - Recalculates weighted average purchase prices on consecutive purchases.
  - Calculates realized profit/loss using the Average Cost-Basis method.
  - In-memory concurrency locks prevent rapid double-click duplicate orders.
- **Portfolio Analytics & Risk Health:** Real-time valuation curves, asset allocation pie charts, sector distribution, top outperformer / lagging position callouts, and concentration risk score.
- **Personal Watchlists:** Custom watchlists with stock addition/removal and strict cross-user data isolation.
- **Audited Transaction History:** Itemized double-entry trade ledger with all 9 standard financial fields, search, action filters (`BUY`/`SELL`), date ranges, and one-click CSV statement export.
- **Financial Market News:** Authentic reporting from accredited Indian financial publications (*The Economic Times*, *Livemint*, *Business Standard*, *Moneycontrol*, *Reuters*) with direct links to original articles.
- **Live Notifications & Price Alerts:** Real-time unread counter badge, execution receipts, rejected order warnings, and custom target price alerts.
- **Platform Customization:** Fintech Dark Navy (`#0B0F19`) and Clean Light (`#FFFFFF`) themes, editable trading defaults, and one-click demo account reset.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Recharts, Lucide React, Context API |
| **Backend** | Node.js, Express.js (Modular layered architecture) |
| **Database** | MongoDB & Mongoose (9 Indexed Schemas) + Resilient In-Memory Dev Store |
| **Security** | JWT, bcryptjs, HTTP Security Headers (`CSP`, `X-Frame-Options`, `X-Content-Type-Options`), Sliding-Window Rate Limiting |
| **Styling** | Custom Fintech CSS3 Design System with CSS Variables and responsive breakpoints |
| **Testing** | Node.js automated test suites (173 specifications with 100% pass rate) |

---

## 4. Application Screenshots & Interface Previews

### 1. Main Dashboard (`/dashboard`)
Displays the user's total account value, available cash, flagship Indian indices (NIFTY 50, SENSEX, BANK NIFTY), interactive performance chart, top market movers, and active holdings.

### 2. Stock Market Explorer (`/markets`)
Multi-section navigation tabs (All, Top Gainers, Top Losers, Most Active, Banking, IT, Automobile, Healthcare, Energy, FMCG), real-time search, exchange toggles (NSE/BSE), and Grid/Table display modes.

### 3. Stock Details & Trading Terminal (`/stock/:symbol`)
Full equity overview, live bid/ask spread, 52-week high/low progress bars, interactive 6-interval chart (`1D`–`1Y`), company fundamentals, Level 2 order book, and quick BUY/SELL order ticket.

### 4. Portfolio Management & Analytics (`/portfolio`)
7 core valuation metrics, historical valuation curve, asset allocation, sector distribution, outperformer badges, and itemized holdings table with direct trade actions.

### 5. Watchlist & Transaction Ledger (`/watchlist`, `/transactions`)
Custom watchlist management with real-time stock additions, and audited transaction history with keyword search, BUY/SELL filtering, itemized order receipt modals, and CSV export.

---

## 5. Project Folder Structure

```
tradex/
├── docs/                               # Comprehensive Documentation
│   ├── API_DOCUMENTATION.md            # REST API reference across all 10 route modules
│   ├── DATABASE_SETUP.md               # MongoDB & Atlas setup guide
│   ├── DEPLOYMENT.md                   # Cloud deployment instructions (Docker, Render, Vercel)
│   ├── INSTALLATION.md                 # Local installation and prerequisites guide
│   └── TESTING.md                      # Automated testing and QA documentation
├── server/                             # Express.js Backend Architecture
│   ├── config/                         # Database and environment configurations
│   │   └── db.js                       # MongoDB connection with resilient fallback
│   ├── controllers/                    # REST API route controllers
│   │   ├── authController.js
│   │   ├── newsController.js
│   │   ├── notificationController.js
│   │   ├── portfolioController.js
│   │   ├── stockController.js
│   │   ├── tradeController.js
│   │   ├── transactionController.js
│   │   ├── userController.js
│   │   ├── walletController.js
│   │   └── watchlistController.js
│   ├── middleware/                     # Express middlewares
│   │   ├── authMiddleware.js           # JWT Bearer token verification
│   │   ├── errorHandler.js             # Centralized JSON error handling
│   │   ├── rateLimiter.js              # Sliding-window IP rate limiter
│   │   └── securityHeaders.js          # CSP, X-Frame-Options, X-Content-Type-Options
│   ├── models/                         # Mongoose Models & Hybrid Repositories
│   │   ├── Holding.js
│   │   ├── Notification.js
│   │   ├── Portfolio.js
│   │   ├── PortfolioSnapshot.js
│   │   ├── Stock.js
│   │   ├── Transaction.js
│   │   ├── User.js
│   │   ├── Wallet.js
│   │   └── Watchlist.js
│   ├── routes/                         # Express Route definitions
│   ├── services/                       # Business logic services
│   │   ├── newsService.js
│   │   ├── portfolioService.js
│   │   ├── stockService.js
│   │   ├── tradeService.js
│   │   └── walletService.js
│   ├── utils/                          # Helper utilities (API responses, calculations)
│   ├── index.js                        # Express server entry point
│   └── test*.js                        # 9 Automated test suites (173 test specs)
├── src/                                # React 18 + Vite Frontend Application
│   ├── components/                     # Modular reusable UI components
│   │   ├── common/                     # Badges, Modals, ConfirmDialogs, Skeletons, Toasts
│   │   ├── layout/                     # Header, Sidebar, MobileNav, Layout wrapper
│   │   ├── portfolio/                  # PerformanceChart, AllocationChart
│   │   └── trade/                      # QuickTradeModal, TradeOrderCard
│   ├── context/                        # React Context state management
│   │   ├── AuthContext.jsx             # User authentication and session persistence
│   │   ├── ThemeContext.jsx            # Dark/Light theme switching
│   │   └── WalletContext.jsx           # Live wallet balances and refresh triggers
│   ├── pages/                          # Complete Application Pages
│   │   ├── Dashboard.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── Login.jsx
│   │   ├── Markets.jsx
│   │   ├── News.jsx
│   │   ├── Portfolio.jsx
│   │   ├── Profile.jsx
│   │   ├── Register.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── Settings.jsx
│   │   ├── StockDetails.jsx
│   │   ├── Transactions.jsx
│   │   └── Watchlist.jsx
│   ├── services/                       # Centralized API client (api.js)
│   ├── App.jsx                         # React Router route hierarchy & guards
│   ├── index.css                       # Fintech design system styles & breakpoints
│   └── main.jsx                        # React DOM mounting
├── .env.example                        # Environment variables template
├── .gitignore                          # Git exclusions (node_modules, .env, secrets)
├── package.json                        # Node dependencies & npm test scripts
├── render.yaml                         # Render Cloud Deployment Blueprint
├── vercel.json                         # Vercel SPA routing & cache configuration
├── vite.config.js                      # Vite build config with chunk code-splitting
├── PROJECT_PROGRESS.md                 # 10 Stages completion progress tracking
└── README.md                           # Master project documentation
```

---

## 6. Installation Instructions

### Prerequisites
- **Node.js:** v18.0.0 or higher (`node -v`)
- **npm:** v9.0.0 or higher (`npm -v`)
- **MongoDB:** *(Optional)* Local daemon or cloud Atlas connection (StockWise automatically falls back to an in-memory dev store if offline)

### Setup Steps
```bash
# 1. Clone or navigate to the repository
cd tradex

# 2. Install all dependencies
npm install

# 3. Create your local .env configuration
cp .env.example .env
```

---

## 7. Environment Variable Setup

Configure your `.env` file based on `.env.example`:

```env
# Server & Client Ports
PORT=5000
CLIENT_URL=http://localhost:3000

# MongoDB Database URI
MONGODB_URI=mongodb://127.0.0.1:27017/stockwise

# Authentication Secrets
JWT_SECRET=stockwise_super_secure_jwt_secret_key_2026_learn_trade_grow
JWT_EXPIRES_IN=7d

# Password Reset Email Delivery
EMAIL_SERVICE=console
EMAIL_FROM=StockWise Support <support@stockwise.trade>

# Market Data Configuration
MARKET_DATA_PROVIDER=sample
MARKET_DATA_CACHE_TTL_SECONDS=60
```

---

## 8. Database Configuration

StockWise features a **Hybrid Repository System**:
- **With MongoDB:** When `MONGODB_URI` connects to a running MongoDB instance, Mongoose schemas and compound indexes are actively used.
- **Without MongoDB (Offline Development):** If MongoDB is offline, StockWise seamlessly switches to its in-memory data store with salted bcrypt password hashing and isolation. Zero configuration is required to test and evaluate the platform.

For full database setup instructions, see **[Database Architecture & Setup Guide](docs/DATABASE_SETUP.md)**.

---

## 9. Local Development Instructions

### Start Both Frontend and Backend Concurrently
```bash
npm run dev
```
- **React Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend REST API:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Run Individually in Separate Terminals
```bash
# Terminal 1: Backend Server
npm run dev:server

# Terminal 2: Vite Client
npm run dev:client
```

---

## 10. REST API Documentation

Base URL: `http://localhost:5000/api`

| Route Prefix | Endpoints | Access | Summary |
| :--- | :--- | :---: | :--- |
| `/api/auth` | `/register`, `/login`, `/me`, `/forgot-password`, `/reset-password/:token` | Public / Private | User authentication and session management |
| `/api/trade` | `/buy`, `/sell`, `/holding/:symbol` | Private | Atomic buy/sell execution, locks, and cost basis |
| `/api/wallet` | `/`, `/ledger`, `/credit`, `/debit` | Private | Virtual balance, ledger audit, overdraft checks |
| `/api/portfolio` | `/`, `/analytics`, `/history`, `/snapshot` | Private | Portfolio valuation, sector breakdown, P&L curves |
| `/api/stocks` | `/`, `/sections`, `/indices`, `/market-status`, `/:symbol`, `/:symbol/history` | Public | Equities explorer, NSE indices, candle series |
| `/api/watchlists` | `/`, `/:id`, `/:id/stocks`, `/:id/stocks/:symbol` | Private | Custom watchlists and stock bookmarking |
| `/api/transactions`| `/`, `/:id` | Private | Itemized transaction ledger with search and pagination |
| `/api/notifications`| `/`, `/:id/read`, `/read-all`, `/alerts`, `/:id` | Private | Alerts, trade execution receipts, and unread counts |
| `/api/news` | `/`, `/:id` | Public | Authentic Indian financial market news |
| `/api/users` | `/profile`, `/password`, `/reset-account` | Private | Profile details, password changes, and demo reset |

For complete request/response schemas, see **[REST API Reference](docs/API_DOCUMENTATION.md)**.

---

## 11. Automated Testing & QA

StockWise includes **9 automated test suites** verifying **173 individual specifications** with 100% pass rates:

```bash
# Run all 173 automated tests
npm test

# Run individual test suites
npm run test:auth       # 14 Authentication tests
npm run test:backend    # 20 Architecture & Database tests
npm run test:wallet     # 12 Virtual Wallet tests
npm run test:market     # 22 Market Explorer & Data tests
npm run test:trade      # 17 Virtual Trading Engine tests
npm run test:portfolio  # 16 Portfolio Analytics tests
npm run test:watchlist  # 17 Watchlist & Transaction tests
npm run test:advanced   # 19 Advanced Features & UX tests
npm run test:audit      # 36 Stage 10 Master E2E Audit tests
```

---

## 12. Production Deployment Instructions

StockWise is optimized for cloud deployment:

### Backend Deployment (Render / Railway)
1. Connect your GitHub repository to [Render](https://render.com) or [Railway](https://railway.app).
2. Use the provided [`render.yaml`](render.yaml) blueprint or configure manually:
   - **Build Command:** `npm install`
   - **Start Command:** `npm run start`
   - **Health Check Path:** `/api/health`
3. Set environment variables: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`.

### Frontend Deployment (Vercel)
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. The provided [`vercel.json`](vercel.json) automatically sets up SPA route rewrites and asset caching.
3. Add the environment variable:
   - `VITE_API_BASE_URL`: `https://your-backend-api-url.onrender.com`
4. Click **Deploy**.

For detailed deployment steps, see **[Production Deployment Instructions](docs/DEPLOYMENT.md)**.

---

## 13. Virtual Trading Disclaimer

> [!IMPORTANT]
> **StockWise is an educational simulation platform.**
> All monetary balances, stock positions, price quotes, and transaction records on this platform are strictly simulated virtual paper money. No real currency is accepted, deposited, invested, or disbursed. StockWise does not operate as a registered financial broker or investment advisor.
