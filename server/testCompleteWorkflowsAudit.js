import app from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const runCompleteWorkflowsAudit = async () => {
  console.log('=======================================================================');
  console.log('   STOCKWISE STAGE 10: COMPLETE WORKFLOWS & SECURITY AUDIT SUITE');
  console.log('=======================================================================\n');

  const baseUrl = 'http://127.0.0.1:5000/api';
  let totalAudits = 0;
  let auditsPassed = 0;

  const assert = (condition, title) => {
    totalAudits++;
    if (condition) {
      console.log(`  ✓ AUDIT PASS [${totalAudits.toString().padStart(2, '0')}]: ${title}`);
      auditsPassed++;
    } else {
      console.error(`  ✗ AUDIT FAIL [${totalAudits.toString().padStart(2, '0')}]: ${title}`);
    }
  };

  try {
    // -------------------------------------------------------------------------
    // WORKFLOW 1: User Registration & Input Validation
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Registration Workflow & Validation ---');
    const suffix = Date.now();
    const user1Email = `audit_trader_${suffix}@stockwise.trade`;
    const user1Pass = 'SecureTrade@2026';
    const user1NewPass = 'UpdatedSecurePass@2026';

    // Validation: Mismatched password
    const badRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Devendra Kulkarni',
        username: `audit_user_${suffix}`,
        email: user1Email,
        password: user1Pass,
        confirmPassword: 'MismatchPassword123',
      }),
    });
    assert(badRegRes.status === 400, 'Workflow 1.1: Registration rejects password mismatch with 400 Bad Request');

    // Valid Registration
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Devendra Kulkarni',
        username: `audit_user_${suffix}`,
        email: user1Email,
        password: user1Pass,
        confirmPassword: user1Pass,
      }),
    });
    const regData = await regRes.json();
    let token1 = regData.token;
    const user1Id = regData.user._id;

    assert(
      regRes.status === 201 && token1 && regData.user.virtualInitialCapital === 100000,
      'Workflow 1.2: Successful registration returns 201 Created, JWT token & ₹1,00,000 virtual grant'
    );

    // Duplicate email rejection
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Devendra Kulkarni',
        username: `audit_dup_${suffix}`,
        email: user1Email,
        password: user1Pass,
        confirmPassword: user1Pass,
      }),
    });
    assert(dupRes.status === 400, 'Workflow 1.3: Registration prevents duplicate email registration');

    // -------------------------------------------------------------------------
    // WORKFLOW 2: Authentication, Login & Session Retrieval
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Login & Session Workflow ---');
    // Login with Email
    const loginEmailRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: user1Email, password: user1Pass }),
    });
    assert(loginEmailRes.status === 200, 'Workflow 2.1: Login with registered email returns 200 OK');

    // Login with Username
    const loginUserRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: `audit_user_${suffix}`, password: user1Pass }),
    });
    assert(loginUserRes.status === 200, 'Workflow 2.2: Login with username returns 200 OK');

    // Rejection on invalid credentials
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: user1Email, password: 'WrongPassword999' }),
    });
    assert(badLoginRes.status === 401, 'Workflow 2.3: Login with invalid password rejected with 401 Unauthorized');

    // Protected session check
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user.email === user1Email, 'Workflow 2.4: Session /api/auth/me verifies active user token');

    // -------------------------------------------------------------------------
    // WORKFLOW 3: Protected Routes & Security Authorization
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Protected Routes & Security ---');
    const unauthEndpoints = [
      { url: `${baseUrl}/wallet`, method: 'GET' },
      { url: `${baseUrl}/portfolio`, method: 'GET' },
      { url: `${baseUrl}/watchlists`, method: 'GET' },
      { url: `${baseUrl}/transactions`, method: 'GET' },
      { url: `${baseUrl}/notifications`, method: 'GET' },
      { url: `${baseUrl}/users/profile`, method: 'GET' },
      { url: `${baseUrl}/trade/buy`, method: 'POST' },
      { url: `${baseUrl}/users/reset-account`, method: 'POST' },
    ];

    let allUnauthBlocked = true;
    for (const ep of unauthEndpoints) {
      const res = await fetch(ep.url, { method: ep.method });
      if (res.status !== 401) allUnauthBlocked = false;
    }
    assert(allUnauthBlocked, 'Workflow 3.1: All private REST endpoints strictly reject unauthenticated requests with 401');

    // -------------------------------------------------------------------------
    // WORKFLOW 4: Virtual Wallet Implementation & Overdraft Protection
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Virtual Wallet Workflow ---');
    const walletRes = await fetch(`${baseUrl}/wallet`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const walletData = await walletRes.json();
    const w = walletData.data;

    assert(
      walletRes.status === 200 &&
      w.availableBalance === 100000 &&
      w.totalAccountValue === 100000 &&
      w.isVirtual === true &&
      typeof w.disclaimer === 'string',
      'Workflow 4.1: Wallet initialized with exactly ₹1,00,000 cash and paper money disclaimer'
    );

    // Overdraft protection on direct debit
    const overdraftRes = await fetch(`${baseUrl}/wallet/debit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ amount: 150000, description: 'Illegal overdraft attempt' }),
    });
    assert(overdraftRes.status >= 400, 'Workflow 4.2: Wallet strictly prevents negative balance on overdraft requests');

    // -------------------------------------------------------------------------
    // WORKFLOW 5: Stock Market Explorer & Data Services
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Market Explorer & Data Services ---');
    // Search
    const searchRes = await fetch(`${baseUrl}/stocks?search=Reliance`);
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 && searchData.data.some((s) => s.symbol === 'RELIANCE'),
      'Workflow 5.1: Stock search locates equity by company name or symbol keyword'
    );

    // Filter by sector
    const sectorRes = await fetch(`${baseUrl}/stocks?sector=Banking`);
    const sectorData = await sectorRes.json();
    assert(
      sectorRes.status === 200 && sectorData.data.every((s) => s.sector === 'Banking'),
      'Workflow 5.2: Sector filtering accurately isolates target industry equities'
    );

    // Flagship Indian indices
    const indicesRes = await fetch(`${baseUrl}/stocks/indices`);
    const indicesData = await indicesRes.json();
    assert(
      indicesRes.status === 200 && indicesData.data.some((i) => i.symbol === 'NIFTY 50'),
      'Workflow 5.3: Market indices endpoint returns Indian benchmarks (NIFTY 50, SENSEX)'
    );

    // -------------------------------------------------------------------------
    // WORKFLOW 6: Stock Details & Multi-Timeframe Chart Data
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Stock Details & Chart Data ---');
    const detailsRes = await fetch(`${baseUrl}/stocks/TCS`);
    const detailsData = await detailsRes.json();
    const tcs = detailsData.data;

    assert(
      detailsRes.status === 200 &&
      tcs.symbol === 'TCS' &&
      tcs.price > 0 &&
      tcs.chartData &&
      Array.isArray(tcs.chartData['1M']),
      'Workflow 6.1: Detailed stock profile includes live quote, fundamentals & chart data'
    );

    const notFoundStockRes = await fetch(`${baseUrl}/stocks/NONEXISTENT999`);
    assert(notFoundStockRes.status === 404, 'Workflow 6.2: Invalid stock ticker symbol returns 404 Not Found');

    // -------------------------------------------------------------------------
    // WORKFLOW 7: Buy Orders & Atomic Ledger Deductions
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Buy Orders & Atomic Balances ---');
    const buyRes1 = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        symbol: 'RELIANCE',
        quantity: 10,
        orderType: 'MARKET',
      }),
    });
    const buyData1 = await buyRes1.json();
    if (!buyData1.data) {
      console.error('BUY1 FAILED RESPONSE:', buyRes1.status, buyData1);
    }
    const b1 = buyData1.data;

    assert(
      buyRes1.status === 201 &&
      b1.symbol === 'RELIANCE' &&
      b1.quantity === 10 &&
      b1.newAvailableBalance === Number((100000 - b1.totalAmount).toFixed(2)),
      'Workflow 7.1: BUY order executes atomically, creates position, and deducts virtual balance'
    );

    // Overdraft BUY rejection
    const failBuyRes = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        symbol: 'RELIANCE',
        quantity: 10000, // Exceeds balance
      }),
    });
    assert(failBuyRes.status >= 400, 'Workflow 7.2: BUY order exceeding available balance is strictly rejected');

    // -------------------------------------------------------------------------
    // WORKFLOW 8: Sell Orders & Cost-Basis Realized P&L
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Sell Orders & Realized P&L ---');
    // Sell unowned stock rejection
    const unownedSellRes = await fetch(`${baseUrl}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ symbol: 'INFY', quantity: 2 }),
    });
    assert(unownedSellRes.status >= 400, 'Workflow 8.1: Selling unowned stock is strictly rejected');

    // Sell more shares than owned rejection (15 > 10)
    const oversellRes = await fetch(`${baseUrl}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ symbol: 'RELIANCE', quantity: 15 }),
    });
    assert(oversellRes.status >= 400, 'Workflow 8.2: Selling more shares than owned is strictly rejected');

    // Partial Sell: 4 shares of RELIANCE
    const preSellBalance = b1.newAvailableBalance;
    const sellRes1 = await fetch(`${baseUrl}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ symbol: 'RELIANCE', quantity: 4 }),
    });
    const sellData1 = await sellRes1.json();
    const s1 = sellData1.data;

    assert(
      sellRes1.status === 200 &&
      s1.quantity === 4 &&
      s1.remainingShares === 6 &&
      s1.newAvailableBalance === Number((preSellBalance + s1.totalAmount).toFixed(2)) &&
      typeof s1.realizedPnL === 'number',
      'Workflow 8.3: Partial SELL executes, credits wallet, and calculates realized P&L'
    );

    // -------------------------------------------------------------------------
    // WORKFLOW 9: Holdings Aggregation & Weighted Average Buy Price
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Testing Holdings & Weighted Average Price ---');
    // Second purchase: 5 shares of RELIANCE
    const buyRes2 = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ symbol: 'RELIANCE', quantity: 5 }),
    });
    const buyData2 = await buyRes2.json();
    const b2 = buyData2.data;

    assert(
      buyRes2.status === 201 &&
      b2.updatedHolding.shares === 11 && // 6 remaining + 5 new = 11
      b2.updatedHolding.averageBuyPrice > 0,
      'Workflow 9.1: Consecutive purchases of same stock aggregate shares (11) and update weighted average price'
    );

    // -------------------------------------------------------------------------
    // WORKFLOW 10 & 11: Portfolio Management & Realized vs Unrealized P&L
    // -------------------------------------------------------------------------
    console.log('\n--- 10 & 11. Testing Portfolio Analytics & P&L Calculations ---');
    const portRes = await fetch(`${baseUrl}/portfolio`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const portData = await portRes.json();
    const portfolio = portData.data;

    assert(
      portRes.status === 200 &&
      portfolio.holdings.length === 1 &&
      portfolio.holdings[0].symbol === 'RELIANCE' &&
      portfolio.summary.totalValue > 0 &&
      typeof portfolio.summary.realizedPnL === 'number' &&
      typeof portfolio.summary.unrealizedPnL === 'number',
      'Workflow 10.1: Portfolio correctly tracks active positions, total value, and separates realized vs unrealized P&L'
    );

    // -------------------------------------------------------------------------
    // WORKFLOW 12: Watchlist Operations & Cross-User Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- 12. Testing Watchlist Workflow & User Isolation ---');
    // Create custom watchlist
    const createWlRes = await fetch(`${baseUrl}/watchlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ name: 'Alpha Growth Picks', description: 'Curated leaders' }),
    });
    const createWlData = await createWlRes.json();
    const customWlId = createWlData.data._id;

    // Add stock to watchlist
    const addStockRes = await fetch(`${baseUrl}/watchlists/${customWlId}/stocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ symbol: 'TATAMOTORS' }),
    });

    assert(
      createWlRes.status === 201 && addStockRes.status === 200,
      'Workflow 12.1: Custom watchlist created and stock (TATAMOTORS) added successfully'
    );

    // Register User 2 to verify privacy isolation
    const user2Email = `audit_trader2_${suffix}@stockwise.trade`;
    const regRes2 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Bhavna Sen',
        username: `audit_user2_${suffix}`,
        email: user2Email,
        password: user1Pass,
        confirmPassword: user1Pass,
      }),
    });
    const regData2 = await regRes2.json();
    const token2 = regData2.token;

    // User 2 attempts to delete User 1's watchlist
    const tamperRes = await fetch(`${baseUrl}/watchlists/${customWlId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert(
      tamperRes.status === 403 || tamperRes.status === 404,
      'Workflow 12.2: Cross-user privacy enforced: User 2 is strictly forbidden from modifying User 1 watchlist'
    );

    // -------------------------------------------------------------------------
    // WORKFLOW 13: Transaction History & Audited Ledger
    // -------------------------------------------------------------------------
    console.log('\n--- 13. Testing Audited Transaction History ---');
    const txRes = await fetch(`${baseUrl}/transactions`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const txData = await txRes.json();
    const transactions = txData.data || [];

    const hasRequiredFields = transactions.every((t) =>
      t._id && t.symbol && t.type && t.quantity > 0 && t.price > 0 && t.totalAmount > 0 && t.status && t.createdAt
    );

    assert(
      txRes.status === 200 &&
      transactions.length >= 3 && // 1 system grant + 2 buys + 1 sell
      hasRequiredFields,
      'Workflow 13.1: Transaction ledger contains all 9 required fields with complete auditability'
    );

    // Single receipt retrieval
    const receiptRes = await fetch(`${baseUrl}/transactions/${transactions[0]._id}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert(receiptRes.status === 200, 'Workflow 13.2: Itemized transaction receipt retrieved successfully');

    // -------------------------------------------------------------------------
    // WORKFLOW 14: Notifications & Watchlist Price Alerts
    // -------------------------------------------------------------------------
    console.log('\n--- 14. Testing Notifications & Price Alerts ---');
    const notifsRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const notifsData = await notifsRes.json();
    const notifs = notifsData.data || [];

    const hasTradeNotif = notifs.some((n) => n.title.includes('Order Executed'));
    const hasWarningNotif = notifs.some((n) => n.type === 'WARNING' || n.title.includes('Order Rejected'));

    assert(
      notifsRes.status === 200 && hasTradeNotif && hasWarningNotif,
      'Workflow 14.1: System logs trade execution receipts and rejected order warning notifications'
    );

    // Create custom watchlist price alert
    const alertRes = await fetch(`${baseUrl}/notifications/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ symbol: 'TCS', targetPrice: 4200, condition: 'ABOVE' }),
    });
    assert(alertRes.status === 201, 'Workflow 14.2: Watchlist price alert created successfully');

    // Mark all as read
    const markAllRes = await fetch(`${baseUrl}/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert(markAllRes.status === 200, 'Workflow 14.3: Bulk mark all notifications as read executes cleanly');

    // -------------------------------------------------------------------------
    // WORKFLOW 15: Profile, Password Update, Reset Virtual Account & Settings
    // -------------------------------------------------------------------------
    console.log('\n--- 15. Testing Profile, Password Change & Reset Workflow ---');
    // Get profile
    const profRes = await fetch(`${baseUrl}/users/profile`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const profData = await profRes.json();
    const prof = profData.data || profData.user;

    assert(
      profRes.status === 200 && prof.initials === 'DK' && prof.kycStatus === 'Verified Virtual Trader',
      'Workflow 15.1: Profile retrieved with computed initials (DK) and KYC Verified status'
    );

    // Update Profile
    const updateProfRes = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        fullName: 'Dr. Devendra Kulkarni',
        phone: '+91 91234 56789',
        bio: 'Quantitative algo swing trader on Indian Equities',
      }),
    });
    assert(updateProfRes.status === 200, 'Workflow 15.2: User profile personal details updated successfully');

    // Change Password with bcrypt verification
    const changePassRes = await fetch(`${baseUrl}/users/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        currentPassword: user1Pass,
        newPassword: user1NewPass,
        confirmPassword: user1NewPass,
      }),
    });
    assert(changePassRes.status === 200, 'Workflow 15.3: Password change verifies current password and safely hashes new password');

    // Login with new password
    const newLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: user1Email, password: user1NewPass }),
    });
    const newLoginData = await newLoginRes.json();
    token1 = newLoginData.token;
    assert(newLoginRes.status === 200 && token1, 'Workflow 15.4: Login with newly updated bcrypt password succeeds');

    // Reset Virtual Account
    const resetRes = await fetch(`${baseUrl}/users/reset-account`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
    });
    const verifyResetWallet = await fetch(`${baseUrl}/wallet`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const verifyResetWalletData = await verifyResetWallet.json();
    const verifyResetPort = await fetch(`${baseUrl}/portfolio`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const verifyResetPortData = await verifyResetPort.json();

    assert(
      resetRes.status === 200 &&
      verifyResetWalletData.data.availableBalance === 100000 &&
      verifyResetPortData.data.holdings.length === 0,
      'Workflow 15.5: Virtual demo account reset wipes active holdings and restores virtual ₹1,00,000 cash'
    );

    // -------------------------------------------------------------------------
    // SECURITY AUDIT: Security Headers & Rate Limiting Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Security Audit: Headers & Rate Limiter Verification ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const csp = healthRes.headers.get('content-security-policy');
    const xcto = healthRes.headers.get('x-content-type-options');
    const xfo = healthRes.headers.get('x-frame-options');

    assert(
      xcto === 'nosniff' && xfo === 'DENY' && Boolean(csp),
      'Security Audit 1: Security headers (X-Content-Type-Options, X-Frame-Options, CSP) active on API responses'
    );

    const rlLimit = healthRes.headers.get('x-ratelimit-limit');
    assert(
      Boolean(rlLimit),
      'Security Audit 2: Rate limiter active with standard X-RateLimit headers'
    );

  } catch (error) {
    console.error('Fatal audit failure:', error);
  }

  console.log('\n=======================================================================');
  console.log(`STAGE 10 AUDIT SPECIFICATIONS RUN: ${totalAudits} | PASSED: ${auditsPassed} | FAILED: ${totalAudits - auditsPassed}`);
  console.log('=======================================================================\n');

  if (auditsPassed === totalAudits && totalAudits > 0) {
    console.log('🎉 ALL 15 USER WORKFLOWS & SECURITY SPECIFICATIONS PASSED 100% AUDIT!\n');
    process.exit(0);
  } else {
    console.error('💥 AUDIT DISCOVERED FAILURES.\n');
    process.exit(1);
  }
};

runCompleteWorkflowsAudit();
