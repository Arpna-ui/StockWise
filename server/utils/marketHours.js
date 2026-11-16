/**
 * StockWise - Indian Stock Market Hours & Status Utility
 * 
 * Indian Exchanges (NSE & BSE) Trading Schedule:
 * - Timezone: Indian Standard Time (IST, UTC+05:30)
 * - Trading Days: Monday through Friday (excluding exchange holidays)
 * - Pre-market Session: 09:00 AM to 09:15 AM IST
 * - Regular Trading Session: 09:15 AM to 03:30 PM IST
 * - Post-market Session: 03:40 PM to 04:00 PM IST
 * - Market Closed: 03:30 PM to 09:00 AM next trading day, and weekends
 */

/**
 * Gets current Indian Standard Time (IST) Date object
 */
export const getISTDate = () => {
  const now = new Date();
  // UTC time in ms + 5.5 hours in ms
  const utcOffset = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  return new Date(utcOffset + istOffsetMs);
};

/**
 * Returns comprehensive market status for Indian stock exchanges
 */
export const getIndianMarketStatus = () => {
  const ist = getISTDate();
  const dayOfWeek = ist.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Format time string (e.g., "02:30 PM IST")
  const formattedHours = hours % 12 || 12;
  const period = hours >= 12 ? 'PM' : 'AM';
  const pad = (n) => String(n).padStart(2, '0');
  const timeStringIST = `${pad(formattedHours)}:${pad(minutes)} ${period} IST`;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Pre-market: 09:00 (540m) to 09:15 (555m)
  const isPreMarket = !isWeekend && timeInMinutes >= 540 && timeInMinutes < 555;
  // Regular hours: 09:15 (555m) to 15:30 (930m)
  const isRegularTrading = !isWeekend && timeInMinutes >= 555 && timeInMinutes <= 930;

  let status = 'CLOSED';
  let message = 'Market is closed. Trading resumes Monday at 09:15 AM IST.';

  if (isRegularTrading) {
    status = 'OPEN';
    message = 'Indian Markets (NSE/BSE) are OPEN for trading.';
  } else if (isPreMarket) {
    status = 'PRE_MARKET';
    message = 'Pre-market order matching session active until 09:15 AM IST.';
  } else if (!isWeekend) {
    if (timeInMinutes < 540) {
      message = 'Market opens today at 09:15 AM IST.';
    } else {
      message = 'Market closed for the day. Trading resumes tomorrow at 09:15 AM IST.';
    }
  }

  return {
    isOpen: isRegularTrading,
    isPreMarket,
    status, // 'OPEN' | 'PRE_MARKET' | 'CLOSED'
    currentTimeIST: timeStringIST,
    marketHours: '09:15 AM - 03:30 PM IST (Mon - Fri)',
    exchange: 'NSE / BSE',
    message,
    nextSession: isRegularTrading ? 'Closes at 03:30 PM IST' : 'Opens next trading day at 09:15 AM IST',
  };
};
