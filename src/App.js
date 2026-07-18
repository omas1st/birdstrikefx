import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import Header from './components/Header';
import Home from './pages/Home';
import SetupAnalysis from './pages/SetupAnalysis';
import RecordTrade from './pages/RecordTrade';
import Overview from './pages/Overview';
import TradesData from './pages/TradesData';
import FinalAnalysis from './pages/FinalAnalysis';
import './App.css';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/setup" element={<SetupAnalysis />} />
              <Route path="/record-trade" element={<RecordTrade />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/trades-data" element={<TradesData />} />
              <Route path="/final-analysis" element={<FinalAnalysis />} />
            </Routes>
          </main>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;