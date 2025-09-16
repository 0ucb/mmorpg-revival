import React, { useState, useEffect } from 'react';
import InventoryItem from '../InventoryItem';
import { getEquipmentInventory, sellEquipment, equipItem } from '../../api/equipment';

function EquipmentScreen() {
  const [equipmentData, setEquipmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadEquipmentData();
  }, []);

  const loadEquipmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getEquipmentInventory();
      setEquipmentData(data);
    } catch (err) {
      console.error('Error loading equipment:', err);
      setError(err.message);
      
      // Set fallback demo data
      setEquipmentData({
        success: true,
        equipped: {
          weapon: null,
          head: null,
          body: null,
          legs: null,
          hands: null,
          feet: null
        },
        inventory: [
          {
            inventory_id: 1,
            item: {
              id: 1,
              name: 'Rusty Dagger',
              damage_min: 1,
              damage_max: 5,
              strength_required: 0,
              cost_gold: 100
            },
            type: 'weapon'
          }
        ],
        combat_stats: {
          total_protection: 0,
          total_encumbrance: 0,
          speed_modifier: 1.0,
          weapon_damage_min: 0,
          weapon_damage_max: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSellItem = async (inventoryId) => {
    try {
      setActionLoading(`sell-${inventoryId}`);
      
      const result = await sellEquipment(inventoryId);
      
      // Reload equipment data to reflect changes
      await loadEquipmentData();
      // Show success message
      console.log(`Sold ${result.item_name} for ${result.gold_earned} gold!`);
    } catch (err) {
      console.error('Error selling item:', err);
      console.error('Error selling item:', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEquipItem = async (inventoryId, itemType, item) => {
    try {
      setActionLoading(`equip-${inventoryId}`);
      
      // Determine the slot based on item type and item details
      let slot = 'weapon';
      if (itemType === 'armor') {
        // For armor, determine slot by armor type or name
        // This could be improved by having slot info in the item data
        const itemName = item.name.toLowerCase();
        if (itemName.includes('helmet') || itemName.includes('hat') || itemName.includes('cap')) {
          slot = 'head';
        } else if (itemName.includes('glove') || itemName.includes('gauntlet')) {
          slot = 'hands';
        } else if (itemName.includes('boot') || itemName.includes('shoe')) {
          slot = 'feet';
        } else if (itemName.includes('leg') || itemName.includes('pants')) {
          slot = 'legs';
        } else {
          slot = 'body'; // Default for chest armor
        }
      }

      const result = await equipItem(slot, inventoryId);
      
      // Reload equipment data to reflect changes
      await loadEquipmentData();
      console.log('Item equipped successfully!');
    } catch (err) {
      console.error('Error equipping item:', err);
      console.error('Error equipping item:', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getEquippedItemName = (slot) => {
    const equippedItem = equipmentData?.equipped?.[slot];
    if (!equippedItem) return null;
    
    // Handle both direct item objects and nested structures
    const item = equippedItem.item || equippedItem;
    return item?.name || null;
  };

  const handleUnequip = async (slot) => {
    try {
      setActionLoading(`unequip-${slot}`);
      
      await equipItem(slot, null); // null means unequip
      await loadEquipmentData(); // Refresh data
      console.log('Item unequipped successfully!', { slot });
    } catch (err) {
      console.error('Error unequipping item:', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const renderEquipmentSlot = (slot, label) => {
    const equippedItem = equipmentData?.equipped?.[slot];
    const isUnequipping = actionLoading === `unequip-${slot}`;
    
    return (
      <div key={slot} className="equipment-slot">
        <span className="slot-label">{label} :</span>
        <span className="slot-value">
          {equippedItem ? getEquippedItemName(slot) : '[empty]'}
          {equippedItem && (
            <span style={{ marginLeft: '10px' }}>
              {isUnequipping ? (
                <span style={{ color: '#888' }}>[unequipping...]</span>
              ) : (
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleUnequip(slot);
                  }}
                  style={{ 
                    color: '#33FF99', 
                    textDecoration: 'none',
                    fontSize: '0.9em'
                  }}
                >
                  [unequip]
                </a>
              )}
            </span>
          )}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="equipment-section">
        <div className="loading">Loading equipment...</div>
      </div>
    );
  }

  if (error && !equipmentData) {
    return (
      <div className="equipment-section">
        <div className="error">Failed to load equipment data: {error}</div>
      </div>
    );
  }

  const combatStats = equipmentData?.combat_stats || {
    total_protection: 0,
    total_encumbrance: 0,
    speed_modifier: 1.0
  };

  return (
    <div className="equipment-section">
      {/* MarcoLand header */}
      <div className="marcoland-logo">
        <div className="logo-text">MARCOLAND</div>
        <div className="tagline">Survival meets Destiny</div>
      </div>

      <div className="equipment-header">My equipment</div>
      
      {/* Equipment Slots */}
      <div className="equipment-slots">
        {renderEquipmentSlot('legs', 'Lower body')}
        {renderEquipmentSlot('body', 'Upper body')}
        {renderEquipmentSlot('head', 'Head')}
        {renderEquipmentSlot('hands', 'Hands')}
        {renderEquipmentSlot('feet', 'Feet')}
        {renderEquipmentSlot('weapon', 'Weapon')}
      </div>

      {/* Equipment Stats */}
      <div className="equipment-stats">
        <div>Encumbrance : {combatStats.total_encumbrance}/1</div>
        <div>Total Protection : {combatStats.total_protection}</div>
      </div>

      {/* Inventory Header */}
      <div className="inventory-header">My equipment</div>

      {/* Inventory Items */}
      <div className="inventory-items">
        {equipmentData?.inventory?.length > 0 ? (
          equipmentData.inventory.map((invItem) => (
            <InventoryItem 
              key={invItem.inventory_id}
              item={invItem.item}
              inventoryId={invItem.inventory_id}
              itemId={invItem.item_id}
              type={invItem.type}
              onSell={handleSellItem}
              onEquip={handleEquipItem}
              isLoading={actionLoading === `sell-${invItem.inventory_id}` || actionLoading === `equip-${invItem.inventory_id}`}
            />
          ))
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: '#888888', 
            fontStyle: 'italic',
            padding: '20px' 
          }}>
            No items in inventory
          </div>
        )}
      </div>

      {error && (
        <div className="error">
          Using demo data due to API connection issues.
        </div>
      )}
    </div>
  );
}

export default EquipmentScreen;