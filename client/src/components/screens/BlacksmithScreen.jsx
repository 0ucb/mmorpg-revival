import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// API calls for blacksmith (weapons only)
const getBlacksmithWeapons = async () => {
  const response = await fetch('/api/blacksmith', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};

const purchaseWeapon = async (equipmentId) => {
  const response = await fetch('/api/blacksmith/purchase', {
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

function BlacksmithScreen() {
  const { refreshPlayer } = useAuth();
  const [weapons, setWeapons] = useState([]);
  const [playerGold, setPlayerGold] = useState(0);
  const [playerStrength, setPlayerStrength] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadWeapons();
  }, []);

  const loadWeapons = async () => {
    try {
      setLoading(true);
      const data = await getBlacksmithWeapons();
      
      if (data.success) {
        setWeapons(data.weapons);
        setPlayerGold(data.player_gold);
        setPlayerStrength(data.player_strength);
      }
    } catch (error) {
      console.error('Error loading blacksmith weapons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (weapon) => {
    if (weapon.cost_gold > playerGold) {
      return; // UI already shows affordability
    }

    if (!weapon.can_use) {
      const confirmed = confirm(`This weapon requires ${weapon.strength_required} strength. You have ${playerStrength}. Purchase anyway?`);
      if (!confirmed) return;
    }

    try {
      setPurchasing(true);
      const result = await purchaseWeapon(weapon.id);
      
      if (result.success) {
        setPlayerGold(result.remaining_gold);
        console.log(`Successfully purchased ${result.weapon_name}!`);
        
        // Refresh player data in sidebar and reload weapons
        await refreshPlayer();
        await loadWeapons();
      }
    } catch (error) {
      console.error('Error purchasing weapon:', error);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-content">
        <h2>Loading blacksmith inventory...</h2>
      </div>
    );
  }

  return (
    <div className="blacksmith-screen">
      <div className="sidebar-header">Blacksmith</div>
      
      <div className="blacksmith-description">
        <p><strong>Your Gold:</strong> {playerGold} | <strong>Your Strength:</strong> {playerStrength}</p>
      </div>

      <div className="shop-inventory">
        <div className="weapons-list">
          {weapons.map(weapon => (
            <div key={weapon.id} className="weapon-row">
              <div className="weapon-info">
                <span className="weapon-name">{weapon.name}</span>
                <span className="weapon-damage">
                  {weapon.damage_min}-{weapon.damage_max} damage
                </span>
                <span className="weapon-cost">{weapon.cost_gold} gold</span>
                <span className="weapon-requirement">
                  Str: {weapon.strength_required || 1}
                </span>
              </div>
              
              <div className="weapon-actions">
                <button
                  className="city-link"
                  onClick={() => handlePurchase(weapon)}
                  disabled={purchasing || weapon.cost_gold > playerGold}
                  style={{
                    opacity: (purchasing || weapon.cost_gold > playerGold) ? 0.5 : 1,
                    backgroundColor: weapon.can_use ? 'transparent' : '#444'
                  }}
                >
                  {purchasing ? 'Buying...' : 'Buy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BlacksmithScreen;