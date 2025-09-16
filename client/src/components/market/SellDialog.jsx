import React from 'react';

export function SellDialog({ 
  itemType, 
  maxQuantity, 
  quantity, 
  price, 
  onQuantityChange,
  onPriceChange,
  onConfirm, 
  onCancel,
  formatPrice 
}) {
  const inputStyles = {
    marginLeft: '10px',
    background: 'black',
    color: '#33ff99',
    border: '1px solid #33ff99',
    padding: '2px 5px'
  };

  return (
    <div style={{ 
      border: '1px solid #33ff99', 
      padding: '15px', 
      margin: '20px 0',
      background: '#001100'
    }}>
      <h3 style={{ color: '#ffff99' }}>
        Sell {itemType} (You have: {maxQuantity})
      </h3>
      
      <div style={{ margin: '10px 0' }}>
        <label style={{ color: 'white' }}>
          Quantity: 
          <input 
            type="number"
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
            min="1"
            max={maxQuantity}
            style={inputStyles}
          />
        </label>
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <label style={{ color: 'white' }}>
          Price per unit: 
          <input 
            type="number"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            min="1"
            max="1000000"
            style={inputStyles}
          />
          <span style={{ color: '#999', marginLeft: '5px' }}>gold</span>
        </label>
      </div>
      
      {quantity && price && (
        <div style={{ color: '#ffff99', margin: '10px 0' }}>
          Total: {formatPrice(parseInt(quantity) * parseInt(price))} gold
        </div>
      )}
      
      <div style={{ margin: '15px 0' }}>
        <a 
          onClick={onConfirm}
          style={{ color: '#33ff99', marginRight: '20px', cursor: 'pointer' }}
        >
          [create listing]
        </a>
        <a 
          onClick={onCancel}
          style={{ color: '#ff3333', cursor: 'pointer' }}
        >
          [cancel]
        </a>
      </div>
    </div>
  );
}