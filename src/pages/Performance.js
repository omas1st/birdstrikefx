import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getTrades } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Performance.css';

const strategyShort = {
  "ACUMMULATION MANIPULATION DISTRIBUTION (AMD - OWL)": "AMD-OWL",
  "Liquidity Sweep Reversal (LSR - HAWK)": "LSR-HAWK",
  "BREAK RETEST CONTINUE (BRC - EAGLE)": "BRC-EAGLE",
  "DYNAMIC TRENDLINE BOUNCE (DTB - OSPREY)": "DTB-OSPREY",
  "TREND RELOAD CONTINUATION (TRC - FALCON)": "TRC-FALCON",
};

const timeRangeOptions = [
  { label: 'Today', value: 'today' },
  { label: '3 Days', value: '3days' },
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: '3 Months', value: '3months' },
  { label: '6 Months', value: '6months' },
  { label: '1 Year', value: '1year' },
  { label: 'Overall', value: 'overall' },
  { label: 'Custom', value: 'custom' },
];

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

const Performance = () => {
  const [currentPeriodTrades, setCurrentPeriodTrades] = useState([]);
  const [previousPeriodTrades, setPreviousPeriodTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [riskReward, setRiskReward] = useState(2);

  // Build date filter for API
  const buildDateFilter = useCallback((range, startCustom, endCustom) => {
    const today = new Date();
    let start, end;
    switch (range) {
      case 'today':
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        break;
      case '3days':
        start = new Date(today.getTime() - 2 * 86400000);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      case '7days':
        start = new Date(today.getTime() - 6 * 86400000);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      case '30days':
        start = new Date(today.getTime() - 29 * 86400000);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      case '3months':
        start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      case '6months':
        start = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      case '1year':
        start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      case 'overall':
        start = null; end = null;
        break;
      case 'custom':
        if (startCustom && endCustom) {
          start = new Date(startCustom);
          start.setHours(0, 0, 0, 0);
          end = new Date(endCustom);
          end.setHours(23, 59, 59, 999);
        } else {
          start = null; end = null;
        }
        break;
      default: start = null; end = null;
    }
    return {
      startDate: start ? start.toISOString() : undefined,
      endDate: end ? end.toISOString() : undefined,
    };
  }, []);

  // Fetch trades for a given date range
  const fetchPeriodTrades = useCallback(async (range, startCustom, endCustom) => {
    const { startDate, endDate } = buildDateFilter(range, startCustom, endCustom);
    const params = {
      startDate,
      endDate,
      limit: 0,
      sortBy: 'date',
      sortOrder: 'asc',
    };
    const res = await getTrades(params);
    return res.data.trades;
  }, [buildDateFilter]);

  // Load current and previous periods
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const curr = await fetchPeriodTrades(selectedRange, customStart, customEnd);
        setCurrentPeriodTrades(curr);

        if (selectedRange === 'overall' || selectedRange === 'today') {
          setPreviousPeriodTrades([]);
        } else {
          const { startDate: currStart, endDate: currEnd } = buildDateFilter(selectedRange, customStart, customEnd);
          if (currStart && currEnd) {
            const duration = new Date(currEnd).getTime() - new Date(currStart).getTime();
            const prevEnd = new Date(new Date(currStart).getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - duration);
            const prev = await fetchPeriodTrades('custom', prevStart.toISOString().slice(0,10), prevEnd.toISOString().slice(0,10));
            setPreviousPeriodTrades(prev);
          } else {
            setPreviousPeriodTrades([]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedRange, customStart, customEnd, fetchPeriodTrades, buildDateFilter]);

  // Basic stats
  const computeStats = useCallback((trades) => {
    const total = trades.length;
    const wins = trades.filter(t => t.outcome === 'win').length;
    const losses = trades.filter(t => t.outcome === 'loss').length;
    const winRate = total ? ((wins / total) * 100).toFixed(2) : '0.00';
    const lossRate = total ? ((losses / total) * 100).toFixed(2) : '0.00';
    const enteredTrades = trades.filter(t => t.entered);
    const enteredWins = enteredTrades.filter(t => t.outcome === 'win').length;
    const enteredLosses = enteredTrades.filter(t => t.outcome === 'loss').length;
    const enteredWinRate = enteredTrades.length ? ((enteredWins / enteredTrades.length) * 100).toFixed(2) : '0.00';
    const enteredLossRate = enteredTrades.length ? ((enteredLosses / enteredTrades.length) * 100).toFixed(2) : '0.00';
    return {
      total,
      wins,
      losses,
      winRate,
      lossRate,
      enteredTotal: enteredTrades.length,
      enteredWins,
      enteredLosses,
      enteredWinRate,
      enteredLossRate,
    };
  }, []);

  const currentStats = useMemo(() => computeStats(currentPeriodTrades), [currentPeriodTrades, computeStats]);
  const previousStats = useMemo(() => {
    if (previousPeriodTrades.length === 0) return null;
    return computeStats(previousPeriodTrades);
  }, [previousPeriodTrades, computeStats]);

  // Cumulative P&L for current period
  const cumulativeAll = useMemo(() => {
    return currentPeriodTrades.reduce((sum, trade) => {
      return sum + (trade.outcome === 'win' ? riskReward : -1);
    }, 0);
  }, [currentPeriodTrades, riskReward]);

  const cumulativeEntered = useMemo(() => {
    return currentPeriodTrades.reduce((sum, trade) => {
      if (trade.entered) {
        return sum + (trade.outcome === 'win' ? riskReward : -1);
      }
      return sum;
    }, 0);
  }, [currentPeriodTrades, riskReward]);

  const gap = cumulativeAll - cumulativeEntered;

  // Cumulative P&L for previous period
  const previousCumulativeAll = useMemo(() => {
    if (!previousPeriodTrades.length) return null;
    return previousPeriodTrades.reduce((sum, trade) => {
      return sum + (trade.outcome === 'win' ? riskReward : -1);
    }, 0);
  }, [previousPeriodTrades, riskReward]);

  const previousCumulativeEntered = useMemo(() => {
    if (!previousPeriodTrades.length) return null;
    return previousPeriodTrades.reduce((sum, trade) => {
      if (trade.entered) return sum + (trade.outcome === 'win' ? riskReward : -1);
      return sum;
    }, 0);
  }, [previousPeriodTrades, riskReward]);

  const previousGap = previousCumulativeAll !== null && previousCumulativeEntered !== null
    ? previousCumulativeAll - previousCumulativeEntered
    : null;

  // Percentage change helper
  const formatChange = (currentVal, previousVal) => {
    if (previousVal === null || previousVal === undefined || previousVal === 0) return 'N/A';
    const curr = parseFloat(currentVal);
    const prev = parseFloat(previousVal);
    const diff = curr - prev;
    const pct = ((diff / Math.abs(prev)) * 100).toFixed(1);
    const sign = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    const color = diff > 0 ? '#4caf50' : diff < 0 ? '#f44336' : '#ffffff';
    return (
      <span style={{ color }}>
        {sign} {Math.abs(pct)}%
      </span>
    );
  };

  // Chart data – aggregates per day with both all and entered cumulative values
  const chartData = useMemo(() => {
    const dayMap = new Map();
    currentPeriodTrades.forEach(trade => {
      const dayKey = new Date(trade.date).toLocaleDateString();
      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, { date: dayKey, trades: [], dailyNet: 0, enteredDailyNet: 0 });
      }
      const entry = dayMap.get(dayKey);
      entry.trades.push(trade);
      // All trades daily net
      const amount = trade.outcome === 'win' ? riskReward : -1;
      entry.dailyNet += amount;
      // Entered trades daily net
      if (trade.entered) {
        entry.enteredDailyNet += amount;
      }
    });
    const sortedDays = Array.from(dayMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    let cumAll = 0;
    let cumEntered = 0;
    return sortedDays.map(day => {
      cumAll += day.dailyNet;
      cumEntered += day.enteredDailyNet;
      return {
        date: day.date,
        dailyNet: day.dailyNet,
        cumulativeNet: cumAll,
        enteredDailyNet: day.enteredDailyNet,
        enteredCumulativeNet: cumEntered,
        trades: day.trades,
      };
    });
  }, [currentPeriodTrades, riskReward]);

  // Custom dot for all-trades line (coloured by daily net)
  const CustomDotAll = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const dailyNet = payload.dailyNet;
    let fill = '#ffffff';
    if (dailyNet > 0) fill = '#4fc3f7';
    else if (dailyNet < 0) fill = '#ff5252';
    return <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#000" strokeWidth={1} />;
  };

  // Custom dot for entered-trades line (coloured by entered daily net)
  const CustomDotEntered = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const enteredDailyNet = payload.enteredDailyNet;
    let fill = '#ffffff';
    if (enteredDailyNet > 0) fill = '#66bb6a';
    else if (enteredDailyNet < 0) fill = '#ef5350';
    return <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#000" strokeWidth={1} />;
  };

  // Tooltip (unchanged – shows all trades for that day)
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data || !data.trades) return null;
      const dayNet = data.dailyNet;
      const outcomeText = dayNet > 0 ? 'WIN' : dayNet < 0 ? 'LOSS' : 'EVEN';
      return (
        <div className="custom-tooltip">
          <p><strong>Date:</strong> {data.date}</p>
          <p>All trades daily net: <span style={{ color: dayNet >= 0 ? '#4fc3f7' : '#ff5252' }}>{dayNet > 0 ? '+' : ''}{dayNet.toFixed(2)} R</span> ({outcomeText})</p>
          <p>All trades cumulative: {data.cumulativeNet.toFixed(2)} R</p>
          <p>Entered daily net: <span style={{ color: data.enteredDailyNet >= 0 ? '#4fc3f7' : '#ff5252' }}>{data.enteredDailyNet > 0 ? '+' : ''}{data.enteredDailyNet.toFixed(2)} R</span></p>
          <p>Entered cumulative: {data.enteredCumulativeNet.toFixed(2)} R</p>
          <div className="tooltip-trades">
            {data.trades.map((trade, idx) => (
              <div key={idx} className="tooltip-trade-item">
                <span>{trade.pair}</span> | <span>{strategyShort[trade.strategy] || trade.strategy}</span>
                <br />
                <span>Outcome: {trade.outcome}</span> | <span>Entered: {trade.entered ? 'Yes' : 'No'}</span>
                <br />
                <span>Reason: {trade.reason || 'A+ setup'}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="performance-container">
      <h2>Performance Analysis</h2>

      <div className="filters">
        <label>Time Range:
          <select value={selectedRange} onChange={(e) => {
            setSelectedRange(e.target.value);
            if (e.target.value !== 'custom') { setCustomStart(''); setCustomEnd(''); }
          }}>
            {timeRangeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </label>
        {selectedRange === 'custom' && (
          <>
            <label>Start: <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} /></label>
            <label>End: <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} /></label>
          </>
        )}
        <label>Risk-Reward Ratio:
          <select value={riskReward} onChange={(e) => setRiskReward(Number(e.target.value))}>
            {ratioOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </label>
      </div>

      <div className="stats-table">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Change vs Previous</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Trades</td>
              <td>{currentStats.total}</td>
              <td>{previousStats ? formatChange(currentStats.total, previousStats.total) : 'N/A'}</td>
            </tr>
            <tr>
              <td>Wins (All)</td>
              <td>{currentStats.wins}</td>
              <td>{previousStats ? formatChange(currentStats.wins, previousStats.wins) : 'N/A'}</td>
            </tr>
            <tr>
              <td>Losses (All)</td>
              <td>{currentStats.losses}</td>
              <td>{previousStats ? formatChange(currentStats.losses, previousStats.losses) : 'N/A'}</td>
            </tr>
            <tr>
              <td>Win Rate (All)</td>
              <td>{currentStats.winRate}%</td>
              <td>{previousStats ? formatChange(currentStats.winRate, previousStats.winRate) : 'N/A'}</td>
            </tr>
            <tr>
              <td>Loss Rate (All)</td>
              <td>{currentStats.lossRate}%</td>
              <td>{previousStats ? formatChange(currentStats.lossRate, previousStats.lossRate) : 'N/A'}</td>
            </tr>
            <tr>
              <td>
                <span style={{ color: '#4fc3f7' }}>Entered Trades</span>
              </td>
              <td>{currentStats.enteredTotal}</td>
              <td>{previousStats ? formatChange(currentStats.enteredTotal, previousStats.enteredTotal) : 'N/A'}</td>
            </tr>
            <tr>
              <td>
                <span style={{ color: '#4fc3f7' }}>Wins (Entered)</span>
              </td>
              <td>{currentStats.enteredWins}</td>
              <td>{previousStats ? formatChange(currentStats.enteredWins, previousStats.enteredWins) : 'N/A'}</td>
            </tr>
            <tr>
              <td>
                <span style={{ color: '#4fc3f7' }}>Losses (Entered)</span>
              </td>
              <td>{currentStats.enteredLosses}</td>
              <td>{previousStats ? formatChange(currentStats.enteredLosses, previousStats.enteredLosses) : 'N/A'}</td>
            </tr>
            <tr>
              <td>
                <span style={{ color: '#4fc3f7' }}>Win Rate (Entered)</span>
              </td>
              <td>{currentStats.enteredWinRate}%</td>
              <td>{previousStats ? formatChange(currentStats.enteredWinRate, previousStats.enteredWinRate) : 'N/A'}</td>
            </tr>
            <tr>
              <td>
                <span style={{ color: '#4fc3f7' }}>Loss Rate (Entered)</span>
              </td>
              <td>{currentStats.enteredLossRate}%</td>
              <td>{previousStats ? formatChange(currentStats.enteredLossRate, previousStats.enteredLossRate) : 'N/A'}</td>
            </tr>

            <tr style={{ borderTop: '2px solid #4fc3f7' }}>
              <td><strong>Cumulative P&L (All)</strong></td>
              <td>{cumulativeAll.toFixed(2)} R</td>
              <td>
                {previousCumulativeAll !== null
                  ? formatChange(cumulativeAll, previousCumulativeAll)
                  : 'N/A'}
              </td>
            </tr>
            <tr>
              <td><strong>Cumulative P&L (Entered)</strong></td>
              <td>{cumulativeEntered.toFixed(2)} R</td>
              <td>
                {previousCumulativeEntered !== null
                  ? formatChange(cumulativeEntered, previousCumulativeEntered)
                  : 'N/A'}
              </td>
            </tr>
            <tr>
              <td><strong>Gap (All – Entered)</strong></td>
              <td style={{ color: gap >= 0 ? '#4caf50' : '#f44336' }}>
                {gap > 0 ? '+' : ''}{gap.toFixed(2)} R
              </td>
              <td>
                {previousGap !== null
                  ? (() => {
                      const diff = gap - previousGap;
                      const sign = diff > 0 ? '+' : diff < 0 ? '' : '';
                      const color = diff > 0 ? '#4caf50' : diff < 0 ? '#f44336' : '#ffffff';
                      return <span style={{ color }}>{sign}{diff.toFixed(2)} R</span>;
                    })()
                  : 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="chart-section">
          <h3>Profit/Loss Curve (Risk-Reward {riskReward}:1)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="date" stroke="#aaa" />
              <YAxis stroke="#aaa" label={{ value: 'Net R', angle: -90, position: 'insideLeft', style: { fill: '#aaa' } }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cumulativeNet"
                stroke="#4fc3f7"
                name="All Trades"
                dot={<CustomDotAll />}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="enteredCumulativeNet"
                stroke="#66bb6a"
                name="Entered Trades"
                dot={<CustomDotEntered />}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Performance;