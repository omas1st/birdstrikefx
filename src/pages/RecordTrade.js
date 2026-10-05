import React, { useState, useEffect } from 'react';
import { getSetups, recordTrade } from '../services/api';
import './RecordTrade.css';

const RecordTrade = () => {
  const [setups, setSetups] = useState([]);
  const [selectedSetup, setSelectedSetup] = useState('');
  const [pair, setPair] = useState('');
  const [strategy, setStrategy] = useState('');
  const [outcome, setOutcome] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('A+ setup');
  const [entered, setEntered] = useState(true);
  const [message, setMessage] = useState('');
  const [probationWarning, setProbationWarning] = useState(false);

  useEffect(() => {
    const fetchSetups = async () => {
      const res = await getSetups();
      setSetups(res.data);
    };
    fetchSetups();
  }, []);

  const handleSetupChange = (e) => {
    const setupId = e.target.value;
    setSelectedSetup(setupId);

    if (setupId) {
      const setup = setups.find((s) => s._id === setupId);
      if (setup) {
        setPair(setup.pair);
        setStrategy(setup.strategy);
        setProbationWarning(!!setup.onProbation);
      }
    } else {
      setPair('');
      setStrategy('');
      setProbationWarning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !selectedSetup || !pair || !strategy || !outcome) {
      setMessage('All fields are required');
      return;
    }
    try {
      await recordTrade({
        date,
        pair,
        strategy,
        outcome,
        reason: reason.trim() || 'A+ setup',
        entered,
      });
      setMessage('Trade successfully recorded');
      setSelectedSetup('');
      setPair('');
      setStrategy('');
      setOutcome('');
      setDate(new Date().toISOString().slice(0, 10));
      setReason('A+ setup');
      setEntered(true);
      setProbationWarning(false);
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
          <label>Setup</label>
          <select value={selectedSetup} onChange={handleSetupChange}>
            <option value="">Select Setup</option>
            {setups.map((setup) => (
              <option key={setup._id} value={setup._id}>
                {setup.pair} - {setup.strategy}
                {setup.onProbation ? ' (ON PROBATION)' : ''}
              </option>
            ))}
          </select>
        </div>

        {probationWarning && (
          <div className="probation-banner">
            ⚠️ <strong>This setup is on probation</strong> (2 consecutive losses).
            Reduce your position size and stay alert — a 3rd consecutive loss will remove this setup.
          </div>
        )}

        <div className="form-group">
          <label>Pair</label>
          <input type="text" value={pair} readOnly className="auto-strategy" placeholder="Auto-filled from setup" />
        </div>
        <div className="form-group">
          <label>Strategy</label>
          <input type="text" value={strategy} readOnly className="auto-strategy" placeholder="Auto-filled from setup" />
        </div>

        <div className="form-group">
          <label>Outcome/Result</label>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <option value="">Select Outcome</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
          </select>
        </div>
        <div className="form-group">
          <label>Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="A+ setup"
          />
        </div>
        <div className="form-group">
          <label>Did you enter this trade?</label>
          <select value={entered} onChange={(e) => setEntered(e.target.value === 'true')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <button type="submit" className="submit-btn">Record Trade</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default RecordTrade;