import React, { useState, useEffect } from 'react';
import { getFinalAnalysis } from '../services/api';
import './FinalAnalysis.css';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const PatternDisplay = ({ pattern }) => {
  if (!pattern || pattern === '—') return <span className="pattern-empty">—</span>;
  return (
    <span className="pattern-cells">
      {pattern.split('').map((ch, i) => (
        <span key={i} className={ch === 'w' ? 'pat-w' : 'pat-l'}>
          {ch}
        </span>
      ))}
    </span>
  );
};

// Reusable collapsible section
const CollapsibleSection = ({ title, badge, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`section ${open ? 'open' : 'closed'}`}>
      <button
        type="button"
        className="section-header-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="section-title">
          {title}
          {badge !== undefined && badge !== null && (
            <span className="count-badge">{badge}</span>
          )}
        </span>
        <span className={`chevron ${open ? 'open' : ''}`}>▼</span>
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
};

const FinalAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getFinalAnalysis();
        setAnalysis(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!analysis) return <p>No data available.</p>;

  return (
    <div className="final-analysis-container">
      <h2>Final Analysis</h2>

      {/* i. Flagged setups */}
      <CollapsibleSection
        title="i. Setups NOT to Trade (Flagged – 3 Consecutive Losses)"
        badge={analysis.flaggedSetups?.length || 0}
      >
        <p>These setups have been automatically removed from active setups.</p>
        {analysis.flaggedSetups?.length > 0 ? (
          <ul className="item-list">
            {analysis.flaggedSetups.map((s, i) => (
              <li
                key={i}
                className={`list-item ${s.readyForRetry ? 'ready-for-retry' : ''}`}
              >
                <div className="item-main">
                  <span className="item-name">
                    {s.pair} - {s.strategy}
                  </span>
                  <span className="item-tag tag-failed">FAILED</span>
                  {s.readyForRetry && <span className="retry-tag">Ready for retry</span>}
                </div>
                <div className="item-meta">
                  Failed on: {formatDate(s.flaggedAt)}
                  {s.daysSinceFail !== null && ` · ${s.daysSinceFail} days ago`}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No flagged setups.</p>
        )}
      </CollapsibleSection>

      {/* ii. Probation setups */}
      <CollapsibleSection
        title="ii. Setups on Probation (2 Consecutive Losses)"
        badge={analysis.probationSetups?.length || 0}
      >
        <p>These setups are still active but require caution — reduce position size.</p>
        {analysis.probationSetups?.length > 0 ? (
          <ol className="item-list numbered">
            {analysis.probationSetups.map((s, i) => (
              <li key={i} className="list-item">
                <div className="item-main">
                  <span className="item-name">
                    {s.pair} - {s.strategy}
                  </span>
                  <span className="item-tag tag-probation">ON PROBATION</span>
                </div>
                {s.probationAt && (
                  <div className="item-meta">
                    Probation since: {formatDate(s.probationAt)}
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p>No setups on probation.</p>
        )}
      </CollapsibleSection>

      {/* iii. Restored setups */}
      <CollapsibleSection
        title="iii. Restored Setups"
        badge={analysis.restoredSetups?.length || 0}
      >
        {analysis.restoredSetups?.length > 0 ? (
          <ol className="item-list numbered">
            {analysis.restoredSetups.map((s, i) => (
              <li key={i} className="list-item">
                <div className="item-main">
                  <span className="item-name">
                    {s.pair} - {s.strategy}
                  </span>
                </div>
                <div className="item-meta">Days to restore: {s.daysToRestore}</div>
              </li>
            ))}
          </ol>
        ) : (
          <p>No restored setups.</p>
        )}
      </CollapsibleSection>

      {/* iv. Hot winning setups */}
      <CollapsibleSection
        title="iv. Hot Winning Setups (3 Consecutive Wins)"
        badge={analysis.hotWinningSetups?.length || 0}
      >
        {analysis.hotWinningSetups?.length > 0 ? (
          <ol className="item-list numbered">
            {analysis.hotWinningSetups.map((s, i) => (
              <li key={i} className="list-item">
                <div className="item-main">
                  <span className="item-name">
                    {s.pair} - {s.strategy}
                  </span>
                  <span className="item-tag tag-hot">HOT</span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p>No hot winning setups.</p>
        )}
      </CollapsibleSection>

      {/* v. Current available setups with win rate */}
      <CollapsibleSection
        title="v. Current Available Setups"
        badge={analysis.currentSetups?.length || 0}
      >
        {analysis.currentSetups?.length > 0 ? (
          <ol className="item-list numbered">
            {analysis.currentSetups.map((s, i) => (
              <li key={i} className="list-item">
                <div className="item-main">
                  <span className="item-name">
                    {s.pair} - {s.strategy}
                  </span>
                  <span className="win-rate-badge">
                    Win Rate: <strong>{s.winRate}%</strong>
                  </span>
                  {s.onProbation && (
                    <span className="item-tag tag-probation">ON PROBATION</span>
                  )}
                </div>
                <div className="item-meta">
                  {s.wins}W / {s.losses}L · {s.total} total trades
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p>No setups available.</p>
        )}
      </CollapsibleSection>

      {/* vi. Advice */}
      <CollapsibleSection title="vi. Advice">
        {analysis.advice?.length > 0 ? (
          <ul>
            {analysis.advice.map((adv, i) => (
              <li key={i}>{adv}</li>
            ))}
          </ul>
        ) : (
          <p>No advice.</p>
        )}
      </CollapsibleSection>

      {/* vii. Strategy support */}
      <CollapsibleSection title="vii. Strategy Support">
        {analysis.strategyAdvice ? <p>{analysis.strategyAdvice}</p> : <p>No issues.</p>}
      </CollapsibleSection>

      {/* viii. Recent 10-trade pattern */}
      <CollapsibleSection
        title="viii. Recent 10-Trade Pattern (Probation & Failed Setups)"
        badge={analysis.recentPatternSetups?.length || 0}
      >
        <p className="section-hint">
          Pattern is read left → right as oldest → newest. <strong>w</strong> = win,{' '}
          <strong>l</strong> = loss.
        </p>
        {analysis.recentPatternSetups?.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Pair</th>
                  <th>Strategy</th>
                  <th>Last 10 Trades</th>
                  <th>W</th>
                  <th>L</th>
                  <th>Win %</th>
                </tr>
              </thead>
              <tbody>
                {analysis.recentPatternSetups.map((s, i) => {
                  const wr = s.totalInWindow
                    ? ((s.wins / s.totalInWindow) * 100).toFixed(0)
                    : '0';
                  return (
                    <tr key={i}>
                      <td>
                        <span
                          className={
                            s.status === 'Probation'
                              ? 'item-tag tag-probation'
                              : 'item-tag tag-failed'
                          }
                        >
                          {s.status}
                        </span>
                      </td>
                      <td>{s.pair}</td>
                      <td>{s.strategy}</td>
                      <td>
                        <PatternDisplay pattern={s.pattern} />
                      </td>
                      <td className="win-cell">{s.wins}</td>
                      <td className="loss-cell">{s.losses}</td>
                      <td className="win-cell">{wr}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No probation or failed setups.</p>
        )}
      </CollapsibleSection>

      {/* ix. Setup durations */}
      <CollapsibleSection
        title="ix. Setup Failure/Restore Durations"
        badge={analysis.setupDurations?.length || 0}
      >
        {analysis.setupDurations?.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Strategy</th>
                  <th>Days to Fail</th>
                  <th>Days to Restore</th>
                </tr>
              </thead>
              <tbody>
                {analysis.setupDurations.map((d, i) => (
                  <tr key={i}>
                    <td>{d.pair}</td>
                    <td>{d.strategy}</td>
                    <td>{d.daysToFail ?? 'N/A'}</td>
                    <td>{d.daysToRestore ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No data.</p>
        )}
      </CollapsibleSection>
    </div>
  );
};

export default FinalAnalysis;