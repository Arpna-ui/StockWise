import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

export const Transactions = () => {
  const { addToast } = useToast();

  // Filter & Query States
  const [filterType, setFilterType] = useState('ALL'); // ALL, BUY, SELL, CREDIT
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all'); // all, today, 7d, 30d, 90d
  const [sortBy, setSortBy] = useState('createdAt'); // createdAt, totalAmount, quantity, price
  const [sortOrder, setSortOrder] = useState('desc'); // desc, asc
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data & Loading States
  const [transactions, setTransactions] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [summary, setSummary] = useState({
    totalCompletedOrders: 0,
    buyTurnover: 0,
    sellTurnover: 0,
  });
  const [loading, setLoading] = useState(true);

  // Selected Transaction Modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (filterType !== 'ALL') params.append('type', filterType);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (dateRange !== 'all') params.append('dateRange', dateRange);

      const res = await api(`/api/transactions?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        setTransactions(res.data);
        if (res.meta?.pagination || res.pagination) {
          const p = res.meta?.pagination || res.pagination;
          setPaginationInfo(p);
        }
        if (res.meta?.summary || res.summary) {
          setSummary(res.meta?.summary || res.summary);
        }
      }
    } catch (err) {
      console.warn('[Transactions fetch warning]', err.message);
      addToast('Failed to load transaction ledger: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filterType, searchTerm, dateRange, sortBy, sortOrder]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle Export to CSV
  const handleExport = async () => {
    try {
      // Fetch all user transactions for export
      const res = await api('/api/transactions?limit=500');
      const allTxns = res.success && Array.isArray(res.data) ? res.data : transactions;

      if (allTxns.length === 0) {
        addToast('No transaction records available to export.', 'error');
        return;
      }

      const headers = [
        'Transaction ID',
        'Stock Symbol',
        'Company Name',
        'Action (BUY/SELL)',
        'Order Type',
        'Quantity',
        'Execution Price (INR)',
        'Total Order Amount (INR)',
        'Status',
        'Notes',
        'Execution Date & Time (ISO)',
      ];

      const rows = allTxns.map((t) => [
        t._id,
        t.symbol,
        `"${t.companyName || ''}"`,
        t.type,
        t.orderType || 'MARKET',
        t.quantity,
        t.price,
        t.totalAmount,
        t.status,
        `"${t.notes || ''}"`,
        new Date(t.executionDate || t.createdAt).toISOString(),
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `StockWise_Transactions_Ledger_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast('Transaction statement exported successfully as CSV', 'success');
    } catch (err) {
      addToast('Failed to export statement: ' + err.message, 'error');
    }
  };

  const handleOpenDetails = async (txn) => {
    setSelectedTxn(txn);
    setIsDetailsOpen(true);

    // Optionally fetch full detailed view from endpoint
    try {
      const res = await api(`/api/transactions/${txn._id}`);
      if (res.success && res.data) {
        setSelectedTxn(res.data);
      }
    } catch (err) {
      // Use existing txn object as fallback
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title & Top Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Transaction History & Audited Ledger
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Comprehensive permanent record of all buy/sell order executions, trade valuations, and virtual capital allocations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchTransactions}
            className="btn-secondary"
            style={{ padding: '8px 12px' }}
            title="Refresh Ledger"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary"
            style={{ padding: '9px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Export Statement (.CSV)
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Completed Orders</span>
          <div className="mono-num" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>
            {summary.totalCompletedOrders || paginationInfo.totalCount || transactions.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-profit)', fontWeight: 600 }}>
            100% Executed & Audited
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Gross Buy Turnover</span>
          <div className="mono-num" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>
            ₹{Number(summary.buyTurnover || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Cumulative Buy Orders
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Gross Sell Turnover</span>
          <div className="mono-num" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>
            ₹{Number(summary.sellTurnover || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Cumulative Proceeds Liquidated
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Virtual Capital Grant</span>
          <div className="mono-num" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'var(--color-profit)' }}>
            ₹1,00,000.00
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Initial Welcome Bonus</span>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '8px 14px',
              minWidth: '280px',
              flex: 1,
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by Order ID, symbol, or company..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                width: '100%',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'BUY', 'SELL', 'CREDIT'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: filterType === type ? 'var(--color-primary-blue)' : 'var(--bg-secondary)',
                  color: filterType === type ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {type === 'ALL' ? 'All Orders' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row: Date Filters and Sorting */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '12px',
          }}
        >
          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Period:</span>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={15} color="var(--text-muted)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="createdAt">Execution Date</option>
              <option value="totalAmount">Total Order Amount</option>
              <option value="quantity">Quantity</option>
              <option value="price">Price</option>
            </select>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
              title={`Switch to ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
            >
              {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Transactions Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', color: 'var(--color-primary-blue)' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading transaction records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              No Transactions Found
            </h4>
            <p style={{ fontSize: '0.85rem' }}>
              No trade executions matched your search criteria or filter range.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="trade-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Stock Symbol & Name</th>
                  <th>Action</th>
                  <th>Order Type</th>
                  <th style={{ textAlign: 'right' }}>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Execution Price</th>
                  <th style={{ textAlign: 'right' }}>Total Order Amount</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const isBuy = t.type === 'BUY';
                  const isSell = t.type === 'SELL';
                  const isCredit = t.type === 'CREDIT';

                  return (
                    <tr
                      key={t._id}
                      onClick={() => handleOpenDetails(t)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view full transaction details"
                    >
                      {/* 1. Transaction ID */}
                      <td>
                        <span className="mono-num" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                          #{t._id ? t._id.toString().slice(-8).toUpperCase() : 'TXN'}
                        </span>
                      </td>

                      {/* 2. Stock Symbol & Name */}
                      <td>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {t.symbol}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.companyName || t.symbol}
                          </div>
                        </div>
                      </td>

                      {/* 3. BUY / SELL Action */}
                      <td>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: isBuy
                              ? 'rgba(16, 185, 129, 0.12)'
                              : isSell
                              ? 'rgba(239, 68, 68, 0.12)'
                              : 'rgba(59, 130, 246, 0.12)',
                            color: isBuy
                              ? 'var(--color-profit)'
                              : isSell
                              ? 'var(--color-loss)'
                              : 'var(--color-primary-blue)',
                          }}
                        >
                          {t.type}
                        </span>
                      </td>

                      {/* 4. Order Type */}
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {t.orderType || 'MARKET'}
                        </span>
                      </td>

                      {/* 5. Quantity */}
                      <td className="mono-num" style={{ textAlign: 'right', fontWeight: 700 }}>
                        {t.quantity}
                      </td>

                      {/* 6. Execution Price */}
                      <td className="mono-num" style={{ textAlign: 'right' }}>
                        ₹{Number(t.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 7. Total Order Amount */}
                      <td className="mono-num" style={{ textAlign: 'right', fontWeight: 800 }}>
                        ₹{Number(t.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 8. Order Status */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: t.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: t.status === 'COMPLETED' ? 'var(--color-profit)' : 'var(--color-warning)',
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={12} /> {t.status || 'COMPLETED'}
                        </span>
                      </td>

                      {/* 9. Date & Time */}
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(t.executionDate || t.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Details Eye Button */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(t);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-primary-blue)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="View order details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {paginationInfo.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Showing {((paginationInfo.page - 1) * paginationInfo.limit) + 1} -{' '}
              {Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.totalCount)} of{' '}
              <strong>{paginationInfo.totalCount}</strong> transactions
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!paginationInfo.hasPrev}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0 8px' }}>
                Page <strong>{paginationInfo.page}</strong> of <strong>{paginationInfo.totalPages}</strong>
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(paginationInfo.totalPages, p + 1))}
                disabled={!paginationInfo.hasNext}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {isDetailsOpen && selectedTxn && (
        <div className="modal-backdrop" onClick={() => setIsDetailsOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="var(--color-profit)" />
                <h3 style={{ fontSize: '1.2rem' }}>Order Execution Receipt</h3>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              {/* Top Details Card */}
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedTxn.symbol}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedTxn.companyName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor:
                        selectedTxn.type === 'BUY'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : selectedTxn.type === 'SELL'
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(59, 130, 246, 0.12)',
                      color:
                        selectedTxn.type === 'BUY'
                          ? 'var(--color-profit)'
                          : selectedTxn.type === 'SELL'
                          ? 'var(--color-loss)'
                          : 'var(--color-primary-blue)',
                    }}
                  >
                    {selectedTxn.type} ORDER
                  </span>
                </div>
              </div>

              {/* Itemized Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Transaction ID:</span>
                  <span className="mono-num" style={{ fontWeight: 700 }}>#{selectedTxn._id}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Order Type:</span>
                  <span style={{ fontWeight: 600 }}>{selectedTxn.orderType || 'MARKET'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Quantity Executed:</span>
                  <span className="mono-num" style={{ fontWeight: 700 }}>{selectedTxn.quantity} shares</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Execution Price:</span>
                  <span className="mono-num" style={{ fontWeight: 700 }}>
                    ₹{Number(selectedTxn.price).toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Total Order Value:</span>
                  <span className="mono-num" style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-blue)' }}>
                    ₹{Number(selectedTxn.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Brokerage & Taxes:</span>
                  <span className="mono-num" style={{ color: 'var(--color-profit)', fontWeight: 600 }}>₹0.00 (Zero Fee)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                  <span style={{ color: 'var(--color-profit)', fontWeight: 700 }}>{selectedTxn.status || 'COMPLETED'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Timestamp:</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {new Date(selectedTxn.executionDate || selectedTxn.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>

                {selectedTxn.notes && (
                  <div style={{ marginTop: '4px', padding: '10px', backgroundColor: 'var(--bg-input)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      Execution Notes:
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedTxn.notes}</span>
                  </div>
                )}
              </div>

              {/* Simulation Notice */}
              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: '6px',
                }}
              >
                StockWise Simulated Paper Trade. Zero real exchange financial liability.
              </div>

              <button
                onClick={() => setIsDetailsOpen(false)}
                className="btn-primary"
                style={{ marginTop: '8px', padding: '10px', fontSize: '0.85rem' }}
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
