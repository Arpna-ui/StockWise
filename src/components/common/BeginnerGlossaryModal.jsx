import React, { useState } from 'react';
import { Modal } from './Modal';
import {
  BookOpen,
  Search,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Lightbulb,
  DollarSign,
  PieChart,
  HelpCircle,
  BarChart2,
  Layers,
  ArrowRight,
} from 'lucide-react';

const GLOSSARY_ITEMS = [
  {
    term: 'Virtual Paper Cash (₹1,00,000)',
    category: 'basics',
    icon: DollarSign,
    color: '#10B981',
    summary: 'Risk-free simulated money you can use to learn trading without losing real money.',
    details:
      'StockWise gives you ₹1,00,000 in virtual currency upon signup. Every trade, profit, and loss is calculated against real Indian stock prices (NSE/BSE), but zero real money is involved.',
    example: 'Buy 10 shares of Tata Motors at ₹1,000 each. ₹10,000 is deducted from your virtual cash, leaving ₹90,000.',
  },
  {
    term: 'NIFTY 50 & SENSEX',
    category: 'basics',
    icon: TrendingUp,
    color: '#2563EB',
    summary: 'The main thermometers of the Indian stock market.',
    details:
      'NIFTY 50 represents the top 50 largest companies listed on the National Stock Exchange (NSE). SENSEX represents the top 30 on the Bombay Stock Exchange (BSE). When you hear "the market is up today", people are referring to these indices.',
    example: 'If Nifty 50 is +1.2%, India’s biggest corporations had a positive trading day overall.',
  },
  {
    term: 'Bull vs Bear Market',
    category: 'basics',
    icon: BarChart2,
    color: '#F59E0B',
    summary: 'The direction of the overall market mood.',
    details:
      'A Bull Market means prices are generally rising and investors feel optimistic (horns pointing up). A Bear Market means prices are dropping and investors are fearful (claws swiping down).',
    example: 'A stock gaining +5% over three consecutive days is experiencing strong bullish momentum.',
  },
  {
    term: 'Market Order',
    category: 'orders',
    icon: Zap,
    color: '#10B981',
    summary: 'Buy or sell immediately at the current live market price.',
    details:
      'Best for beginners who want their trade executed right away without waiting. Your order matches the best available seller or buyer immediately.',
    example: 'If Reliance is trading at ₹2,850, a Market Buy order buys it instantly at ₹2,850.',
  },
  {
    term: 'Limit Order',
    category: 'orders',
    icon: Layers,
    color: '#8B5CF6',
    summary: 'Set your own target price. Order only triggers when the price is reached.',
    details:
      'If you believe a stock is currently too expensive, a Limit Order lets you say: "Only buy when it drops to ₹X". If the market never hits that price, you pay nothing.',
    example: 'TCS is at ₹3,900. You place a Limit Buy at ₹3,850. The order will wait until the price drops to ₹3,850 or lower.',
  },
  {
    term: 'Realized P&L (Cash in Bank)',
    category: 'portfolio',
    icon: CheckCircle2,
    color: '#10B981',
    summary: 'Actual profit or loss locked in because you clicked SELL.',
    details:
      'Until you sell a stock, your profit is just "on paper". Once you click SELL, that gain or loss is finalized ("realized") and the cash returns to your available wallet.',
    example: 'You bought Infosys at ₹1,400 and sold it at ₹1,550. You locked in a Realized Profit of +₹150 per share.',
  },
  {
    term: 'Unrealized P&L (Paper Profit)',
    category: 'portfolio',
    icon: HelpCircle,
    color: '#3B82F6',
    summary: 'Fluctuating profit/loss on stocks you currently own.',
    details:
      'Also known as "floating P&L". It updates every second as the stock price ticks up and down. You have not actually made or lost this money until you choose to sell.',
    example: 'Your 5 shares of Titan are currently showing +₹600 profit. If Titan drops tomorrow, that number can change.',
  },
  {
    term: 'Market Capitalization (Market Cap)',
    category: 'ratios',
    icon: PieChart,
    color: '#EC4899',
    summary: 'The total value of all shares of a company.',
    details:
      'Calculated as Total Shares × Current Share Price. Classifications:\n• Large Cap (>₹20,000 Cr): Stable giants (e.g. Reliance, TCS, HDFC Bank).\n• Mid Cap (₹5,000 - ₹20,000 Cr): Fast-growing companies with moderate risk.\n• Small Cap (<₹5,000 Cr): Smaller firms, high reward potential with higher risk.',
    example: 'Large-cap stocks are generally less volatile and ideal for beginners to start with.',
  },
  {
    term: 'P/E Ratio (Price-to-Earnings)',
    category: 'ratios',
    icon: Lightbulb,
    color: '#F59E0B',
    summary: 'How much you are paying for every ₹1 the company earns.',
    details:
      'Calculated as Share Price ÷ Annual Earnings per Share. A lower P/E may suggest the stock is cheap (undervalued), while a high P/E means investors expect huge future growth.',
    example: 'A P/E of 20 means investors are paying ₹20 for every ₹1 of annual profit the company generates.',
  },
  {
    term: '52-Week High / Low',
    category: 'ratios',
    icon: BarChart2,
    color: '#06B6D4',
    summary: 'The highest and lowest price paid for the stock in the past 12 months.',
    details:
      'Shows whether a stock is currently trading near its peak record or bargain basement. Beginners can look at this range to gauge market sentiment.',
    example: 'If 52W Low is ₹1,200 and current price is ₹1,240, the stock is currently trading near its 1-year low.',
  },
  {
    term: 'Diversification',
    category: 'portfolio',
    icon: Shield,
    color: '#10B981',
    summary: 'Not putting all your eggs in one basket.',
    details:
      'Instead of putting all ₹1,00,000 into one company, spreading your virtual capital across 3 to 5 different sectors (like IT, Banking, Energy, and Automobile) protects you if one industry has a bad week.',
    example: 'If your tech stock falls -2%, your banking stock might gain +3%, keeping your overall portfolio safe.',
  },
];

