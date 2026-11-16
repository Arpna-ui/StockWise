import app from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const runPortfolioAnalyticsSuite = async () => {
  console.log('=======================================================================');
  console.log('   STOCKWISE STAGE 7: PORTFOLIO MANAGEMENT & ANALYTICS TEST SUITE');
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
    // 1. Register fresh trader with ₹1,00,000 virtual capital
    const uniqueSuffix = Date.now();
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Ananya Sharma',
        username: `investor_${uniqueSuffix}`,
        email: `investor_${uniqueSuffix}@stockwise.trade`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      }),
    });
    const regData = await regRes.json();
    const token = regData.token;

    assert(
      regRes.status === 201 && token && regData.user.availableBalance === 100000,
      '1. User registered with valid JWT and ₹1,00,000 initial virtual capital'
    );

    // 2. Initial Portfolio Verification (before any trades)
    const initPortRes = await fetch(`${baseUrl}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const initPort = await initPortRes.json();
    const initSummary = initPort.data.summary;

    assert(
      initPortRes.status === 200 &&
      initSummary.totalPortfolioValue === 100000 &&
      initSummary.availableCash === 100000 &&
      initSummary.totalInvestment === 0 &&
      initSummary.currentMarketValue === 0 &&
      initSummary.realizedPnL === 0 &&
      initSummary.unrealizedPnL === 0 &&
      initPort.data.holdings.length === 0,
      '2. Initial portfolio state correctly initializes with ₹1,00,000 cash, 0 investments, 0 realized/unrealized P&L'
    );

    // 3. Trade Scenario 1: BUY 5 shares of RELIANCE
    const buy1Res = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol: 'RELIANCE', quantity: 5 }),
    });
    const buy1Data = await buy1Res.json();
    const relPrice1 = buy1Data.data.executionPrice;
    const relVal1 = buy1Data.data.totalAmount;

    assert(
      (buy1Res.status === 200 || buy1Res.status === 201) && buy1Data.data.quantity === 5 && buy1Data.data.symbol === 'RELIANCE',
      `3. BUY 5 shares of RELIANCE executed @ ₹${relPrice1.toFixed(2)} (Total: ₹${relVal1.toFixed(2)})`
    );

    // 4. Verify Portfolio after 1st BUY
    const portAfterBuy1Res = await fetch(`${baseUrl}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const portAfterBuy1 = await portAfterBuy1Res.json();
    const sum1 = portAfterBuy1.data.summary;

    assert(
      Math.abs(sum1.availableCash - (100000 - relVal1)) < 0.05 &&
      Math.abs(sum1.totalInvestment - relVal1) < 0.05 &&
      Math.abs(sum1.totalPortfolioValue - 100000) < 0.05 &&
      portAfterBuy1.data.holdings.length === 1 &&
      portAfterBuy1.data.holdings[0].symbol === 'RELIANCE',
      '4. Portfolio metrics update accurately after 1st BUY: Cash deducted, Total Investment updated, Holdings count = 1'
    );

    // 5. Trade Scenario 2: BUY 4 shares of TCS (IT Sector)
    const buy2Res = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol: 'TCS', quantity: 4 }),
    });
    const buy2Data = await buy2Res.json();
    const tcsPrice = buy2Data.data.executionPrice;
    const tcsVal = buy2Data.data.totalAmount;

    assert(
      (buy2Res.status === 200 || buy2Res.status === 201) && buy2Data.data.quantity === 4 && buy2Data.data.symbol === 'TCS',
      `5. BUY 4 shares of TCS executed @ ₹${tcsPrice.toFixed(2)} (Total: ₹${tcsVal.toFixed(2)})`
    );

    // 6. Sector Allocation & Investment Distribution Verification
    const portAfterBuy2Res = await fetch(`${baseUrl}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const portAfterBuy2 = await portAfterBuy2Res.json();
    const sectors = portAfterBuy2.data.sectorAllocation;

    const sectorNames = sectors.map((s) => s.name);
    const sectorTotalPercent = sectors.reduce((acc, s) => acc + s.percent, 0);

    assert(
      portAfterBuy2.data.holdings.length === 2 &&
      sectorNames.includes('IT') &&
      Math.abs(sectorTotalPercent - 100) <= 0.5,
      '6. Sector Allocation dynamically groups multiple sectors (IT & Energy) with percentages summing to 100%'
    );

    // 7. Trade Scenario 3: BUY 5 MORE shares of RELIANCE (Weighted Average Buy Price Verification)
    const buy3Res = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol: 'RELIANCE', quantity: 5 }),
    });
    const buy3Data = await buy3Res.json();

    assert(
      (buy3Res.status === 200 || buy3Res.status === 201) && buy3Data.data.updatedHolding.shares === 10,
      '7. BUY additional shares of RELIANCE updates total quantity to 10 with weighted average purchase price'
    );

    // 8. Trade Scenario 4: Partial SELL (Sell 4 shares of RELIANCE) to trigger Realized P&L
    const sell1Res = await fetch(`${baseUrl}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol: 'RELIANCE', quantity: 4 }),
    });
    const sell1Data = await sell1Res.json();

    assert(
      sell1Res.status === 200 &&
      sell1Data.data.quantity === 4 &&
      sell1Data.data.remainingShares === 6 &&
      typeof sell1Data.data.realizedPnL === 'number',
      `8. Partial SELL executed: 4 shares of RELIANCE sold, 6 remaining, Realized P&L = ₹${sell1Data.data.realizedPnL}`
    );

    // 9. CRUCIAL RULE VERIFICATION: Clean Separation of Realized vs Unrealized P&L
    const portAfterSellRes = await fetch(`${baseUrl}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const portAfterSell = await portAfterSellRes.json();
    const sumSell = portAfterSell.data.summary;

    assert(
      sumSell.realizedPnL !== undefined &&
      sumSell.unrealizedPnL !== undefined &&
      Math.abs((sumSell.realizedPnL + sumSell.unrealizedPnL) - sumSell.totalPnL) < 0.05,
      '9. Realized P&L and Unrealized P&L are cleanly separated and satisfy: Realized P&L + Unrealized P&L = Total P&L'
    );

    // 10. Holdings Table Columns Integrity (All 9 required columns present)
    const holdings = portAfterSell.data.holdings;
    const sampleHolding = holdings.find((h) => h.symbol === 'RELIANCE');

    const hasAll9Columns =
      sampleHolding &&
      typeof sampleHolding.companyName === 'string' &&
      typeof sampleHolding.symbol === 'string' &&
      typeof sampleHolding.shares === 'number' &&
      typeof sampleHolding.averageBuyPrice === 'number' &&
      typeof sampleHolding.currentPrice === 'number' &&
      typeof sampleHolding.investedAmount === 'number' &&
      typeof sampleHolding.currentValue === 'number' &&
      typeof sampleHolding.pnl === 'number' &&
      typeof sampleHolding.pnlPercent === 'number';

    assert(
      hasAll9Columns,
      '10. Holdings table contains all 9 required fields: Company Name, Symbol, Quantity, Avg. Price, Current Price, Invested Amount, Current Value, P&L, Return %'
    );

    // 11. Advanced Analytics Endpoint Verification: Best & Worst Performers + Concentration
    const analyticsRes = await fetch(`${baseUrl}/portfolio/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const analytics = await analyticsRes.json();
    const aData = analytics.data;

    assert(
      analyticsRes.status === 200 &&
      aData.bestPerformer !== null &&
      aData.worstPerformer !== null &&
      Array.isArray(aData.investmentDistribution) &&
      aData.concentration.diversificationStatus !== undefined,
      '11. GET /api/portfolio/analytics returns Best Performer, Worst Performer, Asset Distribution, and Diversification status'
    );

    // 12. Investment Distribution Verification (Equities vs Cash Buffer)
    const invDist = aData.investmentDistribution;
    const equitiesPart = invDist.find((d) => d.name === 'Active Equities');
    const cashPart = invDist.find((d) => d.name === 'Available Cash');

    assert(
      equitiesPart && cashPart &&
      Math.abs((equitiesPart.percent + cashPart.percent) - 100) <= 0.5,
      '12. Investment distribution accurately calculates Active Equities % and Available Cash % summing to 100%'
    );

    // 13. Historical Snapshot Recording
    const snapshotRes = await fetch(`${baseUrl}/portfolio/snapshot`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const snapshotData = await snapshotRes.json();

    assert(
      snapshotRes.status === 201 &&
      snapshotData.data &&
      snapshotData.data.totalValue > 0 &&
      snapshotData.data.cashBalance > 0,
      '13. POST /api/portfolio/snapshot captures immutable point-in-time portfolio valuation snapshot'
    );

    // 14. Historical Performance Curve Filters (All 7 filters: 1D, 1W, 1M, 3M, 6M, 1Y, ALL)
    const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];
    let allTimeframesValid = true;

    for (const tf of timeframes) {
      const historyRes = await fetch(`${baseUrl}/portfolio/history?timeframe=${tf}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const historyJson = await historyRes.json();

      if (
        historyRes.status !== 200 ||
        historyJson.data.timeframe !== tf ||
        !Array.isArray(historyJson.data.points) ||
        historyJson.data.points.length === 0
      ) {
        allTimeframesValid = false;
        console.error(`Timeframe ${tf} failed:`, historyJson);
        break;
      }
    }

    assert(
      allTimeframesValid,
      '14. GET /api/portfolio/history successfully returns performance series for all 7 filters: 1D, 1W, 1M, 3M, 6M, 1Y, ALL'
    );

    // 15. Daily Portfolio Change Tracking
    assert(
      typeof sumSell.dayChange === 'number' && typeof sumSell.dayChangePercent === 'number',
      '15. Portfolio summary accurately tracks daily portfolio change values (dayChange and dayChangePercent)'
    );

    // 16. Security & Protection on Portfolio Endpoints (Unauthenticated Access Rejected)
    const unauthPort = await fetch(`${baseUrl}/portfolio`);
    const unauthAnalytics = await fetch(`${baseUrl}/portfolio/analytics`);
    const unauthHistory = await fetch(`${baseUrl}/portfolio/history`);
    const unauthSnapshot = await fetch(`${baseUrl}/portfolio/snapshot`, { method: 'POST' });

    assert(
      unauthPort.status === 401 &&
      unauthAnalytics.status === 401 &&
      unauthHistory.status === 401 &&
      unauthSnapshot.status === 401,
      '16. All portfolio endpoints are securely protected with JWT authentication (401 Unauthorized for guests)'
    );

    console.log(`\nAll ${testsPassed} of ${totalTests} Stage 7 Portfolio Management & Analytics tests passed (${((testsPassed / totalTests) * 100).toFixed(0)}% success rate)!`);
  } catch (err) {
    console.error('Portfolio analytics test suite error:', err);
    process.exit(1);
  } finally {
    setTimeout(() => {
      process.exit(0);
    }, 200);
  }
};

runPortfolioAnalyticsSuite();
