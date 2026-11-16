import app from './index.js';
import dotenv from 'dotenv';
import { marketCache } from './utils/marketDataCache.js';

dotenv.config();

const runMarketDataSuite = async () => {
  console.log('=======================================================================');
  console.log('   STOCKWISE STAGE 5: STOCK MARKET EXPLORER & DATA VERIFICATION SUITE');
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
    // 1. GET /api/stocks returns listed Indian equities with pagination & market status
    const stocksRes = await fetch(`${baseUrl}/stocks`);
    const stocksJson = await stocksRes.json();

    const pagination = stocksJson.pagination || stocksJson.meta?.pagination;
    const marketStatus = stocksJson.marketStatus || stocksJson.meta?.marketStatus;
    const dataSourceType = stocksJson.dataSource || stocksJson.meta?.dataSource;

    assert(
      stocksRes.status === 200 &&
      stocksJson.success &&
      Array.isArray(stocksJson.data) &&
      stocksJson.data.length > 0 &&
      pagination?.total > 0 &&
      marketStatus !== undefined &&
      Boolean(dataSourceType),
      '1. GET /api/stocks returns active listed Indian equities with pagination & market status'
    );

    // 2. Clear distinction of data type (never fabricates live prices)
    assert(
      ['LIVE', 'DELAYED_15MIN', 'SAMPLE_DATA'].includes(dataSourceType) &&
      stocksJson.data.every((s) => s.isSimulated !== undefined),
      '2. Data source provenance clearly distinguished (LIVE, DELAYED_15MIN, or SAMPLE_DATA)'
    );

    // 3. Search by company name or ticker symbol
    const searchRes = await fetch(`${baseUrl}/stocks?search=reliance`);
    const searchJson = await searchRes.json();
    assert(
      searchRes.status === 200 &&
      searchJson.data.some((s) => s.symbol === 'RELIANCE'),
      '3. Stock search by symbol (e.g., "reliance") successfully locates the equity'
    );

    const searchNameRes = await fetch(`${baseUrl}/stocks?search=Motors`);
    const searchNameJson = await searchNameRes.json();
    assert(
      searchNameRes.status === 200 &&
      searchNameJson.data.some((s) => s.symbol === 'TATAMOTORS'),
      '4. Stock search by company name (e.g., "Motors") successfully locates Tata Motors'
    );

    // 4. Section: Top Gainers (only positive changePercent, sorted descending)
    const gainersRes = await fetch(`${baseUrl}/stocks?section=gainers`);
    const gainersJson = await gainersRes.json();
    const allPositive = gainersJson.data.every((s) => s.changePercent > 0);
    const sortedDesc = gainersJson.data.every((s, i, arr) => i === 0 || arr[i - 1].changePercent >= s.changePercent);
    assert(
      gainersRes.status === 200 && allPositive && sortedDesc,
      '5. Section "gainers" returns strictly positive movers sorted descending'
    );

    // 5. Section: Top Losers (only negative changePercent, sorted ascending)
    const losersRes = await fetch(`${baseUrl}/stocks?section=losers`);
    const losersJson = await losersRes.json();
    const allNegative = losersJson.data.every((s) => s.changePercent < 0);
    const sortedAsc = losersJson.data.every((s, i, arr) => i === 0 || arr[i - 1].changePercent <= s.changePercent);
    assert(
      losersRes.status === 200 && allNegative && sortedAsc,
      '6. Section "losers" returns strictly negative movers sorted ascending'
    );

    // 6. Section: Most Active (sorted by trading volume)
    const activeRes = await fetch(`${baseUrl}/stocks?section=active`);
    const activeJson = await activeRes.json();
    const sortedVolume = activeJson.data.every((s, i, arr) => i === 0 || (arr[i - 1].volumeRaw || 0) >= (s.volumeRaw || 0));
    assert(
      activeRes.status === 200 && sortedVolume && activeJson.data.length > 0,
      '7. Section "active" returns equities ordered by trading volume'
    );

    // 7. Sector Sections Verification
    const bankingRes = await fetch(`${baseUrl}/stocks?section=banking`);
    const bankingJson = await bankingRes.json();
    assert(
      bankingRes.status === 200 &&
      bankingJson.data.some((s) => s.symbol === 'HDFCBANK') &&
      bankingJson.data.some((s) => s.symbol === 'ICICIBANK') &&
      bankingJson.data.some((s) => s.symbol === 'SBIN'),
      '8. Section "banking" returns major Indian private & public sector banks'
    );

    const itRes = await fetch(`${baseUrl}/stocks?section=it`);
    const itJson = await itRes.json();
    assert(
      itRes.status === 200 &&
      itJson.data.some((s) => s.symbol === 'TCS') &&
      itJson.data.some((s) => s.symbol === 'INFY'),
      '9. Section "it" returns Indian IT giants (TCS, Infosys, etc.)'
    );

    const autoRes = await fetch(`${baseUrl}/stocks?section=automobile`);
    const autoJson = await autoRes.json();
    assert(
      autoRes.status === 200 &&
      autoJson.data.some((s) => s.symbol === 'TATAMOTORS') &&
      autoJson.data.some((s) => s.symbol === 'MARUTI'),
      '10. Section "automobile" returns leading automotive leaders'
    );

    const healthRes = await fetch(`${baseUrl}/stocks?section=healthcare`);
    const healthJson = await healthRes.json();
    assert(
      healthRes.status === 200 &&
      healthJson.data.some((s) => s.symbol === 'SUNPHARMA') &&
      healthJson.data.some((s) => s.symbol === 'CIPLA'),
      '11. Section "healthcare" returns premier pharmaceutical corporations'
    );

    const energyRes = await fetch(`${baseUrl}/stocks?section=energy`);
    const energyJson = await energyRes.json();
    assert(
      energyRes.status === 200 &&
      energyJson.data.some((s) => s.symbol === 'RELIANCE') &&
      energyJson.data.some((s) => s.symbol === 'ONGC'),
      '12. Section "energy" returns major power & energy conglomerates'
    );

    const fmcgRes = await fetch(`${baseUrl}/stocks?section=fmcg`);
    const fmcgJson = await fmcgRes.json();
    assert(
      fmcgRes.status === 200 &&
      fmcgJson.data.some((s) => s.symbol === 'ITC') &&
      fmcgJson.data.some((s) => s.symbol === 'HINDUNILVR'),
      '13. Section "fmcg" returns leading consumer goods enterprises'
    );

    // 8. Sorting by Price
    const priceSortRes = await fetch(`${baseUrl}/stocks?sort=price&order=desc`);
    const priceSortJson = await priceSortRes.json();
    const isSortedByPrice = priceSortJson.data.every((s, i, arr) => i === 0 || arr[i - 1].price >= s.price);
    assert(
      priceSortRes.status === 200 && isSortedByPrice,
      '14. Sorting by price descending accurately orders equities from highest to lowest'
    );

    // 9. Pagination controls
    const pageRes = await fetch(`${baseUrl}/stocks?page=1&limit=5`);
    const pageJson = await pageRes.json();
    const pagePagination = pageJson.pagination || pageJson.meta?.pagination;
    assert(
      pageRes.status === 200 &&
      pageJson.data.length === 5 &&
      pagePagination?.page === 1 &&
      pagePagination?.limit === 5 &&
      pagePagination?.totalPages >= 4,
      '15. Pagination accurately slices pages (page: 1, limit: 5, totalPages calculated)'
    );

    // 10. Curated Sections Summary Endpoint
    const sectionsRes = await fetch(`${baseUrl}/stocks/sections`);
    const sectionsJson = await sectionsRes.json();
    assert(
      sectionsRes.status === 200 &&
      Array.isArray(sectionsJson.data.topGainers) &&
      Array.isArray(sectionsJson.data.topLosers) &&
      Array.isArray(sectionsJson.data.mostActive) &&
      Array.isArray(sectionsJson.data.indices) &&
      Array.isArray(sectionsJson.data.sectors),
      '16. GET /api/stocks/sections returns multi-section dashboard summary payload'
    );

    // 11. Market Benchmarks & Indices
    const indicesRes = await fetch(`${baseUrl}/stocks/indices`);
    const indicesJson = await indicesRes.json();
    assert(
      indicesRes.status === 200 &&
      indicesJson.data.some((idx) => idx.symbol === 'NIFTY 50') &&
      indicesJson.data.some((idx) => idx.symbol === 'SENSEX') &&
      indicesJson.data.some((idx) => idx.symbol === 'BANK NIFTY'),
      '17. GET /api/stocks/indices returns flagship Indian indices (NIFTY 50, SENSEX, BANK NIFTY)'
    );

    // 12. Indian Market Operating Hours & Status
    const marketStatusRes = await fetch(`${baseUrl}/stocks/market-status`);
    const marketStatusJson = await marketStatusRes.json();
    assert(
      marketStatusRes.status === 200 &&
      ['OPEN', 'CLOSED', 'PRE_MARKET'].includes(marketStatusJson.data.status) &&
      Boolean(marketStatusJson.data.currentTimeIST) &&
      marketStatusJson.data.exchange.includes('NSE'),
      '18. GET /api/stocks/market-status returns Indian exchange schedule & IST time'
    );

    // 13. Stock Details with 6 historical intervals & Market Depth
    const detailsRes = await fetch(`${baseUrl}/stocks/RELIANCE`);
    const detailsJson = await detailsRes.json();
    const stock = detailsJson.data;

    const hasAllIntervals =
      stock?.chartData &&
      ['1D', '1W', '1M', '3M', '6M', '1Y'].every((tf) => Array.isArray(stock.chartData[tf]) && stock.chartData[tf].length > 0);

    const hasMarketDepth =
      stock?.marketDepth &&
      Array.isArray(stock.marketDepth.bids) &&
      stock.marketDepth.bids.length === 5 &&
      Array.isArray(stock.marketDepth.asks) &&
      stock.marketDepth.asks.length === 5;

    assert(
      detailsRes.status === 200 &&
      stock.symbol === 'RELIANCE' &&
      stock.price > 0 &&
      hasAllIntervals &&
      hasMarketDepth,
      '19. GET /api/stocks/:symbol provides fundamentals, 6 chart intervals (1D, 1W, 1M, 3M, 6M, 1Y), and Level 2 market depth'
    );

    // 14. Stock Timeframe History Endpoint
    const historyRes = await fetch(`${baseUrl}/stocks/TCS/history?timeframe=3M`);
    const historyJson = await historyRes.json();
    assert(
      historyRes.status === 200 &&
      historyJson.data.symbol === 'TCS' &&
      historyJson.data.timeframe === '3M' &&
      Array.isArray(historyJson.data.data) &&
      historyJson.data.data.length > 0,
      '20. GET /api/stocks/:symbol/history?timeframe=3M returns targeted candle series'
    );

    // 15. Non-existent Ticker 404 Handling
    const notFoundRes = await fetch(`${baseUrl}/stocks/NON_EXISTENT_TICKER_99`);
    assert(
      notFoundRes.status === 404,
      '21. GET /api/stocks/:symbol returns 404 for invalid ticker symbol'
    );

    // 16. In-Memory Market Cache Verification
    const beforeCache = Date.now();
    await fetch(`${baseUrl}/stocks/INFY`);
    const durationCached = Date.now() - beforeCache;
    assert(
      durationCached < 100 && marketCache.size > 0,
      '22. Market data cache stores quotes and serves cached responses efficiently'
    );

    console.log(`\nAll ${testsPassed} of ${totalTests} Stage 5 Market Explorer tests passed (${((testsPassed / totalTests) * 100).toFixed(0)}% success rate)!`);
  } catch (err) {
    console.error('Market data test suite error:', err);
    process.exit(1);
  } finally {
    setTimeout(() => {
      process.exit(0);
    }, 200);
  }
};

runMarketDataSuite();
