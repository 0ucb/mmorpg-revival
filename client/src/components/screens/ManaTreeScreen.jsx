import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// API calls for mana tree
const getManaTreeStatus = async () => {
  const response = await fetch('/api/resources/mana-tree', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};

const purchaseMana = async () => {
  const response = await fetch('/api/resources/mana-tree/purchase', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};

function ManaTreeScreen() {
  const { refreshPlayer } = useAuth();
  const [treeStatus, setTreeStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadTreeStatus();
  }, []);

  const loadTreeStatus = async () => {
    try {
      setLoading(true);
      const data = await getManaTreeStatus();
      
      if (data.success) {
        setTreeStatus(data);
      }
    } catch (error) {
      console.error('Error loading mana tree status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      const result = await purchaseMana();
      
      if (result.success) {
        alert(`Successfully purchased 1 max mana for ${result.gems_spent} gems!`);
        
        // Refresh player data and tree status
        await refreshPlayer();
        await loadTreeStatus();
      }
    } catch (error) {
      console.error('Error purchasing mana:', error);
      alert(`Failed to purchase mana: ${error.message}`);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-content">
        <h2>Loading Tall Tree of Mana...</h2>
      </div>
    );
  }

  return (
    <div className="mana-tree-screen">
      <div className="sidebar-header">Tall tree of Mana</div>
      
      <div className="tree-status">
        <p><strong>Your Gems:</strong> {treeStatus.player_gems}</p>
        <p><strong>Current Max Mana:</strong> {treeStatus.current_max_mana}</p>
        <p><strong>Cost:</strong> {treeStatus.gems_required} gems per max mana</p>
        <p><strong>Daily Limit:</strong> {treeStatus.daily_limit} purchase per day</p>
      </div>

      <div className="mana-tree-section">
        {treeStatus.can_purchase ? (
          <div className="purchase-available">
            <h2>Buy 1 Daily Mana here, DO IT</h2>
            <p>Exchange gems for permanent max mana increase!</p>
            
            <div className="purchase-details">
              <p>This will permanently increase your maximum mana by 1.</p>
              <p>Cost: {treeStatus.gems_required} gems</p>
              <p>Current max mana: {treeStatus.current_max_mana}</p>
              <p>After purchase: {treeStatus.current_max_mana + 1} max mana</p>
            </div>

            <button
              className="city-link mana-purchase-button"
              onClick={handlePurchase}
              disabled={purchasing}
              style={{ 
                fontSize: '1.2em', 
                padding: '10px 20px',
                margin: '10px 0'
              }}
            >
              {purchasing ? 'Purchasing...' : `Buy 1 Max Mana (${treeStatus.gems_required} gems)`}
            </button>
          </div>
        ) : (
          <div className="purchase-unavailable">
            <h2>Mana Tree</h2>
            <p>{treeStatus.message}</p>
            
            {treeStatus.mana_purchased_today > 0 ? (
              <div className="already-purchased">
                <p>You have already purchased mana today.</p>
                <p>Come back tomorrow for another purchase!</p>
              </div>
            ) : (
              <div className="insufficient-gems">
                <p>You need {treeStatus.gems_required} gems to purchase mana.</p>
                <p>Visit the Town gems store to buy more gems.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mana-tree-info">
        <h3>About the Tall Tree of Mana</h3>
        <ul>
          <li>Permanently increases your maximum mana</li>
          <li>Cost: {treeStatus.gems_required} gems per max mana point</li>
          <li>Daily limit: {treeStatus.daily_limit} purchase per day</li>
          <li>Essential for advanced gameplay strategies</li>
          <li>More mana = more beach fights and temple prayers</li>
          <li>Requires gems from daily store purchases</li>
        </ul>
        
        <div className="strategy-tip">
          <h4>Daily Routine Strategy:</h4>
          <ol>
            <li>Vote for 500-1000 gold</li>
            <li>Buy 30 gems from store (2,700 gold)</li>
            <li>Save gems until you have 100+</li>
            <li>Purchase max mana here when ready</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default ManaTreeScreen;