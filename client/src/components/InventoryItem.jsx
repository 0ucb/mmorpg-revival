import React from 'react';

function InventoryItem({ item, inventoryId, itemId, type, onSell, onEquip, isLoading }) {
  if (!item) return null;

  const handleSell = () => {
    if (window.confirm(`Are you sure you want to sell ${item.name}?`)) {
      onSell(inventoryId);
    }
  };

  const handleEquip = () => {
    onEquip(itemId, type, item); // Use itemId instead of inventoryId
  };

  const formatDamage = () => {
    if (type === 'weapon' && item.damage_min !== undefined && item.damage_max !== undefined) {
      return `Damage : [ ${item.damage_min}/${item.damage_max} ]`;
    }
    return '';
  };

  const formatProtection = () => {
    if (type === 'armor' && item.protection !== undefined) {
      return `Protection : [ ${item.protection} ]`;
    }
    return '';
  };

  const formatStrengthRequired = () => {
    const strengthReq = item.strength_required || 0;
    return `Strength Needed = [ ${strengthReq} ]`;
  };

  const getItemStats = () => {
    const stats = [];
    
    if (type === 'weapon') {
      if (formatDamage()) stats.push(formatDamage());
    } else if (type === 'armor') {
      if (formatProtection()) stats.push(formatProtection());
    }
    
    stats.push(formatStrengthRequired());
    return stats.join(' ');
  };

  return (
    <div className="inventory-item">
      <div className="item-name">
        {item.name}
      </div>
      
      <div className="item-stats">
        {getItemStats()}
      </div>
      
      <div className="item-actions">
        <button onClick={handleSell} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Sell'}
        </button>
        <button onClick={handleEquip} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Equip'}
        </button>
      </div>
    </div>
  );
}

export default InventoryItem;