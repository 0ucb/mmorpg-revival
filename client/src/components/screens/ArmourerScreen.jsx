import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// API calls for armourer (armor only)
const getArmourerArmor = async () => {
  const response = await fetch('/api/armourer', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};

const purchaseArmor = async (equipmentId) => {
  const response = await fetch('/api/armourer/purchase', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ equipment_id: equipmentId })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};

function ArmourerScreen() {
  const { refreshPlayer } = useAuth();
  const [armorBySlot, setArmorBySlot] = useState({});
  const [playerGold, setPlayerGold] = useState(0);
  const [playerStrength, setPlayerStrength] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadArmor();
  }, []);

  const loadArmor = async () => {
    try {
      setLoading(true);
      const data = await getArmourerArmor();
      
      if (data.success) {
        setArmorBySlot(data.armor_by_slot);
        setPlayerGold(data.player_gold);
        setPlayerStrength(data.player_strength);
      }
    } catch (error) {
      console.error('Error loading armourer armor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (armor) => {
    if (armor.cost_gold > playerGold) {
      alert('Not enough gold!');
      return;
    }

    if (!armor.can_use) {
      const confirmed = confirm(`This armor requires ${armor.strength_required} strength. You have ${playerStrength}. Purchase anyway?`);
      if (!confirmed) return;
    }

    try {
      setPurchasing(true);
      const result = await purchaseArmor(armor.id);
      
      if (result.success) {
        setPlayerGold(result.remaining_gold);
        alert(`Successfully purchased ${result.armor_name} (${result.armor_slot})!`);
        
        // Refresh player data in sidebar and reload armor
        await refreshPlayer();
        await loadArmor();
      }
    } catch (error) {
      console.error('Error purchasing armor:', error);
      alert(`Failed to purchase armor: ${error.message}`);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-content">
        <h2>Loading armourer inventory...</h2>
      </div>
    );
  }

  const slotOrder = ['head', 'body', 'legs', 'hands', 'feet'];

  return (
    <div className="armourer-screen">
      <div className="sidebar-header">Armourer</div>
      
      <div className="armourer-description">
        <p><strong>Your Gold:</strong> {playerGold} | <strong>Your Strength:</strong> {playerStrength}</p>
      </div>

      <div className="shop-inventory">
        {slotOrder.map(slot => (
          <div key={slot} className="armor-slot-section">
            <h3 className="slot-header">{slot.charAt(0).toUpperCase() + slot.slice(1)} Armor</h3>
            
            <div className="armor-list">
              {(armorBySlot[slot] || []).map(armor => (
                <div key={armor.id} className="armor-row">
                  <div className="armor-info">
                    <span className="armor-name">{armor.name}</span>
                    <span className="armor-protection">
                      {armor.protection} protection
                    </span>
                    <span className="armor-encumbrance">
                      {armor.encumbrance} encumbrance
                    </span>
                    <span className="armor-cost">{armor.cost_gold} gold</span>
                    <span className="armor-requirement">
                      Str: {armor.strength_required || 1}
                    </span>
                  </div>
                  
                  <div className="armor-actions">
                    <button
                      className="city-link"
                      onClick={() => handlePurchase(armor)}
                      disabled={purchasing || armor.cost_gold > playerGold}
                      style={{
                        opacity: (purchasing || armor.cost_gold > playerGold) ? 0.5 : 1,
                        backgroundColor: armor.can_use ? 'transparent' : '#444'
                      }}
                    >
                      {purchasing ? 'Buying...' : 'Buy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArmourerScreen;