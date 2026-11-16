# StockWise - Database Architecture & Setup Guide

StockWise uses a resilient **Hybrid Database Architecture** supporting both real **MongoDB** deployments (local community server or cloud MongoDB Atlas) and an **In-Memory Zero-Config Dev Store**.

---

## 1. Architecture Overview

```
                      ┌────────────────────────────────────┐
                      │    StockWise Application Logic    │
                      └─────────────────┬──────────────────┘
                                        │
                         Mongoose Connected?
                               /                 \
                             Yes                  No
                             /                     \
       ┌────────────────────────────┐    ┌────────────────────────────┐
       │   MongoDB / Mongoose ODM   │    │ In-Memory Dev Repository   │
       │  (Indexed Schema Models)   │    │  (Bcrypt Salted & Isolated)│
       └────────────────────────────┘    └────────────────────────────┘
```

The system inspects `mongoose.connection.readyState`:
- **When MongoDB is active (`readyState === 1`):** All queries and transactions execute directly against MongoDB collections with indexes, schema validation, and timestamps.
- **When MongoDB is disconnected/offline:** The application seamlessly falls back to the in-memory repository without crashing, maintaining full password hashing and session isolation.

---

## 2. MongoDB Schema Models & Indexes

StockWise defines 9 distinct MongoDB models in `server/models/`:

| Model | Schema File | Key Indexed Fields | Purpose |
| :--- | :--- | :--- | :--- |
| **User** | `User.js` | `email` (unique), `username` (unique) | Identity, hashed credentials, KYC status |
| **Portfolio** | `Portfolio.js` | `user` (unique index) | User equity valuation, cash, unrealized/realized P&L |
| **Holding** | `Holding.js` | `{ user: 1, symbol: 1 }` (compound unique) | Position tracking, weighted average buy price |
| **Transaction** | `Transaction.js` | `user`, `symbol`, `createdAt` | Audited double-entry trade ledger |
| **Stock** | `Stock.js` | `symbol` (unique), `sector` | Equity catalog, fundamentals, candle series |
| **Watchlist** | `Watchlist.js` | `user` | User custom watchlists |
| **Notification** | `Notification.js` | `{ user: 1, isRead: 1, createdAt: -1 }` | Order receipts, failed trade alerts, price alerts |
| **PortfolioSnapshot** | `PortfolioSnapshot.js` | `{ user: 1, timestamp: -1 }` | Historical performance curves for 1D–1Y analytics |
| **Wallet** | `Wallet.js` | `user` (unique) | Virtual available balance and starting capital rules |

---

## 3. Option A: Local MongoDB Installation

### Windows Installation
1. Download MongoDB Community Server from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).
2. Follow the MSI installer instructions, ensuring "Install MongoDB as a Service" is checked.
3. Verify the service is running:
   ```powershell
   Get-Service -Name MongoDB
   ```
4. Configure `.env`:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/stockwise
   ```

### macOS Installation (via Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb/brew/mongodb-community@7.0
```

### Linux (Ubuntu/Debian) Installation
```bash
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

---

## 4. Option B: MongoDB Atlas (Cloud Database)

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Deploy a free **M0 Sandbox Cluster**.
3. Under **Database Access**, create a user with read/write permissions.
4. Under **Network Access**, add IP address `0.0.0.0/0` (or your static IP).
5. Copy the connection string into your `.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/stockwise?retryWrites=true&w=majority
   ```

---

## 5. Database Health Check Verification

Test database connectivity using the health check endpoint:
```bash
curl http://localhost:5000/api/health
```
Response:
```json
{
  "success": true,
  "status": "online",
  "service": "StockWise Backend API",
  "tagline": "Learn. Trade. Grow.",
  "mongodb": "Connected",
  "uptime": "12.4s",
  "timestamp": "2026-11-16T17:30:00.000Z"
}
```
*(If MongoDB is offline, `"mongodb": "Disconnected"` is returned and the in-memory fallback engages automatically).*
