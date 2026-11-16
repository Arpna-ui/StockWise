import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Clock,
  Bookmark,
  Share2,
  ExternalLink,
  Search,
  RefreshCw,
  Info,
  ShieldCheck,
  Building2,
  Cpu,
  Car,
  Flame,
  ShoppingBag,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { SkeletonNewsCard } from '../components/common/Skeleton';
import { api } from '../services/api';

export const News = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Markets',
    'Economy',
    'Technology',
    'Banking',
    'Automobile',
    'Energy',
    'FMCG',
  ];

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.append('category', activeCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api(`/api/news?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        setNews(res.data);
      } else {
        throw new Error(res.message || 'Failed to retrieve market news');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching news feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [activeCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNews();
  };

  const handleShare = (article) => {
    navigator.clipboard?.writeText(article.sourceUrl || window.location.href);
    addToast('Article link copied to clipboard', 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title & Provenance Notice */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Financial Market News & Corporate Disclosures
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Curated coverage of macroeconomic policy, corporate earnings, and Indian market movements.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Legitimate Source Notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--color-profit)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <ShieldCheck size={14} />
            <span>Accredited Financial Sources</span>
          </div>

          <button
            onClick={fetchNews}
            className="btn-secondary"
            style={{ padding: '8px 12px' }}
            title="Refresh News Feed"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '14px 20px',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', flex: 1 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: activeCategory === cat ? 'var(--color-primary-blue)' : 'var(--bg-secondary)',
                color: activeCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ minWidth: '260px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '6px 12px',
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>
        </form>
      </div>

      {/* News Content State Rendering */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
          }}
        >
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonNewsCard key={idx} />
          ))}
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <Info size={36} color="var(--color-loss)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Could not load news feed</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>
          <button onClick={fetchNews} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            Retry Loading
          </button>
        </div>
      ) : news.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Newspaper size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>No News Articles Found</h3>
          <p style={{ fontSize: '0.85rem' }}>Try clearing your search or switching to "All" categories.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
          }}
        >
          {news.map((article) => {
            const isBullish = article.sentiment === 'Bullish';
            return (
              <div
                key={article.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Image & Tags */}
                <div style={{ position: 'relative', height: '175px', width: '100%', overflow: 'hidden' }}>
                  <img
                    src={article.image}
                    alt={article.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                    }}
                  >
                    {article.category}
                  </span>

                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: isBullish
                        ? 'rgba(16, 185, 129, 0.9)'
                        : 'rgba(59, 130, 246, 0.9)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isBullish && <TrendingUp size={12} />}
                    {article.sentiment}
                  </span>
                </div>

                {/* Article Content */}
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{article.source}</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={12} /> {article.timeAgo || 'Recently'}
                    </span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>

                  <h3 style={{ fontSize: '1.02rem', lineHeight: 1.4, margin: 0, fontWeight: 700 }}>
                    {article.title}
                  </h3>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5, flex: 1 }}>
                    {article.summary}
                  </p>

                  {/* Related Symbols & Link to Original Article */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '12px',
                      marginTop: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Related:</span>
                      {(article.relatedSymbols || []).map((sym) => (
                        <button
                          key={sym}
                          onClick={() => navigate(`/stock/${sym}`)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--color-primary-blue)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {sym}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleShare(article)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          padding: '6px',
                          cursor: 'pointer',
                        }}
                        title="Copy article link"
                      >
                        <Share2 size={15} />
                      </button>

                      {/* Legitimate Original Article Link */}
                      <a
                        href={article.sourceUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--color-primary-blue)',
                          textDecoration: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        }}
                        title="Read full article on publisher site"
                      >
                        Original <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
