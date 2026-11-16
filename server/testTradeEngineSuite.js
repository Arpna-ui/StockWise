import app from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const runTradeEngineSuite = async () => {
  console.log('=======================================================================');
  console.log('   STOCKWISE STAGE 6: VIRTUAL STOCK TRADING ENGINE VERIFICATION SUITE');
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
    // 1. Register fresh test trader with initial ₹1,00,000 virtual capital
    const uniqueSuffix = Date.now();
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Vikram Malhotra',
        username: `trader_${uniqueSuffix}`,
        email: `trader_${uniqueSuffix}@stockwise.trade`,
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

    // 2. Test Insufficient Balance on BUY: Attempting to buy shares exceeding ₹1,00,000
    const overBuyRes = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'RELIANCE',
        quantity: 50, // 50 * ~₹2,984 = ~₹1,49,200 (> ₹1,00,000)
      }),
    });
    const overBuyJson = await overBuyRes.json();
    assert(
      overBuyRes.status >= 400 && overBuyJson.success === false,
      '2. BUY order exceeding available balance is strictly rejected with validation error'
    );

    // Verify balance was NOT altered
    const walletCheckRes = await fetch(`${baseUrl}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const walletCheckJson = await walletCheckRes.json();
    assert(
      walletCheckJson.data.availableBalance === 100000,
      '3. Balance preserved at ₹1,00,000 after rejected buy order (Negative balance prevented)'
    );

    // 3. Test Successful BUY: Buy 10 shares of RELIANCE
    const buy1Res = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'RELIANCE',
        quantity: 10,
        orderType: 'MARKET',
      }),
    });
    const buy1Json = await buy1Res.json();
    const b1 = buy1Json.data;

    assert(
      buy1Res.status === 201 &&
      buy1Json.success &&
      b1.symbol === 'RELIANCE' &&
      b1.quantity === 10 &&
      b1.executionPrice > 0 &&
      b1.totalAmount === Number((10 * b1.executionPrice).toFixed(2)) &&
      b1.updatedHolding.shares === 10 &&
      b1.updatedHolding.averageBuyPrice === b1.executionPrice,
      '4. Successful BUY order: 10 shares of RELIANCE executed and holding created'
    );

    const balanceAfterBuy1 = b1.newAvailableBalance;
    assert(
      balanceAfterBuy1 === Number((100000 - b1.totalAmount).toFixed(2)),
      '5. Virtual money deducted accurately from wallet after buy execution'
    );

    // 4. Test Multiple Purchases of the Same Stock (Recalculating Average Purchase Price)
    const buy2Res = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'RELIANCE',
        quantity: 10,
        orderType: 'MARKET',
      }),
    });
    const buy2Json = await buy2Res.json();
    const b2 = buy2Json.data;

    assert(
      buy2Res.status === 201 &&
      b2.updatedHolding.shares === 20 &&
      b2.newAvailableBalance === Number((balanceAfterBuy1 - b2.totalAmount).toFixed(2)),
      '6. Multiple purchases of same stock correctly aggregates shares to 20 and updates wallet'
    );

    // 5. Buy another distinct stock (5 shares of TCS)
    const buyTcsRes = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'TCS',
        quantity: 5,
      }),
    });
    const buyTcsJson = await buyTcsRes.json();
    assert(
      buyTcsRes.status === 201 && buyTcsJson.data.symbol === 'TCS' && buyTcsJson.data.quantity === 5,
      '7. Successful BUY order for second distinct stock (5 shares of TCS)'
    );

    // 6. Test Insufficient Holdings on SELL:
    // a. Stock not owned at all
    const sellUnownedRes = await fetch(`${baseUrl}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'INFY',
        quantity: 5,
      }),
    });
    const sellUnownedJson = await sellUnownedRes.json();
    assert(
      sellUnownedRes.status >= 400 && sellUnownedJson.success === false,
      '8. SELL order for unowned stock (INFY) strictly rejected with error'
    );

    // b. Selling more shares than owned (owning 20 RELIANCE, trying to sell 25)
    const oversellRes = await fetch(`${baseUrl}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'RELIANCE',
        quantity: 25,
      }),
    });
    const oversellJson = await oversellRes.json();
    assert(
      oversellRes.status >= 400 && oversellJson.success === false,
      '9. Selling more shares than currently owned (25 > 20) strictly rejected'
    );

    // 7. Test Partial Selling: Sell 8 shares of RELIANCE (leaving 12)
    const prePartialWallet = buyTcsJson.data.newAvailableBalance;
    const partialSellRes = await fetch(`${baseUrl}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'RELIANCE',
        quantity: 8,
      }),
    });
    const partialSellJson = await partialSellRes.json();
    const s1 = partialSellJson.data;

    assert(
      partialSellRes.status === 200 &&
      s1.quantity === 8 &&
      s1.remainingShares === 12 &&
      s1.isFullSale === false &&
      s1.newAvailableBalance === Number((prePartialWallet + s1.totalAmount).toFixed(2)),
      '10. Partial SELL order: 8 shares sold, exactly 12 shares retained, wallet credited'
    );

    // Verify cost-basis and realized P&L calculation
    assert(
      s1.costBasis > 0 && s1.realizedPnL !== undefined,
      '11. Consistent average cost-basis and realized P&L calculated on partial liquidation'
    );

    // 8. Test Full Selling: Sell remaining 12 shares of RELIANCE (100% liquidation)
    const fullSellRes = await fetch(`${baseUrl}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'RELIANCE',
        quantity: 12,
      }),
    });
    const fullSellJson = await fullSellRes.json();
    const s2 = fullSellJson.data;

    assert(
      fullSellRes.status === 200 &&
      s2.quantity === 12 &&
      s2.remainingShares === 0 &&
      s2.isFullSale === true,
      '12. Full SELL order: Remaining 12 shares liquidated (100% position closed)'
    );

    // 9. Verify Portfolio State after Trades
    const portRes = await fetch(`${baseUrl}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const portJson = await portRes.json();
    const holdings = portJson.data.holdings;

    assert(
      portRes.status === 200 &&
      !holdings.some((h) => h.symbol === 'RELIANCE') &&
      holdings.some((h) => h.symbol === 'TCS' && h.shares === 5),
      '13. Portfolio holdings updated: Fully liquidated RELIANCE removed, active TCS retained'
    );

    // 10. Verify Transaction Audit Ledger
    const txRes = await fetch(`${baseUrl}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const txJson = await txRes.json();
    const txs = txJson.data;

    assert(
      txRes.status === 200 &&
      Array.isArray(txs) &&
      txs.some((t) => t.type === 'BUY' && t.symbol === 'RELIANCE') &&
      txs.some((t) => t.type === 'BUY' && t.symbol === 'TCS') &&
      txs.some((t) => t.type === 'SELL' && t.symbol === 'RELIANCE') &&
      txs.every((t) => t.price > 0 && t.quantity > 0 && t.executionDate),
      '14. Auditable transaction history logs every trade with prices, quantities, and timestamps'
    );

    // 11. Test User Holding Endpoint
    const holdingRes = await fetch(`${baseUrl}/trade/holding/TCS`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const holdingJson = await holdingRes.json();
    assert(
      holdingRes.status === 200 &&
      holdingJson.data.symbol === 'TCS' &&
      holdingJson.data.shares === 5,
      '15. GET /api/trade/holding/:symbol accurately returns active position for trading UI'
    );

    // 12. Unauthenticated Trade Protection
    const unauthBuyRes = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: 'TCS', quantity: 1 }),
    });
    assert(
      unauthBuyRes.status === 401,
      '16. Unauthenticated BUY order rejected with 401 Unauthorized'
    );

    const unauthSellRes = await fetch(`${baseUrl}/trade/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: 'TCS', quantity: 1 }),
    });
    assert(
      unauthSellRes.status === 401,
      '17. Unauthenticated SELL order rejected with 401 Unauthorized'
    );

    console.log(`\nAll ${testsPassed} of ${totalTests} Stage 6 Trading Engine tests passed (${((testsPassed / totalTests) * 100).toFixed(0)}% success rate)!`);
  } catch (err) {
    console.error('Trading engine test suite error:', err);
    process.exit(1);
  } finally {
    setTimeout(() => {
      process.exit(0);
    }, 200);
  }
};

runTradeEngineSuite();
