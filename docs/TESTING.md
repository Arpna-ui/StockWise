# StockWise - Automated Testing & Quality Assurance Guide

StockWise features a comprehensive automated testing suite consisting of **9 test suites** verifying **173 individual specifications** across all business logic, security constraints, and accounting rules.

---

## 1. Complete Test Suite Matrix

| Stage | Test File | Test Command | Tests | Coverage Scope |
| :---: | :--- | :--- | :---: | :--- |
| **2** | `server/testAuthSuite.js` | `npm run test:auth` | 14 | Registration, JWT, duplicate checks, login, password reset |
| **3** | `server/testBackendArchitecture.js` | `npm run test:backend` | 20 | Health check, schemas, indexes, private routes, CRUD |
| **4** | `server/testWalletSuite.js` | `npm run test:wallet` | 12 | ₹1,00,000 grant, ledger, overdraft protection, persistence |
| **5** | `server/testMarketDataSuite.js` | `npm run test:market` | 22 | Stock search, sectors, 6 timeframes, cache, NSE indices |
| **6** | `server/testTradeEngineSuite.js` | `npm run test:trade` | 17 | Atomic BUY/SELL, cost-basis P&L, holdings, lock protection |
| **7** | `server/testPortfolioAnalyticsSuite.js`| `npm run test:portfolio` | 16 | Analytics, asset allocation, diversification, P&L split |
| **8** | `server/testWatchlistTransactionSuite.js`| `npm run test:watchlist`| 17 | Custom watchlists, user isolation, 9-field ledger, filters |
| **9** | `server/testAdvancedFeaturesSuite.js` | `npm run test:advanced` | 19 | Market news, price alerts, notifications, profile, reset |
| **10**| `server/testCompleteWorkflowsAudit.js` | `npm run test:audit` | 36 | Master E2E audit of all 15 workflows & security headers |
| **ALL**| **Complete Master Suite** | `npm test` | **173**| **100% End-to-End System Verification** |

---

## 2. Running Automated Tests

### Run the Master Test Suite
Executes all 173 tests sequentially:
```bash
npm test
```

### Run Individual Test Suites
```bash
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

## 3. Key Tested Invariants & Business Constraints

1. **₹1,00,000 Starting Balance Invariant:** Every newly registered user receives exactly ₹1,00,000 once upon registration. The balance is never re-initialized or wiped upon re-login.
2. **Negative Balance Invariant:** `availableBalance >= orderTotal`. Direct debits or buy orders exceeding available balance return an error and preserve current balances.
3. **Short-Selling Prevention:** Selling shares without an active holding or attempting to sell more shares than owned ($Q_{\text{sell}} > Q_{\text{owned}}$) is strictly rejected.
4. **Weighted Average Cost Basis:**
   $$\text{AvgPrice}_{\text{new}} = \frac{(Q_{\text{prev}} \times P_{\text{prev}}) + (Q_{\text{new}} \times P_{\text{new}})}{Q_{\text{prev}} + Q_{\text{new}}}$$
5. **Realized Profit/Loss:**
   $$\text{Realized P&L} = Q_{\text{sold}} \times (P_{\text{sell}} - \text{AvgBuyPrice})$$
6. **Cross-User Privacy & Isolation:** Watchlists, portfolios, transactions, and notification records are strictly filtered by `{ user: req.user._id }`. Cross-user tampering attempts receive 401/403/404 rejections.
7. **Rate Limiting & Security Headers:** Responses verify the presence of `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`, and rate-limiting headers.
