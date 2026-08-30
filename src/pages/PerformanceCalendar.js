import React, { useState, useEffect, useMemo } from 'react';
import { getTrades } from '../services/api';
import './PerformanceCalendar.css';

const ratioOptions = [
  { label: '1:1', value: 1 },
  { label: '1.5:1', value: 1.5 },
  { label: '2:1', value: 2 },
  { label: '2.5:1', value: 2.5 },
  { label: '3:1', value: 3 },
  { label: '3.5:1', value: 3.5 },
  { label: '4:1', value: 4 },
  { label: '5:1', value: 5 },
];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PerformanceCalendar = () => {
  const [allTrades, setAllTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [riskReward, setRiskReward] = useState(2);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Filters
  const [selectedPair, setSelectedPair] = useState('All');
  const [selectedStrategy, setSelectedStrategy] = useState('All');
  const [selectedSetup, setSelectedSetup] = useState('All');

  // Day detail modal state
  const [selectedDay, setSelectedDay] = useState(null); // { day, info }
  const [showDayModal, setShowDayModal] = useState(false);

  useEffect(() => {
    const fetchAllTrades = async () => {
      setLoading(true);
      try {
        const res = await getTrades({ limit: 0, sortBy: 'date', sortOrder: 'asc' });
        setAllTrades(res.data.trades);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllTrades();
  }, []);

  // Unique filter options
  const uniquePairs = useMemo(() => ['All', ...new Set(allTrades.map(t => t.pair))].sort(), [allTrades]);
  const uniqueStrategies = useMemo(() => ['All', ...new Set(allTrades.map(t => t.strategy))].sort(), [allTrades]);
  const uniqueSetups = useMemo(() => {
    const setups = allTrades.map(t => `${t.pair}||${t.strategy}`);
    return ['All', ...new Set(setups)].sort();
  }, [allTrades]);

  // Filter trades for selected month and filters
  const filteredTrades = useMemo(() => {
    return allTrades.filter(trade => {
      const d = new Date(trade.date);
      const inMonth = d.getFullYear() === currentYear && d.getMonth() === currentMonth;

      let matchPair = selectedPair === 'All' || trade.pair === selectedPair;
      let matchStrategy = selectedStrategy === 'All' || trade.strategy === selectedStrategy;
      let matchSetup = selectedSetup === 'All' || `${trade.pair}||${trade.strategy}` === selectedSetup;

      return inMonth && matchPair && matchStrategy && matchSetup;
    });
  }, [allTrades, currentYear, currentMonth, selectedPair, selectedStrategy, selectedSetup]);

  // Build calendar days with P&L
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sunday

  const dailyData = useMemo(() => {
    const map = new Map();
    filteredTrades.forEach(trade => {
      const day = new Date(trade.date).getDate();
      if (!map.has(day)) map.set(day, { pnl: 0, count: 0, trades: [] });
      const entry = map.get(day);
      const amount = trade.outcome === 'win' ? riskReward : -1;
      entry.pnl += amount;
      entry.count += 1;
      entry.trades.push(trade);
    });
    return map;
  }, [filteredTrades, riskReward]);

  // Build weeks array
  const weeks = useMemo(() => {
    const weeksArr = [];
    let dayCounter = 1;
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
    for (let i = 0; i < totalCells; i += 7) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        const cellIndex = i + j;
        if (cellIndex < firstDayOfMonth || dayCounter > daysInMonth) {
          week.push(null);
        } else {
          const day = dayCounter;
          const info = dailyData.get(day);
          week.push({ day, info: info || null });
          dayCounter++;
        }
      }
      weeksArr.push(week);
    }
    return weeksArr;
  }, [firstDayOfMonth, daysInMonth, dailyData]);

  // Weekly totals
  const weeklyTotals = useMemo(() => {
    return weeks.map(week => {
      let total = 0;
      week.forEach(cell => {
        if (cell && cell.info) total += cell.info.pnl;
      });
      return total;
    });
  }, [weeks]);

  // Monthly total
  const monthlyTotal = useMemo(() => weeklyTotals.reduce((sum, t) => sum + t, 0), [weeklyTotals]);

  // Navigation
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleClearFilters = () => {
    setSelectedPair('All');
    setSelectedStrategy('All');
    setSelectedSetup('All');
  };

  const handleMonthYearChange = (month, year) => {
    setCurrentMonth(month);
    setCurrentYear(year);
    setShowMonthPicker(false);
  };

  const monthName = monthNames[currentMonth];
  const yearList = useMemo(() => {
    const currentY = new Date().getFullYear();
    const years = [];
    for (let y = currentY - 5; y <= currentY + 5; y++) years.push(y);
    return years;
  }, []);

  // Handle day click
  const handleDayClick = (day, info) => {
    setSelectedDay({ day, info: info || { pnl: 0, count: 0, trades: [] } });
    setShowDayModal(true);
  };

  const closeDayModal = () => {
    setShowDayModal(false);
    setSelectedDay(null);
  };

  // Cumulative P&L up to selected day (all trades)
  const cumulativeUpToSelectedDay = useMemo(() => {
    if (!selectedDay) return 0;
    let sum = 0;
    filteredTrades.forEach(trade => {
      const d = new Date(trade.date);
      if (d.getDate() <= selectedDay.day) {
        sum += trade.outcome === 'win' ? riskReward : -1;
      }
    });
    return sum;
  }, [filteredTrades, selectedDay, riskReward]);

  // Cumulative P&L up to selected day (entered trades only)
  const cumulativeEnteredUpToSelectedDay = useMemo(() => {
    if (!selectedDay) return 0;
    let sum = 0;
    filteredTrades.forEach(trade => {
      const d = new Date(trade.date);
      if (d.getDate() <= selectedDay.day && trade.entered) {
        sum += trade.outcome === 'win' ? riskReward : -1;
      }
    });
    return sum;
  }, [filteredTrades, selectedDay, riskReward]);

  // Encouragement comment
  const getEncouragement = (cumulative) => {
    if (cumulative > 0) return "Great job! Keep up the discipline and let your winners run.";
    if (cumulative < 0) return "Stay focused. Review your losing trades and stick to your plan.";
    return "A balanced day. Stay consistent and keep learning.";
  };

  const selectedDayInfo = selectedDay?.info;

  return (
    <div className="performance-calendar-container">
      <h2>Performance Calendar</h2>

      {/* Filters */}
      <div className="calendar-filters">
        <label>Pair:
          <select value={selectedPair} onChange={(e) => setSelectedPair(e.target.value)}>
            {uniquePairs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label>Strategy:
          <select value={selectedStrategy} onChange={(e) => setSelectedStrategy(e.target.value)}>
            {uniqueStrategies.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Setup:
          <select value={selectedSetup} onChange={(e) => setSelectedSetup(e.target.value)}>
            {uniqueSetups.map(s => {
              const display = s === 'All' ? 'All' : s.replace('||', ' + ');
              return <option key={s} value={s}>{display}</option>;
            })}
          </select>
        </label>
        <label>Risk-Reward:
          <select value={riskReward} onChange={(e) => setRiskReward(Number(e.target.value))}>
            {ratioOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </label>
        <button className="clear-filters-btn" onClick={handleClearFilters}>Clear All</button>
      </div>

      {/* Month navigation */}
      <div className="calendar-nav">
        <button onClick={goToPrevMonth}>← Prev</button>
        <span className="month-title" onClick={() => setShowMonthPicker(!showMonthPicker)}>
          {monthName} {currentYear}
        </span>
        <button onClick={goToNextMonth}>Next →</button>
      </div>

      {/* Month/Year picker */}
      {showMonthPicker && (
        <div className="month-picker">
          <div className="month-picker-controls">
            <select value={currentMonth} onChange={(e) => handleMonthYearChange(Number(e.target.value), currentYear)}>
              {monthNames.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
            </select>
            <select value={currentYear} onChange={(e) => handleMonthYearChange(currentMonth, Number(e.target.value))}>
              {yearList.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="picker-done-btn" onClick={() => setShowMonthPicker(false)}>Done</button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="calendar-grid-wrapper">
          <table className="calendar-table">
            <thead>
              <tr>
                <th>Sun</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
                <th>Sat</th>
                <th className="weekly-total-header">Week Total</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, weekIdx) => (
                <tr key={weekIdx}>
                  {week.map((cell, dayIdx) => {
                    if (!cell) return <td key={dayIdx} className="empty-cell"></td>;
                    const { day, info } = cell;
                    const pnl = info ? info.pnl : 0;
                    const bgClass = pnl > 0 ? 'bg-positive' : pnl < 0 ? 'bg-negative' : 'bg-neutral';
                    return (
                      <td
                        key={dayIdx}
                        className={`day-cell ${bgClass} clickable`}
                        onClick={() => handleDayClick(day, info)}
                        title={`Click for details`}
                      >
                        <div className="day-number">{day}</div>
                        <div className="day-pnl">{info ? (pnl > 0 ? '+' : '') + pnl.toFixed(1) : ''}</div>
                      </td>
                    );
                  })}
                  <td className={`week-total ${weeklyTotals[weekIdx] > 0 ? 'bg-positive' : weeklyTotals[weekIdx] < 0 ? 'bg-negative' : 'bg-neutral'}`}>
                    {weeklyTotals[weekIdx] > 0 ? '+' : ''}{weeklyTotals[weekIdx].toFixed(2)} R
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="7" className="monthly-total-label">Monthly Total</td>
                <td className={`monthly-total-value ${monthlyTotal > 0 ? 'bg-positive' : monthlyTotal < 0 ? 'bg-negative' : 'bg-neutral'}`}>
                  {monthlyTotal > 0 ? '+' : ''}{monthlyTotal.toFixed(2)} R
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Day detail modal */}
      {showDayModal && selectedDay && (
        <div className="modal-overlay" onClick={closeDayModal}>
          <div className="modal-content day-detail-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Day Details: {selectedDay.day} {monthName} {currentYear}</h3>
            <div className="day-summary">
              <p>Net P&L for day: <span className={selectedDayInfo.pnl >= 0 ? 'positive-text' : 'negative-text'}>
                {selectedDayInfo.pnl > 0 ? '+' : ''}{selectedDayInfo.pnl.toFixed(2)} R
              </span></p>
              <p>Cumulative P&L (All) up to this day: <span className={cumulativeUpToSelectedDay >= 0 ? 'positive-text' : 'negative-text'}>
                {cumulativeUpToSelectedDay > 0 ? '+' : ''}{cumulativeUpToSelectedDay.toFixed(2)} R
              </span></p>
              <p>Cumulative P&L (Entered) up to this day: <span className={cumulativeEnteredUpToSelectedDay >= 0 ? 'positive-text' : 'negative-text'}>
                {cumulativeEnteredUpToSelectedDay > 0 ? '+' : ''}{cumulativeEnteredUpToSelectedDay.toFixed(2)} R
              </span></p>
            </div>

            {selectedDayInfo.trades.length > 0 ? (
              <div className="trade-list">
                {selectedDayInfo.trades.map((trade, idx) => (
                  <div key={idx} className="trade-item">
                    <div className="trade-line">
                      <strong>Setup:</strong> {trade.pair} + {trade.strategy}
                    </div>
                    <div className="trade-line">
                      <strong>Pair:</strong> {trade.pair} | <strong>Strategy:</strong> {trade.strategy}
                    </div>
                    <div className="trade-line">
                      <strong>Outcome:</strong> {trade.outcome} | <strong>Entered:</strong> {trade.entered ? 'Yes' : 'No'}
                    </div>
                    <div className="trade-line">
                      <strong>Comment:</strong> {trade.reason || 'A+ setup'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No trades recorded for this day.</p>
            )}

            <div className="encouragement">
              {getEncouragement(cumulativeUpToSelectedDay)}
            </div>

            <button className="close-modal-btn" onClick={closeDayModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceCalendar;