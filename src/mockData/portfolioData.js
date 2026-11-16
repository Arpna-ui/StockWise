// StockWise - Portfolio Mock Data
// Represents the initial virtual portfolio state for a trader

export const PORTFOLIO_SUMMARY = {
  totalValue: 124500.00,
  availableBalance: 65500.00,
  totalInvested: 50000.00,
  currentHoldingsValue: 59000.00,
  totalProfitLoss: 9000.00,
  pnlPercentage: 18.00,
  dayChange: +1420.50,
  dayChangePercent: +1.15,
  initialCapitalGrant: 100000.00,
};

export const HOLDINGS = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    shares: 10,
    avgPrice: 2800.00,
    ltp: 2984.50,
    investedValue: 28000.00,
    currentValue: 29845.00,
    pnl: +1845.00,
    pnlPercent: +6.59,
    dayChangePercent: +1.43,
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    shares: 5,
    avgPrice: 3850.00,
    ltp: 4120.00,
    investedValue: 19250.00,
    currentValue: 20600.00,
    pnl: +1350.00,
    pnlPercent: +7.01,
    dayChangePercent: +1.94,
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Ltd.',
    shares: 9,
    avgPrice: 900.00,
    ltp: 978.20,
    investedValue: 8100.00,
    currentValue: 8803.80,
    pnl: +703.80,
    pnlPercent: +8.69,
    dayChangePercent: +2.24,
  },
];

export const SECTOR_ALLOCATION = [
  { name: 'Energy & Petrochemicals', value: 29845, percent: 50.6, color: '#3B82F6' },
  { name: 'Information Technology', value: 20600, percent: 34.9, color: '#10B981' },
  { name: 'Automobile', value: 8803.8, percent: 14.5, color: '#F59E0B' },
];

export const PORTFOLIO_HISTORY = {
  '1D': [
    { time: '09:15', value: 123080 },
    { time: '10:30', value: 123500 },
    { time: '11:45', value: 123850 },
    { time: '13:00', value: 124100 },
    { time: '14:15', value: 124350 },
    { time: '15:30', value: 124500 },
  ],
  '1W': [
    { time: 'Mon', value: 121500 },
    { time: 'Tue', value: 122200 },
    { time: 'Wed', value: 122900 },
    { time: 'Thu', value: 123700 },
    { time: 'Fri', value: 124500 },
  ],
  '1M': [
    { time: 'Week 1', value: 116000 },
    { time: 'Week 2', value: 118500 },
    { time: 'Week 3', value: 121000 },
    { time: 'Week 4', value: 124500 },
  ],
  '1Y': [
    { time: 'Q1', value: 100000 },
    { time: 'Q2', value: 107500 },
    { time: 'Q3', value: 115200 },
    { time: 'Q4', value: 124500 },
  ],
  'ALL': [
    { time: 'Start', value: 100000 },
    { time: 'Month 2', value: 104200 },
    { time: 'Month 4', value: 112000 },
    { time: 'Month 6', value: 124500 },
  ],
};
