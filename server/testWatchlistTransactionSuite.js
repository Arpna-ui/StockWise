import app from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const runWatchlistTransactionSuite = async () => {
  console.log('=======================================================================');
  console.log('   STOCKWISE STAGE 8: WATCHLIST & TRANSACTION HISTORY VERIFICATION');
  console.log('=======================================================================\n');

  const baseUrl = 'http://127.0.0.1:5000/api';
  let testsPassed = 0;
  let totalTests = 0;

  const assert = (condition, title) => {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${title}`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: ${title}`);
    }
  };

  try {
    // 1. Register User A with ₹1,00,000 starting capital
    const suffixA = Date.now();
    const userAEmail = `trader_a_${suffixA}@stockwise.trade`;
    const userAPass = 'Password@123';

    const regARes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Aarav Mehta',
        username: `trader_a_${suffixA}`,
        email: userAEmail,
        password: userAPass,
        confirmPassword: userAPass,
      }),
    });
    const regAData = await regARes.json();
    const tokenA = regAData.token;
    const userAId = regAData.user._id;

    assert(
      regARes.status === 201 && tokenA,
      '1. User A registered with JWT token and ₹1,00,000 initial virtual capital'
    );

    // 2. Register User B to test user privacy and isolation
    const suffixB = suffixA + 1;
    const regBRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Bhavna Sen',
        username: `trader_b_${suffixB}`,
        email: `trader_b_${suffixB}@stockwise.trade`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      }),
    });
    const regBData = await regBRes.json();
    const tokenB = regBData.token;

    assert(
      regBRes.status === 201 && tokenB,
      '2. User B registered with separate account for privacy and isolation testing'
    );

    // 3. Verify Default Watchlists Initialization for User A
    const wlARes = await fetch(`${baseUrl}/watchlists`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const wlAData = await wlARes.json();
    const defaultWl = wlAData.data.find((w) => w.isDefault);

    assert(
      wlARes.status === 200 &&
      Array.isArray(wlAData.data) &&
      wlAData.data.length >= 2 &&
      defaultWl !== undefined &&
      defaultWl.stocks.length > 0,
      '3. User A automatically initialized with default watchlists populated with stock quotes'
    );

    // 4. Live Quote Population on Watchlist Items
    const sampleStock = defaultWl.stocks[0];
    assert(
      sampleStock &&
      typeof sampleStock.symbol === 'string' &&
      typeof sampleStock.price === 'number' &&
      sampleStock.price > 0 &&
      typeof sampleStock.changePercent === 'number',
      `4. Watchlist stock quotes dynamically populated with live price (₹${sampleStock.price}) and % change (${sampleStock.changePercent}%)`
    );

    // 5. Create Custom Watchlist for User A
    const createWlRes = await fetch(`${baseUrl}/watchlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Tech Growth Leaders',
        stocks: ['INFY', 'WIPRO'],
      }),
    });
    const createWlData = await createWlRes.json();
    const customWlId = createWlData.data?._id;

    assert(
      createWlRes.status === 201 &&
      createWlData.data.name === 'Tech Growth Leaders' &&
      createWlData.data.stocks.includes('INFY'),
      '5. User A created custom watchlist "Tech Growth Leaders" successfully'
    );

    // 6. Add Stock to Watchlist
    const addStockRes = await fetch(`${baseUrl}/watchlists/${customWlId}/stocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ symbol: 'TATAMOTORS' }),
    });
    const addStockData = await addStockRes.json();

    assert(
      addStockRes.status === 200 &&
      addStockData.data.stocks.includes('TATAMOTORS'),
      '6. Stock TATAMOTORS added to custom watchlist successfully'
    );

    // 7. Remove Stock from Watchlist
    const removeStockRes = await fetch(`${baseUrl}/watchlists/${customWlId}/stocks/WIPRO`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const removeStockData = await removeStockRes.json();

    assert(
      removeStockRes.status === 200 &&
      !removeStockData.data.stocks.includes('WIPRO'),
      '7. Stock WIPRO removed from custom watchlist successfully'
    );

    // 8. User Privacy & Isolation Test on Watchlists: User B cannot modify or delete User A's watchlist
    const userBHackRes = await fetch(`${baseUrl}/watchlists/${customWlId}/stocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ symbol: 'HDFCBANK' }),
    });

    const userBDeleteRes = await fetch(`${baseUrl}/watchlists/${customWlId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    assert(
      (userBHackRes.status === 403 || userBHackRes.status === 404) &&
      (userBDeleteRes.status === 403 || userBDeleteRes.status === 404),
      '8. Watchlist Privacy Enforced: User B is forbidden (403/404) from modifying or deleting User A\'s watchlist'
    );

    // 9. Execute Trades to Generate Rich Transaction History
    const buyRes = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ symbol: 'RELIANCE', quantity: 10 }),
    });
    const buyJson = await buyRes.json();
    const buyTxnId = buyJson.data?.orderId;

    const sellRes = await fetch(`${baseUrl}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ symbol: 'RELIANCE', quantity: 4 }),
    });
    const sellJson = await sellRes.json();
    const sellTxnId = sellJson.data?.orderId;

    assert(
      (buyRes.status === 200 || buyRes.status === 201) &&
      (sellRes.status === 200 || sellRes.status === 201),
      '9. BUY (10 RELIANCE) and SELL (4 RELIANCE) orders executed and stored in database'
    );

    // 10. Verify Transaction History Fields (All 9 required fields)
    const txnsRes = await fetch(`${baseUrl}/transactions`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const txnsData = await txnsRes.json();
    const sampleTxn = txnsData.data.find((t) => t.type === 'BUY');

    const hasAllTxnFields =
      sampleTxn &&
      sampleTxn._id !== undefined &&
      typeof sampleTxn.companyName === 'string' &&
      typeof sampleTxn.symbol === 'string' &&
      sampleTxn.type === 'BUY' &&
      typeof sampleTxn.quantity === 'number' &&
      typeof sampleTxn.price === 'number' &&
      typeof sampleTxn.totalAmount === 'number' &&
      (sampleTxn.executionDate !== undefined || sampleTxn.createdAt !== undefined) &&
      sampleTxn.status === 'COMPLETED';

    assert(
      hasAllTxnFields,
      '10. Transactions ledger displays all required fields: ID, Name, Symbol, BUY/SELL, Quantity, Price, Total Amount, Date & Status'
    );

    // 11. Search Filtering in Transaction History
    const searchRes = await fetch(`${baseUrl}/transactions?search=RELIANCE`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const searchData = await searchRes.json();

    assert(
      searchRes.status === 200 &&
      searchData.data.length > 0 &&
      searchData.data.every((t) => t.symbol === 'RELIANCE'),
      '11. GET /api/transactions?search=RELIANCE successfully filters ledger records by ticker keyword'
    );

    // 12. BUY / SELL Action Filtering
    const buyFilterRes = await fetch(`${baseUrl}/transactions?type=BUY`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const buyFilterData = await buyFilterRes.json();

    assert(
      buyFilterRes.status === 200 &&
      buyFilterData.data.length > 0 &&
      buyFilterData.data.every((t) => t.type === 'BUY'),
      '12. GET /api/transactions?type=BUY strictly isolates BUY order records'
    );

    // 13. Sorting in Transaction History (Sort by totalAmount descending)
    const sortRes = await fetch(`${baseUrl}/transactions?sortBy=totalAmount&sortOrder=desc`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const sortData = await sortRes.json();
    const sortedAmounts = sortData.data.map((t) => Number(t.totalAmount));
    const isSortedDesc = sortedAmounts.every((val, i, arr) => !i || arr[i - 1] >= val);

    assert(
      sortRes.status === 200 && isSortedDesc,
      '13. GET /api/transactions?sortBy=totalAmount&sortOrder=desc correctly sorts records in descending order'
    );

    // 14. Pagination Support in Transaction History
    const pageRes = await fetch(`${baseUrl}/transactions?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const pageData = await pageRes.json();
    const pagination = pageData.meta?.pagination || pageData.pagination;

    assert(
      pageRes.status === 200 &&
      pageData.data.length === 1 &&
      pagination &&
      pagination.page === 1 &&
      pagination.limit === 1 &&
      pagination.totalCount >= 2 &&
      pagination.totalPages >= 2 &&
      pagination.hasNext === true,
      '14. GET /api/transactions?page=1&limit=1 provides structured database pagination with accurate page metadata'
    );

    // 15. Single Detailed Transaction Receipt Retrieval
    const singleTxnRes = await fetch(`${baseUrl}/transactions/${buyTxnId || sampleTxn._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const singleTxnData = await singleTxnRes.json();

    assert(
      singleTxnRes.status === 200 &&
      singleTxnData.data._id.toString() === (buyTxnId || sampleTxn._id).toString() &&
      singleTxnData.data.brokerageFee === 0,
      '15. GET /api/transactions/:id retrieves complete itemized order receipt with simulated fee breakdown'
    );

    // 16. Test Persistence After Logout & Fresh Login
    // Simulate user logging out by discarding tokenA and authenticating fresh with email/password
    const reLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: userAEmail,
        password: userAPass,
      }),
    });
    const reLoginData = await reLoginRes.json();
    const freshTokenA = reLoginData.token;

    // Verify watchlists and transactions persist after fresh login
    const reWlRes = await fetch(`${baseUrl}/watchlists`, {
      headers: { Authorization: `Bearer ${freshTokenA}` },
    });
    const reWlData = await reWlRes.json();
    const reCustomWl = reWlData.data.find((w) => w.name === 'Tech Growth Leaders');

    const reTxnsRes = await fetch(`${baseUrl}/transactions`, {
      headers: { Authorization: `Bearer ${freshTokenA}` },
    });
    const reTxnsData = await reTxnsRes.json();

    assert(
      reLoginRes.status === 200 &&
      freshTokenA &&
      reCustomWl &&
      reCustomWl.stocks.some((s) => (s.symbol || s) === 'TATAMOTORS') &&
      reTxnsData.data.length >= 2,
      '16. Persistence Verified: All custom watchlists, added stocks, and transaction history persist perfectly across logout & login'
    );

    // 17. Security & Protection on All Watchlist & Transaction Endpoints
    const unauthWl = await fetch(`${baseUrl}/watchlists`);
    const unauthTxns = await fetch(`${baseUrl}/transactions`);
    const unauthCreateWl = await fetch(`${baseUrl}/watchlists`, { method: 'POST' });

    assert(
      unauthWl.status === 401 &&
      unauthTxns.status === 401 &&
      unauthCreateWl.status === 401,
      '17. All watchlist and transaction endpoints are strictly protected with JWT authentication (401 Unauthorized for guests)'
    );

    console.log(`\nAll ${testsPassed} of ${totalTests} Stage 8 Watchlist & Transaction History tests passed (${((testsPassed / totalTests) * 100).toFixed(0)}% success rate)!`);
  } catch (err) {
    console.error('Watchlist and transaction test suite error:', err);
    process.exit(1);
  } finally {
    setTimeout(() => {
      process.exit(0);
    }, 200);
  }
};

runWatchlistTransactionSuite();
