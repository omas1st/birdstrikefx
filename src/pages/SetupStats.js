import React, { useState, useEffect, useMemo } from 'react';
import { getTrades } from '../services/api';
import './SetupStats.css';

const SetupStats = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openSetupTable, setOpenSetupTable] = useState(false);
  const [openPairsTable, setOpenPairsTable] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await getTrades({ limit: 0, sortBy: 'date', sortOrder: 'asc' });
        setTrades(res.data.trades);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Build the analysis
  const analysis = useMemo(() => {
    const setupMap = new Map();

    trades.forEach(t => {
      const key = `${t.pair}||${t.strategy}`;
      if (!setupMap.has(key)) {
        setupMap.set(key, { pair: t.pair, strategy: t.strategy, trades: [] });
      }
      setupMap.get(key).trades.push(t);
    });

    const setups = [];
    let totalTwoLossInstances = 0;
    let totalThreeLossInstances = 0;
    let totalTwoLossWinInstances = 0;

    setupMap.forEach((value) => {
      const sorted = [...value.trades].sort((a, b) => new Date(a.date) - new Date(b.date));
      const total = sorted.length;
      const wins = sorted.filter(t => t.outcome === 'win').length;
      const losses = sorted.filter(t => t.outcome === 'loss').length;
      const winRate = total ? ((wins / total) * 100).toFixed(2) : '0.00';
      const lossRate = total ? ((losses / total) * 100).toFixed(2) : '0.00';

      // Count "2 consecutive losses" occurrences
      let twoLossCount = 0;
      let threeLossCount = 0;
      let twoLossWinCount = 0;
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].outcome === 'loss' && sorted[i + 1].outcome === 'loss') {
          twoLossCount++;
          if (i + 2 < sorted.length) {
            if (sorted[i + 2].outcome === 'loss') threeLossCount++;
            else twoLossWinCount++;
          }
        }
      }

      totalTwoLossInstances += twoLossCount;
      totalThreeLossInstances += threeLossCount;
      totalTwoLossWinInstances += twoLossWinCount;

      const thirdLossChance = twoLossCount
        ? ((threeLossCount / twoLossCount) * 100).toFixed(2)
        : 'N/A';
      const thirdWinChance = twoLossCount
        ? ((twoLossWinCount / twoLossCount) * 100).toFixed(2)
        : 'N/A';

      // Per-setup opinion based on 3rd-loss chance
      let opinion = 'Insufficient data';
      const c = parseFloat(thirdLossChance);
      if (!isNaN(c)) {
        if (c >= 70) opinion = 'Reduce failure threshold to 2 losses (very high risk).';
        else if (c >= 55) opinion = 'Consider reducing failure threshold to 2 losses.';
        else if (c > 45) opinion = 'Neutral — keep monitoring.';
        else if (c > 30) opinion = 'Keep the 3-loss rule (favour 3rd-trade win).';
        else opinion = 'Keep the 3-loss rule (strong 3rd-trade win bias).';
      } else if (total > 0) {
        opinion = 'Not enough 2-loss events to judge.';
      } else {
        opinion = 'No trades yet.';
      }

      setups.push({
        pair: value.pair,
        strategy: value.strategy,
        total,
        wins,
        losses,
        winRate,
        lossRate,
        twoLossCount,
        threeLossCount,
        twoLossWinCount,
        thirdLossChance,
        thirdWinChance,
        opinion,
      });
    });

    setups.sort((a, b) => b.total - a.total);

    const overall = {
      totalTwoLossInstances,
      totalThreeLossInstances,
      totalTwoLossWinInstances,
      overallThirdLossChance: totalTwoLossInstances
        ? ((totalThreeLossInstances / totalTwoLossInstances) * 100).toFixed(2)
        : 'N/A',
      overallThirdWinChance: totalTwoLossInstances
        ? ((totalTwoLossWinInstances / totalTwoLossInstances) * 100).toFixed(2)
        : 'N/A',
    };

    return { setups, overall };
  }, [trades]);

  // Per-pair statistics
  const pairStats = useMemo(() => {
    const pairMap = new Map();
    trades.forEach(t => {
      if (!pairMap.has(t.pair)) {
        pairMap.set(t.pair, { pair: t.pair, count: 0, wins: 0, losses: 0 });
      }
      const p = pairMap.get(t.pair);
      p.count++;
      if (t.outcome === 'win') p.wins++;
      else p.losses++;
    });
    return Array.from(pairMap.values())
      .map(p => ({
        ...p,
        winRate: p.count ? ((p.wins / p.count) * 100).toFixed(2) : '0.00',
        lossRate: p.count ? ((p.losses / p.count) * 100).toFixed(2) : '0.00',
      }))
      .sort((a, b) => b.count - a.count);
  }, [trades]);

  // Overall advice
  const overallAdvice = useMemo(() => {
    const c = parseFloat(analysis.overall.overallThirdLossChance);
    if (isNaN(c)) {
      return {
        level: 'neutral',
        title: 'Insufficient Data',
        body: 'Record more trades with at least two consecutive losses to generate meaningful statistics.',
      };
    }
    if (c > 60) {
      return {
        level: 'warn',
        title: 'High Risk After 2 Losses',
        body: `The data shows that in ${c}% of cases, a 2-loss streak is followed by a 3rd loss. Consider reducing the failure threshold from 3 to 2 consecutive losses to protect capital.`,
      };
    }
    if (c > 50) {
      return {
        level: 'warn-light',
        title: 'Lean Towards Failure',
        body: `In ${c}% of cases, a 2-loss streak turns into a 3rd loss. It may be worth testing a stricter 2-loss failure rule.`,
      };
    }
    if (c < 40) {
      return {
        level: 'ok',
        title: 'Healthy Recovery Bias',
        body: `Only ${c}% of 2-loss streaks continue into a 3rd loss — meaning the setup usually recovers on the 3rd trade. Keep the 3-loss failure rule.`,
      };
    }
    if (c < 50) {
      return {
        level: 'ok-light',
        title: 'Slight Recovery Bias',
        body: `In ${c}% of cases, a 2-loss streak turns into a 3rd loss. Data leans towards the setup recovering. Keep the 3-loss failure rule.`,
      };
    }
    return {
      level: 'neutral',
      title: 'Neutral Outcome',
      body: 'The data is balanced. Gather more samples before deciding on the failure threshold.',
    };
  }, [analysis]);

  return (
    <div className="setup-stats-container">
      <h2>Setup Statistics</h2>

      {loading && <p className="loading-message">Loading...</p>}

      {!loading && (
        <>
          {/* Failure Threshold Analysis */}
          <div className={`advice-box ${overallAdvice.level}`}>
            <div className="advice-header">
              <h3>Failure Threshold Analysis</h3>
              <span className="advice-tag">{overallAdvice.title}</span>
            </div>

            <div className="advice-grid">
              <div className="advice-metric">
                <span className="metric-label">2‑Loss Events</span>
                <span className="metric-value">{analysis.overall.totalTwoLossInstances}</span>
              </div>
              <div className="advice-metric">
                <span className="metric-label">3rd Loss Count</span>
                <span className="metric-value loss-cell">{analysis.overall.totalThreeLossInstances}</span>
              </div>
              <div className="advice-metric">
                <span className="metric-label">3rd Win Count</span>
                <span className="metric-value win-cell">{analysis.overall.totalTwoLossWinInstances}</span>
              </div>
              <div className="advice-metric">
                <span className="metric-label">3rd Loss Chance</span>
                <span className="metric-value">
                  {analysis.overall.overallThirdLossChance === 'N/A'
                    ? 'N/A'
                    : `${analysis.overall.overallThirdLossChance}%`}
                </span>
              </div>
              <div className="advice-metric">
                <span className="metric-label">3rd Win Chance</span>
                <span className="metric-value">
                  {analysis.overall.overallThirdWinChance === 'N/A'
                    ? 'N/A'
                    : `${analysis.overall.overallThirdWinChance}%`}
                </span>
              </div>
            </div>

            <p className="advice-text">{overallAdvice.body}</p>
          </div>

          {/* Setup Performance Overview – collapsible */}
          <div className="collapsible-section">
            <button
              className="collapsible-header"
              onClick={() => setOpenSetupTable(!openSetupTable)}
            >
              <span>Setup Performance Overview</span>
              <span className="chevron">{openSetupTable ? '▲' : '▼'}</span>
            </button>
            {openSetupTable && (
              <div className="collapsible-body">
                {analysis.setups.length === 0 ? (
                  <p className="no-data">No setups found in trade history.</p>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Pair</th>
                          <th>Strategy</th>
                          <th>Total</th>
                          <th>Wins</th>
                          <th>Losses</th>
                          <th>Win %</th>
                          <th>Loss %</th>
                          <th>2‑Loss Events</th>
                          <th>3rd Loss</th>
                          <th>3rd Win</th>
                          <th>3rd Loss %</th>
                          <th>3rd Win %</th>
                          <th>Insight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.setups.map((s, i) => (
                          <tr key={i}>
                            <td>{s.pair}</td>
                            <td>{s.strategy}</td>
                            <td>{s.total}</td>
                            <td className="win-cell">{s.wins}</td>
                            <td className="loss-cell">{s.losses}</td>
                            <td className="win-cell">{s.winRate}%</td>
                            <td className="loss-cell">{s.lossRate}%</td>
                            <td>{s.twoLossCount}</td>
                            <td className="loss-cell">{s.threeLossCount}</td>
                            <td className="win-cell">{s.twoLossWinCount}</td>
                            <td
                              className={
                                s.thirdLossChance === 'N/A'
                                  ? ''
                                  : parseFloat(s.thirdLossChance) > 50
                                  ? 'loss-cell'
                                  : 'win-cell'
                              }
                            >
                              {s.thirdLossChance === 'N/A' ? 'N/A' : `${s.thirdLossChance}%`}
                            </td>
                            <td
                              className={
                                s.thirdWinChance === 'N/A'
                                  ? ''
                                  : parseFloat(s.thirdWinChance) >= 50
                                  ? 'win-cell'
                                  : 'loss-cell'
                              }
                            >
                              {s.thirdWinChance === 'N/A' ? 'N/A' : `${s.thirdWinChance}%`}
                            </td>
                            <td className="insight-cell">{s.opinion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pairs Trading Frequency – collapsible */}
          <div className="collapsible-section">
            <button
              className="collapsible-header"
              onClick={() => setOpenPairsTable(!openPairsTable)}
            >
              <span>Pairs Trading Frequency</span>
              <span className="chevron">{openPairsTable ? '▲' : '▼'}</span>
            </button>
            {openPairsTable && (
              <div className="collapsible-body">
                {pairStats.length === 0 ? (
                  <p className="no-data">No pair data available.</p>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Pair</th>
                          <th>Total Trades</th>
                          <th>Wins</th>
                          <th>Losses</th>
                          <th>Win %</th>
                          <th>Loss %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pairStats.map((p, i) => (
                          <tr key={i}>
                            <td>{p.pair}</td>
                            <td>{p.count}</td>
                            <td className="win-cell">{p.wins}</td>
                            <td className="loss-cell">{p.losses}</td>
                            <td className="win-cell">{p.winRate}%</td>
                            <td className="loss-cell">{p.lossRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SetupStats;