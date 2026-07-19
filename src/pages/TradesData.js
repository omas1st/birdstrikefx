import React, { useState, useEffect, useCallback } from 'react';
import { getTrades, deleteTrade } from '../services/api';
import { PAIRS, STRATEGIES } from '../utils/constants';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './TradesData.css';

const timeRangeOptions = [
  { label: 'Today', value: 'today' },
  { label: '3 Days', value: '3days' },
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: '3 Months', value: '3months' },
  { label: '6 Months', value: '6months' },
  { label: '1 Year', value: '1year' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom', value: 'custom' },
];

const TradesData = () => {
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    lossRate: 0,
    setupsCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(10);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [pairFilter, setPairFilter] = useState('');
  const [strategyFilter, setStrategyFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const getDateRangeForFilter = useCallback(() => {
    const today = new Date();
    let start, end;
    switch (selectedTimeRange) {
      case 'today':
        start = new Date(today.setHours(0, 0, 0, 0));
        end = new Date(today.setHours(23, 59, 59, 999));
        break;
      case '3days':
        start = new Date(today.getTime() - 2 * 86400000);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        break;
      case '7days':
        start = new Date(today.getTime() - 6 * 86400000);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        break;
      case '30days':
        start = new Date(today.getTime() - 29 * 86400000);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        break;
      case '3months':
        start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        end = new Date();
        break;
      case '6months':
        start = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        end = new Date();
        break;
      case '1year':
        start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        end = new Date();
        break;
      case 'all':
        start = null;
        end = null;
        break;
      case 'custom':
        if (customStart && customEnd) {
          start = new Date(customStart);
          end = new Date(customEnd);
        } else {
          start = null;
          end = null;
        }
        break;
      default:
        start = null;
        end = null;
    }
    return {
      startDate: start ? start.toISOString() : undefined,
      endDate: end ? end.toISOString() : undefined,
    };
  }, [selectedTimeRange, customStart, customEnd]);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRangeForFilter();
    const params = {
      startDate,
      endDate,
      outcome: outcomeFilter || undefined,
      pair: pairFilter || undefined,
      strategy: strategyFilter || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortBy ? sortOrder : undefined,
      limit: limit === 'all' ? 0 : limit,
    };
    try {
      const res = await getTrades(params);
      setTrades(res.data.trades);
      setStats({
        totalTrades: res.data.totalTrades,
        totalWins: res.data.totalWins,
        totalLosses: res.data.totalLosses,
        winRate: res.data.winRate,
        lossRate: res.data.lossRate,
        setupsCount: res.data.setupsCount,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getDateRangeForFilter, outcomeFilter, pairFilter, strategyFilter, sortBy, sortOrder, limit]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleDeleteTrade = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    try {
      await deleteTrade(id);
      fetchTrades(); // Refresh the list and stats
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete trade');
    }
  };

  const downloadTradesPDF = async () => {
    const element = document.getElementById('trades-table');
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save('trades-data.pdf');
  };

  return (
    <div className="trades-data-container">
      <h2>Trades Data</h2>
      <div className="stats">
        <p>Total Trades: {stats.totalTrades}</p>
        <p>Setups: {stats.setupsCount}</p>
        <p>Wins: {stats.totalWins}</p>
        <p>Losses: {stats.totalLosses}</p>
        <p>Win Rate: {stats.winRate}%</p>
        <p>Loss Rate: {stats.lossRate}%</p>
      </div>

      <div className="filters">
        <label>Time Range:
          <select value={selectedTimeRange} onChange={(e) => {
            setSelectedTimeRange(e.target.value);
            if (e.target.value !== 'custom') { setCustomStart(''); setCustomEnd(''); }
          }}>
            {timeRangeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </label>
        {selectedTimeRange === 'custom' && (
          <>
            <label>Start: <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} /></label>
            <label>End: <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} /></label>
          </>
        )}
        <label>Outcome:
          <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)}>
            <option value="">All</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
          </select>
        </label>
        <label>Pair:
          <select value={pairFilter} onChange={(e) => setPairFilter(e.target.value)}>
            <option value="">All</option>
            {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label>Strategy:
          <select value={strategyFilter} onChange={(e) => setStrategyFilter(e.target.value)}>
            <option value="">All</option>
            {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Sort By:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="">None</option>
            <option value="date">Date</option>
            <option value="pair">Pair</option>
            <option value="outcome">Outcome</option>
          </select>
        </label>
        {sortBy && (
          <label>Order:
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        )}
        <label>Records per page:
          <select value={limit} onChange={(e) => setLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={100}>100</option>
            <option value={1000}>1000</option>
            <option value="all">All</option>
          </select>
        </label>
      </div>

      <button onClick={downloadTradesPDF}>Download Trades PDF</button>

      {loading ? <p>Loading...</p> : (
        <div id="trades-table" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Pair</th>
                <th>Strategy</th>
                <th>Outcome</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade._id}>
                  <td>{new Date(trade.date).toLocaleDateString()}</td>
                  <td>{trade.pair}</td>
                  <td>{trade.strategy}</td>
                  <td>{trade.outcome}</td>
                  <td>
                    <button
                      className="delete-trade-btn"
                      onClick={() => handleDeleteTrade(trade._id)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TradesData;