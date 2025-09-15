import React, { useState, useEffect } from 'react';
import { getEquipmentShop, purchaseEquipment, getPlayerInfo } from '../../api/equipment';
import { useAuth } from '../../contexts/AuthContext';

function BlacksmithScreen() {
  const { refreshPlayer } = useAuth();
  const [weapons, setWeapons] = useState([]);
  const [armor, setArmor] = useState([]);
  const [playerGold, setPlayerGold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState('weapons');

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      setLoading(true);
      const [weaponData, armorData, playerData] = await Promise.all([
        getEquipmentShop('weapons'),
        getEquipmentShop('armor'),
        getPlayerInfo()
      ]);
      
      setWeapons(weaponData);
      setArmor(armorData);
      setPlayerGold(playerData.gold);
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item, type) => {
    if (item.cost > playerGold) {
      alert('Not enough gold!');
      return;
    }

    if (item.strength_required && item.strength_required > 1) {
      const confirmed = confirm(`This item requires ${item.strength_required} strength. Are you sure you meet the requirements?`);
      if (!confirmed) return;
    }

    try {
      setPurchasing(true);
      await purchaseEquipment(item.id, type);
      
      setPlayerGold(playerGold - item.cost);
      alert(`Successfully purchased ${item.name}!`);
      
      loadShopData();
      // Refresh player data in sidebar after purchase
      await refreshPlayer();
    } catch (error) {
      console.error('Error purchasing item:', error);
      alert(`Failed to purchase item: ${error.message}`);
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

  const currentItems = activeTab === 'weapons' ? weapons : armor;

  return (
    <div className="blacksmith-screen">
      <div className="box-header">The Blacksmith</div>
      
      <div className="blacksmith-description">
        <p>Welcome to the finest blacksmith in MarcoLand! Here you can purchase weapons and armor to improve your combat effectiveness.</p>
        <p><strong>Your Gold:</strong> {playerGold}</p>
      </div>

      <div className="shop-tabs">
        <button 
          className={`tab-button ${activeTab === 'weapons' ? 'active' : ''}`}
          onClick={() => setActiveTab('weapons')}
        >
          Weapons ({weapons.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'armor' ? 'active' : ''}`}
          onClick={() => setActiveTab('armor')}
        >
          Armor ({armor.length})
        </button>
      </div>

      <div className="shop-inventory">
        <div className="box-header">
          {activeTab === 'weapons' ? 'Weapons Available' : 'Armor Available'}
        </div>
        
        <div className="shop-table">
          <div className="table-header">
            <span>Name</span>
            <span>{activeTab === 'weapons' ? 'Damage' : 'Defense'}</span>
            <span>Cost</span>
            <span>Str Req</span>
            <span>Action</span>
          </div>
          
          {currentItems.map(item => (
            <div key={item.id} className="shop-row">
              <span className="item-name">{item.name}</span>
              <span className="item-stat">
                {activeTab === 'weapons' ? item.damage || 0 : item.defense || 0}
              </span>
              <span className="item-cost">{item.cost}</span>
              <span className="item-requirement">
                {item.strength_required || 1}
              </span>
              <button
                className={`marcoland-button ${item.cost > playerGold ? 'disabled' : 'buy-button'}`}
                onClick={() => handlePurchase(item, activeTab.slice(0, -1))}
                disabled={purchasing || item.cost > playerGold}
              >
                {purchasing ? 'Buying...' : 'Buy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="blacksmith-tips">
        <div className="box-header">Blacksmith's Advice</div>
        <ul>
          <li><strong>Weapons</strong> increase your damage in combat</li>
          <li><strong>Armor</strong> increases your defense against attacks</li>
          <li>Higher tier equipment requires more strength to use effectively</li>
          <li>Better equipment costs more gold but provides superior protection</li>
          <li>Visit the Temple to increase your strength for better equipment</li>
        </ul>
      </div>
    </div>
  );
}

export default BlacksmithScreen;