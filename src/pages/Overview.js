import React, { useState, useEffect, useCallback } from 'react';
import { getOverview } from '../services/api';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import './Overview.css';

const timeRanges = [
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

const Overview = () => {
  const [selectedRange, setSelectedRange] = useState('7days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [topN, setTopN] = useState(3);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSections, setSelectedSections] = useState([]);

  const getDateRange = useCallback(() => {
    const today = new Date();
    let start, end;
    switch (selectedRange) {
      case 'today':
        start = startOfDay(today);
        end = endOfDay(today);
        break;
      case '3days':
        start = startOfDay(subDays(today, 2));
        end = endOfDay(today);
        break;
      case '7days':
        start = startOfDay(subDays(today, 6));
        end = endOfDay(today);
        break;
      case '30days':
        start = startOfDay(subDays(today, 29));
        end = endOfDay(today);
        break;
      case '3months':
        start = startOfDay(subMonths(today, 3));
        end = endOfDay(today);
        break;
      case '6months':
        start = startOfDay(subMonths(today, 6));
        end = endOfDay(today);
        break;
      case '1year':
        start = startOfDay(subMonths(today, 12));
        end = endOfDay(today);
        break;
      case 'overall':
        start = null;
        end = null;
        break;
      case 'custom':
        if (customStart && customEnd) {
          start = startOfDay(new Date(customStart));
          end = endOfDay(new Date(customEnd));
        } else {
          start = null;
          end = null;
        }
        break;
      default:
        start = startOfDay(subDays(today, 6));
        end = endOfDay(today);
    }
    return { start, end };
  }, [selectedRange, customStart, customEnd]);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange();
    try {
      const res = await getOverview({
        startDate: start ? start.toISOString() : undefined,
        endDate: end ? end.toISOString() : undefined,
        topN,
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, topN]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleRangeChange = (e) => {
    setSelectedRange(e.target.value);
    if (e.target.value !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
    }
  };

  const handleTopNChange = (e) => setTopN(Number(e.target.value));

  const handleSectionSelect = (sectionId) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const downloadPDF = async () => {
    if (selectedSections.length === 0) {
      alert('Please select at least one section to download');
      return;
    }
    const pdf = new jsPDF('p', 'mm', 'a4');
    let isFirstPage = true;

    for (const sectionId of selectedSections) {
      const element = document.getElementById(sectionId);
      if (!element) continue;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      if (!isFirstPage) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      isFirstPage = false;
    }
    pdf.save('overview.pdf');
  };

  const renderTradesList = () => {
    if (!data || !data.trades) return null;
    return (
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Pair</th><th>Strategy</th><th>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {data.trades.map((trade, idx) => (
            <tr key={idx}>
              <td>{new Date(trade.date).toLocaleDateString()}</td>
              <td>{trade.pair}</td>
              <td>{trade.strategy}</td>
              <td>{trade.outcome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="overview-container">
      <h2>Overview</h2>

      {/* Section 1a Filter */}
      <div id="section1a" className="section filter-section">
        <h3>Filter</h3>
        <div className="filter-controls">
          <label>
            Time Range:
            <select value={selectedRange} onChange={handleRangeChange}>
              {timeRanges.map((tr) => (
                <option key={tr.value} value={tr.value}>{tr.label}</option>
              ))}
            </select>
          </label>
          {selectedRange === 'custom' && (
            <>
              <label>Start: <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} /></label>
              <label>End: <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} /></label>
            </>
          )}
          <label>
            Top List Number:
            <select value={topN} onChange={handleTopNChange}>
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={7}>7</option>
              <option value={10}>10</option>
            </select>
          </label>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {data && (
        <>
          {/* Section 1b Trades List */}
          <div id="section1b" className="section">
            <h3>Trade List ({data.trades ? data.trades.length : 0})</h3>
            {renderTradesList()}
          </div>

          {/* Section 2 Top Pairs Wins */}
          <div id="section2" className="section">
            <h3>Top {topN} Pairs with Most Wins</h3>
            <ul>
              {data.topPairsWins?.map((item, i) => (
                <li key={i}>{item.pair}: {item.wins} wins</li>
              ))}
            </ul>
          </div>

          {/* Section 3 Top Strategies Wins */}
          <div id="section3" className="section">
            <h3>Top {topN} Strategies with Most Wins</h3>
            <ul>
              {data.topStrategiesWins?.map((item, i) => (
                <li key={i}>{item.strategy}: {item.wins} wins</li>
              ))}
            </ul>
          </div>

          {/* Section 4 Top Pairs Losses */}
          <div id="section4" className="section">
            <h3>Top {topN} Pairs with Most Losses</h3>
            <ul>
              {data.topPairsLosses?.map((item, i) => (
                <li key={i}>{item.pair}: {item.losses} losses</li>
              ))}
            </ul>
          </div>

          {/* Section 5 Top Strategies Losses */}
          <div id="section5" className="section">
            <h3>Top {topN} Strategies with Most Losses</h3>
            <ul>
              {data.topStrategiesLosses?.map((item, i) => (
                <li key={i}>{item.strategy}: {item.losses} losses</li>
              ))}
            </ul>
          </div>

          {/* Section 6 Consecutive Wins/Losses */}
          <div id="section6" className="section">
            <h3>Consecutive Performance</h3>
            <div>
              <h4>3 Consecutive Wins (Hot Setups)</h4>
              <ul>
                {data.consecutiveWins?.map((setup, i) => (
                  <li key={i}>{setup.pair} + {setup.strategy}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>3 Consecutive Losses (Failed Setups) – Flagged</h4>
              <ul>
                {data.consecutiveLosses?.map((setup, i) => (
                  <li key={i}>{setup.pair} + {setup.strategy} (Flagged as failed)</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 7a Most Wins by Time */}
          <div id="section7a" className="section">
            <h3>Most Wins by Time Period</h3>
            <ul>
              <li>Year: {data.mostWinsYear?.value} ({data.mostWinsYear?.wins} wins)</li>
              <li>Month: {data.mostWinsMonth?.value} ({data.mostWinsMonth?.wins} wins)</li>
              <li>Week: {data.mostWinsWeek?.value} ({data.mostWinsWeek?.wins} wins)</li>
              <li>Day: {data.mostWinsDay?.value} ({data.mostWinsDay?.wins} wins)</li>
            </ul>
          </div>

          {/* Section 7b Most Losses by Time */}
          <div id="section7b" className="section">
            <h3>Most Losses by Time Period</h3>
            <ul>
              <li>Year: {data.mostLossesYear?.value} ({data.mostLossesYear?.losses} losses)</li>
              <li>Month: {data.mostLossesMonth?.value} ({data.mostLossesMonth?.losses} losses)</li>
              <li>Week: {data.mostLossesWeek?.value} ({data.mostLossesWeek?.losses} losses)</li>
              <li>Day: {data.mostLossesDay?.value} ({data.mostLossesDay?.losses} losses)</li>
            </ul>
          </div>

          {/* Section 8 Most/Least Traded Pairs */}
          <div id="section8" className="section">
            <h3>Top {topN} Most Traded Pairs</h3>
            <ul>
              {data.mostTradedPairs?.map((item, i) => (
                <li key={i}>{item.pair}: {item.count} trades</li>
              ))}
            </ul>
            <h3>Top {topN} Least Traded Pairs</h3>
            <ul>
              {data.leastTradedPairs?.map((item, i) => (
                <li key={i}>{item.pair}: {item.count} trades</li>
              ))}
            </ul>
          </div>

          {/* Section 9 Most/Least Traded Strategies */}
          <div id="section9" className="section">
            <h3>Top {topN} Most Traded Strategies</h3>
            <ul>
              {data.mostTradedStrategies?.map((item, i) => (
                <li key={i}>{item.strategy}: {item.count} trades</li>
              ))}
            </ul>
            <h3>Top {topN} Least Traded Strategies</h3>
            <ul>
              {data.leastTradedStrategies?.map((item, i) => (
                <li key={i}>{item.strategy}: {item.count} trades</li>
              ))}
            </ul>
          </div>

          {/* Section 10 Tabular Summary */}
          <div id="section10" className="section">
            <h3>Tabular Summary</h3>
            <table>
              <thead>
                <tr><th>Metric</th><th>Value</th></tr>
              </thead>
              <tbody>
                <tr><td>Total Trades</td><td>{data.totalTrades}</td></tr>
                <tr><td>Total Wins</td><td>{data.totalWins}</td></tr>
                <tr><td>Total Losses</td><td>{data.totalLosses}</td></tr>
                <tr><td>Win Rate</td><td>{data.winRate}%</td></tr>
                <tr><td>Loss Rate</td><td>{data.lossRate}%</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PDF Download Section */}
      <div className="pdf-download-section">
        <h3>Download PDF</h3>
        <div className="section-checkboxes">
          {['section1a','section1b','section2','section3','section4','section5','section6','section7a','section7b','section8','section9','section10'].map((id) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={selectedSections.includes(id)}
                onChange={() => handleSectionSelect(id)}
              />
              {id.replace('section', 'Section ')}
            </label>
          ))}
        </div>
        <button onClick={downloadPDF}>Download Selected Sections PDF</button>
      </div>
    </div>
  );
};

export default Overview;