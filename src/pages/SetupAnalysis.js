import React, { useState, useEffect } from 'react';
import { getSetups, addSetup, deleteSetup } from '../services/api';
import { PAIRS, STRATEGIES } from '../utils/constants';
import './SetupAnalysis.css';

const SetupAnalysis = () => {
  const [setups, setSetups] = useState([]);
  const [pair, setPair] = useState('');
  const [strategy, setStrategy] = useState('');
  const [message, setMessage] = useState('');

  const fetchSetups = async () => {
    try {
      const res = await getSetups();
      setSetups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSetups();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!pair || !strategy) {
      setMessage('Please select pair and strategy');
      return;
    }
    try {
      await addSetup({ pair, strategy });
      setPair('');
      setStrategy('');
      setMessage('Setup added successfully');
      fetchSetups();
    } catch (err) {
      setMessage('Error adding setup');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSetup(id);
      fetchSetups();
      setMessage('Setup deleted');
    } catch (err) {
      setMessage('Error deleting setup');
    }
  };

  return (
    <div className="setup-analysis-container">
      <h2>Setup Analysis</h2>
      <form onSubmit={handleAdd} className="setup-form">
        <div className="form-group">
          <label>Pair</label>
          <select value={pair} onChange={(e) => setPair(e.target.value)}>
            <option value="">Select Pair</option>
            {PAIRS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Strategy</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="">Select Strategy</option>
            {STRATEGIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="add-btn">Add Pair Setup</button>
      </form>
      {message && <p className="message">{message}</p>}
      <h3>Current Setups</h3>
      {setups.length === 0 ? (
        <p>No active setups.</p>
      ) : (
        <ul className="setup-list">
          {setups.map((setup) => (
            <li key={setup._id} className="setup-item">
              <span>{setup.pair} - {setup.strategy}</span>
              <button className="delete-btn" onClick={() => handleDelete(setup._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SetupAnalysis;