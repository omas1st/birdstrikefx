import React, { useState, useEffect } from 'react';
import { getSetups, recordTrade } from '../services/api';
import './RecordTrade.css';

const RecordTrade = () => {
  const [setups, setSetups] = useState([]);
  const [pair, setPair] = useState('');
  const [strategy, setStrategy] = useState('');
  const [outcome, setOutcome] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSetups = async () => {
      const res = await getSetups();
      setSetups(res.data);
    };
    fetchSetups();
  }, []);

  const uniquePairs = [...new Set(setups.map((s) => s.pair))];

  const handlePairChange = (e) => {
    const selectedPair = e.target.value;
    setPair(selectedPair);
    if (selectedPair) {
      const strategiesForPair = setups
        .filter((s) => s.pair === selectedPair)
        .map((s) => s.strategy);
      setStrategy(strategiesForPair[0] || '');
    } else {
      setStrategy('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !pair || !strategy || !outcome) {
      setMessage('All fields are required');
      return;
    }
    try {
      await recordTrade({ date, pair, strategy, outcome });
      setMessage('Trade successfully recorded');
      setPair('');
      setStrategy('');
      setOutcome('');
      setDate(new Date().toISOString().slice(0, 10));
    } catch (err) {
      setMessage('Error recording trade');
    }
  };

  return (
    <div className="record-trade-container">
      <h2>Record Trade</h2>
      <form onSubmit={handleSubmit} className="trade-form">
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Pair</label>
          <select value={pair} onChange={handlePairChange}>
            <option value="">Select Pair</option>
            {uniquePairs.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Strategy</label>
          <input type="text" value={strategy} readOnly className="auto-strategy" />
        </div>
        <div className="form-group">
          <label>Outcome/Result</label>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <option value="">Select Outcome</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
          </select>
        </div>
        <button type="submit" className="submit-btn">Record Trade</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default RecordTrade;