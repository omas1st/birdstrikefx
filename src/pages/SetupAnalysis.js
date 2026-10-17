import React, { useState, useEffect, useMemo } from 'react';
import { getSetups, addSetup, deleteSetup } from '../services/api';
import { PAIRS, STRATEGIES } from '../utils/constants';
import './SetupAnalysis.css';

const SetupAnalysis = () => {
  const [setups, setSetups] = useState([]);
  const [pair, setPair] = useState('');
  const [strategy, setStrategy] = useState('');
  const [message, setMessage] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState('list'); // 'add' or 'list'

  // Sort state (Default is alphabetical grouping)
  const [sortOrder, setSortOrder] = useState('alpha'); 

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
    if (!window.confirm('Are you sure you want to delete this setup?')) return;
    try {
      await deleteSetup(id);
      fetchSetups();
      setMessage('Setup deleted');
    } catch (err) {
      setMessage('Error deleting setup');
    }
  };

  // Calculate days since the setup was created
  const getDaysSinceAdded = (createdAt) => {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Group setups by Strategy, then sort
  const groupedSetups = useMemo(() => {
    const groups = {};
    
    // 1. Group by strategy
    setups.forEach((s) => {
      if (!groups[s.strategy]) {
        groups[s.strategy] = [];
      }
      groups[s.strategy].push(s);
    });

    // 2. Sort items within each group
    Object.keys(groups).forEach((strategyKey) => {
      groups[strategyKey].sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        // Default 'alpha': sort by pair name A-Z
        return a.pair.localeCompare(b.pair);
      });
    });

    // 3. Sort the Strategy headers alphabetically and return as an array
    const sortedStrategies = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    return sortedStrategies.map((strategyName) => ({
      strategyName,
      items: groups[strategyName],
    }));
  }, [setups, sortOrder]);

  return (
    <div className="setup-analysis-container">
      <h2>Setup Analysis</h2>

      {/* Tabs */}
      <div className="setup-tabs">
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Current Setups
        </button>
        <button
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add New Setup
        </button>
      </div>

      {/* Message alert */}
      {message && <p className="message">{message}</p>}

      {/* Add Setup Tab */}
      {activeTab === 'add' && (
        <div className="tab-content add-setup-tab">
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
        </div>
      )}

      {/* Current Setups Tab */}
      {activeTab === 'list' && (
        <div className="tab-content list-setup-tab">
          <div className="list-header">
            <h3>
              Active Setups <span className="count-badge">{setups.length}</span>
            </h3>
            
            {/* Sort Dropdown (Only Date sorting as requested) */}
            <div className="sort-control">
              <label>Sort within groups:</label>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="alpha">Alphabetical (Default)</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {setups.length === 0 ? (
            <p className="no-data">No active setups.</p>
          ) : (
            <div className="strategy-groups-container">
              {groupedSetups.map((group) => (
                <div key={group.strategyName} className="strategy-group">
                  {/* Strategy Header */}
                  <h4 className="strategy-header">
                    {group.strategyName}
                    <span className="group-count">{group.items.length}</span>
                  </h4>

                  {/* Setups in this Strategy */}
                  <ol className="setup-list numbered">
                    {group.items.map((setup) => {
                      const days = getDaysSinceAdded(setup.createdAt);
                      return (
                        <li
                          key={setup._id}
                          className={`setup-item ${setup.onProbation ? 'on-probation' : ''}`}
                        >
                          <div className="setup-info">
                            <div className="setup-main">
                              <span className="setup-name">{setup.pair}</span>
                              {setup.onProbation && (
                                <span className="probation-badge">ON PROBATION</span>
                              )}
                            </div>
                            <div className="setup-meta">
                              <span className="days-badge">
                                {days === 0 ? 'Added today' : `Added ${days} day${days !== 1 ? 's' : ''} ago`}
                              </span>
                              <span className="date-text">
                                ({new Date(setup.createdAt).toLocaleDateString()})
                              </span>
                            </div>
                          </div>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(setup._id)}
                          >
                            Delete
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SetupAnalysis;