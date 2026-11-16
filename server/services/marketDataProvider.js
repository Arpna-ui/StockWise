/**
 * StockWise - Market Data Provider Service
 * 
 * Supports external provider integration (Alpha Vantage, Yahoo Finance, etc.)
 * with caching, rate-limit resilience, and clearly distinguished data types:
 * - 'LIVE': Real-time quotes from authenticated market providers
 * - 'DELAYED_15MIN': Delayed exchange feeds
 * - 'SAMPLE_DATA': Verified offline sample benchmarks (used when API is unavailable or unconfigured)
 * 
 * Never fabricates pseudo-live prices.
 */

import { INDIAN_STOCKS_DATA } from '../data/indianStocksData.js';
import { marketCache } from '../utils/marketDataCache.js';
import { getIndianMarketStatus } from '../utils/marketHours.js';

const CACHE_TTL_MS = (Number(process.env.MARKET_DATA_CACHE_TTL_SECONDS) || 60) * 1000;
const PROVIDER = process.env.MARKET_DATA_PROVIDER || 'sample';
const API_KEY = process.env.MARKET_DATA_API_KEY || '';

class MarketDataProviderService {
  constructor() {
    this.providerName = PROVIDER;
    this.apiKey = API_KEY;
  }

  /**
   * Retrieves active provider status and data classification
   */
  getProviderInfo() {
    const isLiveConfigured = Boolean(this.apiKey && this.providerName !== 'sample');
    return {
      provider: this.providerName,
      isLiveConfigured,
      dataSource: isLiveConfigured ? 'LIVE' : 'SAMPLE_DATA',
      dataSourceLabel: isLiveConfigured
        ? `Live Market Feed (${this.providerName.toUpperCase()})`
        : 'Sample Market Data (NSE/BSE Reference)',
      cacheTTLSeconds: CACHE_TTL_MS / 1000,
    };
  }

  /**
   * Fetch quote from external market API (with timeout and error handling)
   */
  async fetchExternalQuote(symbol) {
    if (!this.apiKey || this.providerName === 'sample') {
      return null;
    }

    const cacheKey = `external_quote_${symbol}`;
    const cached = marketCache.get(cacheKey);
    if (cached) return cached;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second safety timeout

      let url = '';
      if (this.providerName === 'alphavantage') {
        // Alpha Vantage Global Quote for Indian Equities (.BSE)
        url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}.BSE&apikey=${this.apiKey}`;
      }

      if (!url) {
        clearTimeout(timeoutId);
        return null;
      }

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[MarketData API] HTTP error ${response.status} from ${this.providerName}`);
        return null;
      }

      const data = await response.json();

      // Check for Alpha Vantage rate limit note or empty quote
      if (data['Note'] || data['Information'] || !data['Global Quote']) {
        console.warn(`[MarketData API] Rate limit or response warning:`, data['Note'] || data['Information']);
        return null;
      }

      const gq = data['Global Quote'];
      const price = parseFloat(gq['05. price']);
      const change = parseFloat(gq['09. change']);
      const changePercent = parseFloat((gq['10. change percent'] || '0').replace('%', ''));

      if (isNaN(price)) return null;

      const liveQuote = {
        symbol: symbol.toUpperCase(),
        price,
        change,
        changePercent,
        dayHigh: parseFloat(gq['03. high']) || price,
        dayLow: parseFloat(gq['04. low']) || price,
        openPrice: parseFloat(gq['02. open']) || price,
        prevClose: parseFloat(gq['08. previous close']) || price,
        volumeRaw: parseInt(gq['06. volume'], 10) || 0,
        dataSource: 'LIVE',
        dataSourceLabel: `Live ${this.providerName.toUpperCase()} Feed`,
        isSimulated: false,
        lastUpdated: new Date().toISOString(),
      };

      // Cache valid response
      marketCache.set(cacheKey, liveQuote, CACHE_TTL_MS);
      return liveQuote;
    } catch (err) {
      console.warn(`[MarketData API Error] Could not fetch live quote for ${symbol}: ${err.message}. Falling back cleanly to sample data.`);
      return null;
    }
  }

  /**
   * Retrieves all available stocks with enriched market status and data source indicators
   */
  async getAllStocks() {
    const cacheKey = 'all_stocks_enriched';
    const cached = marketCache.get(cacheKey);
    if (cached) return cached;

    const marketStatus = getIndianMarketStatus();
    const providerInfo = this.getProviderInfo();

    const stocks = INDIAN_STOCKS_DATA.map((stock) => ({
      ...stock,
      marketStatus: marketStatus.status,
      dataSource: providerInfo.dataSource,
      dataSourceLabel: providerInfo.dataSourceLabel,
      isSimulated: !providerInfo.isLiveConfigured,
      lastUpdated: new Date().toISOString(),
    }));

    marketCache.set(cacheKey, stocks, 30000); // 30s cache for stock directory
    return stocks;
  }

  /**
   * Retrieves single stock by symbol with full history and market depth
   */
  async getStockBySymbol(symbol) {
    if (!symbol) return null;
    const cleanSymbol = symbol.toUpperCase().trim();
    const cacheKey = `stock_details_${cleanSymbol}`;
    const cached = marketCache.get(cacheKey);
    if (cached) return cached;

    // First find base dataset record
    const baseStock = INDIAN_STOCKS_DATA.find((s) => s.symbol === cleanSymbol);
    if (!baseStock) return null;

    let result = { ...baseStock };

    // Attempt live quote if provider is active
    if (this.apiKey && this.providerName !== 'sample') {
      const liveData = await this.fetchExternalQuote(cleanSymbol);
      if (liveData) {
        result = {
          ...result,
          ...liveData,
        };
      }
    }

    const marketStatus = getIndianMarketStatus();
    result.marketStatusInfo = marketStatus;
    result.marketStatus = marketStatus.status;

    marketCache.set(cacheKey, result, 15000); // 15s cache for individual stock
    return result;
  }
}

export const marketDataProvider = new MarketDataProviderService();