export const BeginnerGlossaryModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredItems = GLOSSARY_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎓 Beginner's Trading Handbook & Jargon Buster">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '72vh', overflowY: 'auto' }}>
        {/* Friendly Intro Banner */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: 'var(--border-radius-sm)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.84rem',
          }}
        >
          <BookOpen size={20} color="var(--color-primary-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-primary-blue)', marginBottom: '2px' }}>
              Welcome to StockWise! Zero-Risk Learning
            </div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Trading doesn't have to be confusing. Use this handbook to look up any term in plain English.
              You have <b>₹1,00,000 virtual cash</b> to practice without risking real money.
            </div>
          </div>
        </div>

        {/* 4-Step Quickstart Progress Bar */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '12px 14px',
            borderRadius: 'var(--border-radius-sm)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            How to Make Your First Virtual Trade (4 Simple Steps):
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '8px',
              fontSize: '0.74rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ backgroundColor: 'var(--color-primary-blue)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>1</span>
              <span><b>Claim Cash:</b> ₹1,00,000 ready in wallet.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ backgroundColor: 'var(--color-primary-blue)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>2</span>
              <span><b>Pick a Stock:</b> Go to Markets & search (e.g. TCS).</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ backgroundColor: 'var(--color-primary-blue)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>3</span>
              <span><b>Buy Shares:</b> Enter quantity & click Buy.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ backgroundColor: 'var(--color-profit)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>4</span>
              <span><b>Sell & Profit:</b> Click Sell anytime to cash out!</span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search concepts (e.g. P/E, Nifty, Limit Order, Bull, Profit)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
              }}
            />
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'all', label: 'All Concepts' },
              { id: 'basics', label: 'Market Basics' },
              { id: 'orders', label: 'Trading & Orders' },
              { id: 'portfolio', label: 'Profit & Portfolio' },
              { id: 'ratios', label: 'Ratios & Numbers' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: activeCategory === cat.id ? 'var(--color-primary-blue)' : 'var(--border-subtle)',
                  backgroundColor: activeCategory === cat.id ? 'var(--color-primary-blue)' : 'transparent',
                  color: activeCategory === cat.id ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '0.76rem',
                  fontWeight: activeCategory === cat.id ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Glossary Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No terms match your search "{searchTerm}". Try searching for "Nifty", "Limit", or "Profit".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          backgroundColor: `${item.color}18`,
                          color: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {item.term}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {item.category}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {item.details}
                  </div>

                  {item.example && (
                    <div
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)',
                        borderLeft: `3px solid ${item.color}`,
                        marginTop: '2px',
                      }}
                    >
                      <strong style={{ color: 'var(--text-primary)' }}>Real Example: </strong>
                      {item.example}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
