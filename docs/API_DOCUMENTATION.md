# StockWise - REST API Reference & Documentation

Base URL: `http://localhost:5000/api`  
All private endpoints require the `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new user account; grants ₹1,00,000 virtual balance |
| `POST` | `/auth/login` | Public | Login with email or username; returns JWT token |
| `GET` | `/auth/me` | Private | Verify token and retrieve authenticated user session |
| `POST` | `/auth/forgot-password` | Public | Request password reset token via email/console link |
| `POST` | `/auth/reset-password/:token`| Public | Reset password using verified token |

---

## 2. Virtual Trading Engine (`/api/trade`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/trade/buy` | Private | Execute BUY order (validates funds, updates holdings, logs ledger, checks concurrency lock) |
| `POST` | `/trade/sell` | Private | Execute SELL order (validates shares, calculates realized P&L using cost-basis, credits wallet) |
| `GET` | `/trade/holding/:symbol` | Private | Get active shares, average buy price, and P&L for a specific equity |

---

## 3. Virtual Wallet & Ledger (`/api/wallet`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/wallet` | Private | Get available virtual cash, total invested, total value, and disclaimer |
| `GET` | `/wallet/ledger` | Private | Get itemized audit trail of balance credits and debits |
| `POST` | `/wallet/credit` | Private | Credit virtual balance (restricted to simulation allowances) |
| `POST` | `/wallet/debit` | Private | Debit virtual balance (strictly checks overdraft) |

---

## 4. Portfolio & Analytics (`/api/portfolio`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/portfolio` | Private | Get portfolio summary, 7 metrics, holdings list, and sector allocations |
| `GET` | `/portfolio/analytics` | Private | Get best/worst performer, diversification status, asset allocation breakdown |
| `GET` | `/portfolio/history` | Private | Historical valuation curve across `1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, `ALL` |
| `POST` | `/portfolio/snapshot` | Private | Capture point-in-time portfolio valuation snapshot |

---

## 5. Stocks & Market Explorer (`/api/stocks`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/stocks` | Public | Search, filter by sector, exchange (`NSE`/`BSE`), sort, and paginate |
| `GET` | `/stocks/sections` | Public | Summary of Top Gainers, Top Losers, Most Active, and Sectors |
| `GET` | `/stocks/indices` | Public | Benchmark Indian indices (`NIFTY 50`, `SENSEX`, `BANK NIFTY`) |
| `GET` | `/stocks/market-status` | Public | Real-time Indian exchange trading hours and status (`OPEN`/`CLOSED`) |
| `GET` | `/stocks/:symbol` | Public | Detailed company profile, valuation metrics, 6 chart series, Level 2 depth |
| `GET` | `/stocks/:symbol/history` | Public | Historical price series for `1D`, `1W`, `1M`, `3M`, `6M`, `1Y` |

---

## 6. Personal Watchlists (`/api/watchlists`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/watchlists` | Private | Retrieve user's watchlists populated with live quotes |
| `POST` | `/watchlists` | Private | Create a new custom watchlist |
| `DELETE` | `/watchlists/:id` | Private | Delete a custom watchlist (strictly isolated to owner) |
| `POST` | `/watchlists/:id/stocks` | Private | Add a stock symbol to a watchlist |
| `DELETE` | `/watchlists/:id/stocks/:symbol` | Private | Remove a stock symbol from a watchlist |

---

## 7. Transaction History & Ledger (`/api/transactions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/transactions` | Private | Get transaction history with search, type filter (`BUY`/`SELL`), date filter, sorting, pagination |
| `GET` | `/transactions/:id` | Private | Retrieve itemized single transaction order receipt |

---

## 8. Notifications & Price Alerts (`/api/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Private | Get user notifications and unread badge count |
| `PUT` | `/notifications/:id/read` | Private | Mark single notification as read |
| `PUT` | `/notifications/read-all` | Private | Mark all unread notifications as read |
| `POST` | `/notifications/alerts` | Private | Configure custom watchlist price alert level (`ABOVE`/`BELOW`) |
| `DELETE` | `/notifications/:id` | Private | Delete individual notification |
| `DELETE` | `/notifications` | Private | Clear entire notification history |

---

## 9. Financial Market News (`/api/news`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/news` | Public | Sourced authentic news with category, symbol, and search filters |
| `GET` | `/news/:id` | Public | Full article view with external link to accredited publisher |

---

## 10. User Profile & Settings (`/api/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/profile` | Private | Retrieve user profile, initials, KYC badge, and linked portfolio values |
| `PUT` | `/users/profile` | Private | Update full name, phone number, bio, and avatar |
| `PUT` | `/users/password` | Private | Verify current password and update with bcrypt hashing |
| `POST` | `/users/reset-account`| Private | Reset demo account back to ₹1,00,000 cash and wipe active holdings |
