import React from 'react';

export function MarketListing({ listing, onBuy, formatPrice, showBuyButton = true }) {
  return (
    <div style={{ margin: '8px 0' }}>
      <span style={{ color: 'white' }}>
        {listing.quantity} {listing.item_type} - {formatPrice(listing.unit_price)}g each
        {listing.quantity > 1 && ` (total: ${formatPrice(listing.quantity * listing.unit_price)}g)`}
      </span>
      {' - '}
      <span style={{ color: '#999' }}>
        Seller: {listing.seller_name}
      </span>
      {showBuyButton && (
        <>
          {' '}
          <a 
            onClick={() => onBuy(listing)}
            style={{ color: '#33ff99', cursor: 'pointer' }}
          >
            [buy]
          </a>
        </>
      )}
    </div>
  );
}