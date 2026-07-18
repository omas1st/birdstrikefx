import React, { useState, useEffect } from 'react';
import { getFinalAnalysis } from '../services/api';
import './FinalAnalysis.css';

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

      <div className="section">
        <h3>i. Setups NOT to Trade (Flagged – 3 Consecutive Losses)</h3>
        <p>These setups have been automatically removed from active setups.</p>
        {analysis.flaggedSetups?.length > 0 ? (
          <ul>
            {analysis.flaggedSetups.map((s, i) => (
              <li key={i}>{s.pair} - {s.strategy} (Failed)</li>
            ))}
          </ul>
        ) : <p>No flagged setups.</p>}
      </div>

      <div className="section">
        <h3>ii. Restored Setups</h3>
        {analysis.restoredSetups?.length > 0 ? (
          <ul>
            {analysis.restoredSetups.map((s, i) => (
              <li key={i}>{s.pair} - {s.strategy} | Days to restore: {s.daysToRestore}</li>
            ))}
          </ul>
        ) : <p>No restored setups.</p>}
      </div>

      <div className="section">
        <h3>iii. Hot Winning Setups (3 Consecutive Wins)</h3>
        {analysis.hotWinningSetups?.length > 0 ? (
          <ul>
            {analysis.hotWinningSetups.map((s, i) => (
              <li key={i}>{s.pair} - {s.strategy}</li>
            ))}
          </ul>
        ) : <p>No hot winning setups.</p>}
      </div>

      <div className="section">
        <h3>iv. Current Available Setups</h3>
        {analysis.currentSetups?.length > 0 ? (
          <ul>
            {analysis.currentSetups.map((s, i) => (
              <li key={i}>{s.pair} - {s.strategy}</li>
            ))}
          </ul>
        ) : <p>No setups available.</p>}
      </div>

      <div className="section">
        <h3>v. Advice</h3>
        {analysis.advice?.length > 0 ? (
          <ul>
            {analysis.advice.map((adv, i) => <li key={i}>{adv}</li>)}
          </ul>
        ) : <p>No advice.</p>}
      </div>

      <div className="section">
        <h3>vi. Strategy Support</h3>
        {analysis.strategyAdvice ? <p>{analysis.strategyAdvice}</p> : <p>No issues.</p>}
      </div>

      <div className="section">
        <h3>vii. Setup Failure/Restore Durations</h3>
        {analysis.setupDurations?.length > 0 ? (
          <ul>
            {analysis.setupDurations.map((d, i) => (
              <li key={i}>{d.pair} - {d.strategy}: Failed after {d.daysToFail} days, Restored after {d.daysToRestore} days</li>
            ))}
          </ul>
        ) : <p>No data.</p>}
      </div>
    </div>
  );
};

export default FinalAnalysis;