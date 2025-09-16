import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// API calls for gems store
const getGemsStoreStatus = async () => {
  const response = await fetch('/api/gems-store', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};

const purchaseGems = async (quantity) => {
  const response = await fetch('/api/gems-store/purchase', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};

function GemsStoreScreen() {
  const { refreshPlayer } = useAuth();
  const [storeStatus, setStoreStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadStoreStatus();
  }, []);

  const loadStoreStatus = async () => {
    try {
      setLoading(true);
      const data = await getGemsStoreStatus();
      
      if (data.success) {
        setStoreStatus(data);
      }
    } catch (error) {
      console.error('Error loading gems store status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (gemQuantity) => {
    if (gemQuantity <= 0 || gemQuantity > storeStatus.gems_remaining) {
      return;
    }

    const totalCost = gemQuantity * storeStatus.price_per_gem;
    if (totalCost > storeStatus.player_gold) {
      return;
    }

    try {
      setPurchasing(true);
      const result = await purchaseGems(gemQuantity);
      
      if (result.success) {
        // Refresh player data in sidebar and reload store status
        await refreshPlayer();
        await loadStoreStatus();
        setQuantity(1);
      }
    } catch (error) {
      console.error('Error purchasing gems:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleQuickPurchase = (amount) => {
    const maxAmount = Math.min(amount, storeStatus.gems_remaining);
    handlePurchase(maxAmount);
  };

  if (loading) {
    return (
      <div className="loading-content">
        <h2>Loading gems store...</h2>
      </div>
    );
  }

  return (
    <div className="gems-store-screen">
      <div className="sidebar-header">Town gems store</div>
      
      <div className="store-status">
        <p><strong>Your Gold:</strong> {storeStatus.player_gold}</p>
        <p><strong>Your Gems:</strong> {storeStatus.player_gems}</p>
        <p><strong>Price:</strong> {storeStatus.price_per_gem} gold per gem</p>
        <p><strong>Today:</strong> {storeStatus.gems_purchased_today}/{storeStatus.daily_limit} gems purchased</p>
        <p><strong>Remaining:</strong> {storeStatus.gems_remaining} gems available today</p>
      </div>

      {storeStatus.gems_remaining > 0 ? (
        <div className="purchase-section">
          <div className="quantity-input">
            <label>Quantity: </label>
            <input 
              type="number" 
              min="1" 
              max={storeStatus.gems_remaining}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(storeStatus.gems_remaining, parseInt(e.target.value) || 1)))}
              disabled={purchasing}
            />
            <span className="cost-display">
              Cost: {quantity * storeStatus.price_per_gem} gold
            </span>
          </div>

          <div className="purchase-buttons">
            <button
              className="city-link"
              onClick={() => handlePurchase(quantity)}
              disabled={purchasing || !storeStatus.can_purchase}
            >
              {purchasing ? 'Buying...' : `Buy ${quantity} Gems`}
            </button>
          </div>

          <div className="quick-purchase">
            <p>Quick purchase:</p>
            <div className="quick-buttons">
              {[5, 10, storeStatus.gems_remaining].filter(n => n > 0 && n <= storeStatus.gems_remaining).map(amount => (
                <button
                  key={amount}
                  className="city-link"
                  onClick={() => handleQuickPurchase(amount)}
                  disabled={purchasing || (amount * storeStatus.price_per_gem) > storeStatus.player_gold}
                  style={{ margin: '0 5px' }}
                >
                  {amount === storeStatus.gems_remaining ? 'All' : amount}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="daily-limit-reached">
          <p>Daily limit reached! You have purchased all 30 gems available today.</p>
          <p>Come back tomorrow for more gems.</p>
        </div>
      )}

      <div className="gems-info">
        <h3>About Gems</h3>
        <ul>
          <li>Daily limit: 30 gems per day</li>
          <li>Fixed price: 90 gold per gem</li>
          <li>Used for mana tree purchases (100 gems = 1 max mana)</li>
          <li>Essential for daily trading routines</li>
          <li>Reset at midnight server time</li>
        </ul>
      </div>
    </div>
  );
}

export default GemsStoreScreen;