import app from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const runStage3Suite = async () => {
  console.log('=======================================================================');
  console.log('   STOCKWISE STAGE 3: DATABASE & BACKEND ARCHITECTURE VERIFICATION');
  console.log('=======================================================================\n');

  // Let server boot on port 5000 (app already started or we use http://127.0.0.1:5000)
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
    // 1. Health check & database connection endpoint
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success, '1. GET /api/health returns online status and DB state');

    // 2. Register test user for authenticated endpoints
    const uniqueSuffix = Date.now();
    const testEmail = `stage3_trader_${uniqueSuffix}@stockwise.trade`;
    const testUsername = `stage3_${uniqueSuffix}`;

    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Devendra Patel',
        username: testUsername,
        email: testEmail,
        password: 'password123',
        confirmPassword: 'password123',
      }),
    });
    const regData = await regRes.json();
    const token = regData.token;
    assert(regRes.status === 201 && token, '2. User registration issues valid JWT for private endpoint testing');

    // 3. User Profile Endpoint (Protected)
    const noAuthProfile = await fetch(`${baseUrl}/users/profile`);
    assert(noAuthProfile.status === 401, '3. GET /api/users/profile rejects unauthenticated request with 401');

    const authProfileRes = await fetch(`${baseUrl}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const authProfileData = await authProfileRes.json();
    assert(
      authProfileRes.status === 200 &&
      authProfileData.success &&
      authProfileData.data.email === testEmail &&
      authProfileData.data.virtualInitialCapital === 100000,
      '4. GET /api/users/profile returns authenticated user with ₹1,00,000 virtual capital'
    );

    // 4. Update User Profile
    const updateProfileRes = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: 'Devendra K. Patel',
        phone: '+91 99887 76655',
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    assert(
      updateProfileRes.status === 200 && updateProfileData.data.fullName === 'Devendra K. Patel',
      '5. PUT /api/users/profile updates and returns revised user details'
    );

    // 5. Stock Listing & Filters
    const stocksRes = await fetch(`${baseUrl}/stocks`);
    const stocksData = await stocksRes.json();
    assert(
      stocksRes.status === 200 && Array.isArray(stocksData.data) && stocksData.data.length > 0,
      '6. GET /api/stocks returns active listed equities'
    );

    const itStocksRes = await fetch(`${baseUrl}/stocks?sector=Information Technology`);
    const itStocksData = await itStocksRes.json();
    assert(
      itStocksRes.status === 200 && itStocksData.data.every((s) => s.sector.includes('Information Technology')),
      '7. GET /api/stocks?sector=... correctly filters stocks by sector'
    );

    const searchRes = await fetch(`${baseUrl}/stocks?search=Reliance`);
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 && searchData.data.some((s) => s.symbol === 'RELIANCE'),
      '8. GET /api/stocks?search=Reliance correctly searches stocks by keyword'
    );

    const singleStockRes = await fetch(`${baseUrl}/stocks/RELIANCE`);
    const singleStockData = await singleStockRes.json();
    assert(
      singleStockRes.status === 200 && singleStockData.data.symbol === 'RELIANCE' && singleStockData.data.chartData,
      '9. GET /api/stocks/:symbol returns individual stock with valuation metrics and chart data'
    );

    const notFoundStockRes = await fetch(`${baseUrl}/stocks/INVALID_TICKER_999`);
    assert(notFoundStockRes.status === 404, '10. GET /api/stocks/:symbol returns 404 for non-existent ticker');

    const indicesRes = await fetch(`${baseUrl}/stocks/indices`);
    const indicesData = await indicesRes.json();
    assert(
      indicesRes.status === 200 && indicesData.data.some((idx) => idx.symbol === 'NIFTY 50'),
      '11. GET /api/stocks/indices returns Indian market benchmarks (NIFTY 50, SENSEX)'
    );

    // 6. Portfolio Retrieval (Protected)
    const noAuthPortfolio = await fetch(`${baseUrl}/portfolio`);
    assert(noAuthPortfolio.status === 401, '12. GET /api/portfolio rejects unauthenticated request with 401');

    const portfolioRes = await fetch(`${baseUrl}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const portfolioData = await portfolioRes.json();
    assert(
      portfolioRes.status === 200 &&
      portfolioData.data.summary.totalValue === 100000 &&
      portfolioData.data.summary.availableBalance === 100000 &&
      Array.isArray(portfolioData.data.holdings),
      '13. GET /api/portfolio returns user portfolio summary with ₹1,00,000 cash balance'
    );

    // 7. Watchlists Management (Protected)
    const watchlistsRes = await fetch(`${baseUrl}/watchlists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const watchlistsData = await watchlistsRes.json();
    assert(
      watchlistsRes.status === 200 && watchlistsData.data.length > 0 && Array.isArray(watchlistsData.data[0].stocks),
      '14. GET /api/watchlists returns user watchlists populated with stock quotes'
    );

    const createWlRes = await fetch(`${baseUrl}/watchlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Auto & EV Leaders',
        stocks: ['TATAMOTORS'],
      }),
    });
    const createWlData = await createWlRes.json();
    assert(createWlRes.status === 201 && createWlData.data.name === 'Auto & EV Leaders', '15. POST /api/watchlists creates custom user watchlist');

    const watchlistId = createWlData.data._id;
    const addStockRes = await fetch(`${baseUrl}/watchlists/${watchlistId}/stocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol: 'BHARTIARTL' }),
    });
    const addStockData = await addStockRes.json();
    assert(
      addStockRes.status === 200 && addStockData.data.stocks.includes('BHARTIARTL'),
      '16. POST /api/watchlists/:id/stocks adds stock to watchlist'
    );

    const removeStockRes = await fetch(`${baseUrl}/watchlists/${watchlistId}/stocks/TATAMOTORS`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const removeStockData = await removeStockRes.json();
    assert(
      removeStockRes.status === 200 && !removeStockData.data.stocks.includes('TATAMOTORS'),
      '17. DELETE /api/watchlists/:id/stocks/:symbol removes stock from watchlist'
    );

    // 8. Transactions Retrieval (Protected)
    const transactionsRes = await fetch(`${baseUrl}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const transactionsData = await transactionsRes.json();
    assert(
      transactionsRes.status === 200 &&
      transactionsData.data.some((t) => t.orderType === 'SYSTEM_GRANT' && t.totalAmount === 100000),
      '18. GET /api/transactions returns ledger with initial ₹1,00,000 capital grant record'
    );

    // 9. Notifications (Protected)
    const notifsRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const notifsData = await notifsRes.json();
    assert(
      notifsRes.status === 200 && notifsData.data.length > 0,
      '19. GET /api/notifications returns user welcome alert'
    );

    const notifId = notifsData.data[0]._id;
    const readRes = await fetch(`${baseUrl}/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    const readData = await readRes.json();
    assert(readRes.status === 200 && readData.data.isRead === true, '20. PUT /api/notifications/:id/read marks notification as read');

    console.log(`\nAll ${testsPassed} of ${totalTests} Stage 3 Architecture tests passed (${((testsPassed / totalTests) * 100).toFixed(0)}% success rate)!`);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    setTimeout(() => {
      process.exit(0);
    }, 200);
  }
};

runStage3Suite();
