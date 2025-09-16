import React, { useState, useEffect } from 'react';

// API call for market placeholder
const getMarketStatus = async () => {
  const response = await fetch('/api/market', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};

function MarketScreen() {
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      const data = await getMarketStatus();
      setMarketData(data);
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-content">
        <h2>Loading market...</h2>
      </div>
    );
  }

  return (
    <div className="market-screen">
      <div className="sidebar-header">Market</div>
      
      <div className="market-placeholder">
        <h2>{marketData.message}</h2>
        <p>{marketData.description}</p>

        <div className="current-resources">
          <h3>Your Resources</h3>
          <div className="resource-display">
            <span><strong>Gold:</strong> {marketData.player_resources?.gold || 0}</span>
            <span><strong>Gems:</strong> {marketData.player_resources?.gems || 0}</span>
            <span><strong>Metals:</strong> {marketData.player_resources?.metals || 0}</span>
            <span><strong>Quartz:</strong> {marketData.player_resources?.quartz || 0}</span>
          </div>
        </div>

        <div className="planned-features">
          <h3>Coming Soon</h3>
          <ul>
            {(marketData.planned_features || []).map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>

        <div className="market-explanation">
          <p>The original MarcoLand had a thriving player market where players could:</p>
          <ul>
            <li>Trade gems at better rates than NPC stores</li>
            <li>Buy and sell metals for arbitrage profits</li>
            <li>Exchange equipment between players</li>
            <li>Auction rare items and creatures</li>
            <li>Coordinate town equipment sharing</li>
          </ul>
          <p>This marketplace will be implemented in a future update with the same mechanics.</p>
        </div>
      </div>
    </div>
  );
}

export default MarketScreen;