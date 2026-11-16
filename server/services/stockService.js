/**
 * StockWise - Stock & Market Data Service
 * 
 * Provides robust querying, searching, filtering, pagination, section categorization,
 * market hours integration, and resilient market data provider fallback.
 */

import { Stock } from '../models/Stock.js';
import { INDIAN_STOCKS_DATA } from '../data/indianStocksData.js';
import { marketDataProvider } from './marketDataProvider.js';
import { getIndianMarketStatus } from '../utils/marketHours.js';

/**
 * Seeds initial comprehensive Indian stock and index data into database
 */
export const seedInitialStocks = async () => {
  for (const item of INDIAN_STOCKS_DATA) {
    await Stock.create(item);
  }
};

// Seed immediately upon service import
seedInitialStocks().catch((err) => console.error('[Stock Seeding Error]', err));

/**
 * Query stocks with section tabs, search, sector filters, exchange filters, sorting, and pagination
 */
export const queryStocks = async ({
  search = '',
  section = 'all',
  sector = '',
  exchange = 'ALL',
  sort = 'marketCap',
  order = 'desc',
  page = 1,
  limit = 10,
}) => {
  // Fetch latest stocks from provider service
  let allStocks = await marketDataProvider.getAllStocks();
  let equities = allStocks.filter((s) => !s.isIndex);

  // 1. Filter by Search Query
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    equities = equities.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }

  // 2. Filter by Section Tab
  const sec = section.toLowerCase();
  if (sec === 'gainers') {
    equities = equities.filter((s) => s.changePercent > 0);
    equities.sort((a, b) => b.changePercent - a.changePercent);
  } else if (sec === 'losers') {
    equities = equities.filter((s) => s.changePercent < 0);
    equities.sort((a, b) => a.changePercent - b.changePercent);
  } else if (sec === 'active') {
    equities.sort((a, b) => (b.volumeRaw || 0) - (a.volumeRaw || 0));
  } else if (sec === 'banking') {
    equities = equities.filter((s) => s.sector.toLowerCase().includes('bank'));
  } else if (sec === 'it') {
    equities = equities.filter(
      (s) => s.sector.toLowerCase().includes('it') || s.sector.toLowerCase().includes('tech')
    );
  } else if (sec === 'automobile') {
    equities = equities.filter((s) => s.sector.toLowerCase().includes('auto'));
  } else if (sec === 'healthcare') {
    equities = equities.filter(
      (s) => s.sector.toLowerCase().includes('health') || s.sector.toLowerCase().includes('pharma')
    );
  } else if (sec === 'energy') {
    equities = equities.filter((s) => s.sector.toLowerCase().includes('energy'));
  } else if (sec === 'fmcg') {
    equities = equities.filter((s) => s.sector.toLowerCase().includes('fmcg'));
  }

  // 3. Filter by Specific Sector
  if (sector && sector !== 'All') {
    equities = equities.filter((s) => s.sector.toLowerCase().includes(sector.toLowerCase()));
  }

  // 4. Filter by Exchange (NSE / BSE)
  if (exchange && exchange !== 'ALL') {
    equities = equities.filter((s) => s.exchange.toUpperCase() === exchange.toUpperCase());
  }

  // 5. Apply User Sorting (if section didn't enforce specific sort like gainers/losers/active)
  if (!['gainers', 'losers', 'active'].includes(sec)) {
    const sortMultiplier = order === 'asc' ? 1 : -1;

    equities.sort((a, b) => {
      if (sort === 'price') {
        return (a.price - b.price) * sortMultiplier;
      }
      if (sort === 'changePercent') {
        return (a.changePercent - b.changePercent) * sortMultiplier;
      }
      if (sort === 'volume') {
        return ((a.volumeRaw || 0) - (b.volumeRaw || 0)) * sortMultiplier;
      }
      if (sort === 'symbol') {
        return a.symbol.localeCompare(b.symbol) * sortMultiplier;
      }
      // Default: marketCap
      return ((a.marketCapRaw || 0) - (b.marketCapRaw || 0)) * sortMultiplier;
    });
  }

  // 6. Pagination Calculations
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const total = equities.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (pageNum - 1) * pageSize;
  const paginatedStocks = equities.slice(startIndex, startIndex + pageSize);

  const marketStatus = getIndianMarketStatus();
  const providerInfo = marketDataProvider.getProviderInfo();

  return {
    stocks: paginatedStocks,
    pagination: {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
    marketStatus,
    dataSource: providerInfo.dataSource,
    dataSourceLabel: providerInfo.dataSourceLabel,
  };
};

/**
 * Get curated summaries for key market sections: Top Gainers, Top Losers, Most Active, and Sector counts
 */
export const getMarketSectionsSummary = async () => {
  const allStocks = await marketDataProvider.getAllStocks();
  const equities = allStocks.filter((s) => !s.isIndex);
  const indices = allStocks.filter((s) => s.isIndex);

  const topGainers = [...equities]
    .filter((s) => s.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);

  const topLosers = [...equities]
    .filter((s) => s.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5);

  const mostActive = [...equities]
    .sort((a, b) => (b.volumeRaw || 0) - (a.volumeRaw || 0))
    .slice(0, 5);

  const sectors = [
    'Banking',
    'IT',
    'Automobile',
    'Healthcare',
    'Energy',
    'FMCG',
  ].map((sec) => ({
    name: sec,
    count: equities.filter((s) => s.sector.toLowerCase().includes(sec.toLowerCase())).length,
  }));

  const marketStatus = getIndianMarketStatus();
  const providerInfo = marketDataProvider.getProviderInfo();

  return {
    topGainers,
    topLosers,
    mostActive,
    indices,
    sectors,
    marketStatus,
    dataSource: providerInfo.dataSource,
    dataSourceLabel: providerInfo.dataSourceLabel,
  };
};

/**
 * Get single stock by symbol with full metrics, 6 historical chart filters, and market depth
 */
export const getStockDetails = async (symbol) => {
  if (!symbol) return null;
  return await marketDataProvider.getStockBySymbol(symbol);
};

/**
 * Get specific timeframe historical price series for a stock (1D, 1W, 1M, 3M, 6M, 1Y)
 */
export const getStockHistory = async (symbol, timeframe = '1D') => {
  const stock = await getStockDetails(symbol);
  if (!stock || !stock.chartData) return null;

  const validTimeframe = ['1D', '1W', '1M', '3M', '6M', '1Y'].includes(timeframe.toUpperCase())
    ? timeframe.toUpperCase()
    : '1D';

  return {
    symbol: stock.symbol,
    timeframe: validTimeframe,
    currentPrice: stock.price,
    change: stock.change,
    changePercent: stock.changePercent,
    data: stock.chartData[validTimeframe] || stock.chartData['1D'] || [],
    dataSource: stock.dataSource,
  };
};

/**
 * Get all Indian market benchmarks / indices
 */
export const getMarketIndices = async () => {
  const allStocks = await marketDataProvider.getAllStocks();
  return allStocks.filter((s) => s.isIndex);
};
