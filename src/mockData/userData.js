// StockWise - User Profile & Trading Statistics Mock Data

export const CURRENT_USER = {
  id: 'usr_849201',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@stockwise.trade',
  phone: '+91 98765 43210',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  memberSince: 'October 2026',
  accountNumber: 'SW-VIRT-98402',
  kycStatus: 'Verified Virtual Trader',
  isVirtualAccount: true,
  
  // Financial Overview
  virtualInitialCapital: 100000.00,
  availableBalance: 65500.00,
  investedBalance: 50000.00,
  portfolioValue: 124500.00,
  realizedProfit: 4500.00,
  unrealizedProfit: 9000.00,
  totalProfit: 13500.00,
  
  // Performance Metrics
  stats: {
    totalTrades: 24,
    profitableTrades: 17,
    winRate: 70.8, // percent
    bestTrade: {
      symbol: 'TATAMOTORS',
      profitPercent: 24.5,
      profitAmount: 4200.00,
    },
    avgHoldingDays: 6.2,
    rank: 'Top 8% of Learners',
  },
};
