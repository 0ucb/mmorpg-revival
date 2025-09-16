import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { validateMarketListing, validatePurchaseQuantity, MARKET_LIMITS } from '@shared/validation/market';

function MarketScreen() {
  const { player, refreshPlayerData } = useAuth();
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sell dialog state
  const [sellDialog, setSellDialog] = useState(null);
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  useEffect(() => {
    loadListings();
    if (activeTab === 'my-listings') {
      loadMyListings();
    }
  }, [activeTab, filter]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' ? '/api/market' : `/api/market?type=${filter}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load listings');
      }
      
      const data = await response.json();
      setListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
      setError('Failed to load market listings');
    } finally {
      setLoading(false);
    }
  };

  const loadMyListings = async () => {
    try {
      const response = await fetch('/api/market/my-listings', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load your listings');
      }
      
      const data = await response.json();
      setMyListings(data);
    } catch (error) {
      console.error('Error loading my listings:', error);
    }
  };

  const buyItem = async (listing) => {
    const quantity = listing.quantity > 100 
      ? prompt(`How many ${listing.item_type} to buy? (1-${listing.quantity})`, listing.quantity)
      : listing.quantity;
    
    if (!quantity) return;
    
    const qty = parseInt(quantity);
    const validation = validatePurchaseQuantity(qty, listing.quantity);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/market/${listing.id}/buy`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed');
      }
      
      setSuccess(`Purchased ${data.purchased} ${listing.item_type} for ${data.total_cost} gold!`);
      loadListings();
      refreshPlayerData();
    } catch (error) {
      setError(error.message);
    }
  };

  const createListing = async () => {
    if (!sellDialog) return;
    
    const qty = parseInt(sellQuantity);
    const price = parseInt(sellPrice);
    
    const validation = validateMarketListing(qty, price, sellDialog);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/market', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: sellDialog,
          quantity: qty,
          unit_price: price
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing');
      }
      
      setSuccess(`Listed ${qty} ${sellDialog} for ${price} gold each!`);
      setSellDialog(null);
      setSellQuantity('');
      setSellPrice('');
      loadListings();
      refreshPlayerData();
    } catch (error) {
      setError(error.message);
    }
  };

  const cancelListing = async (listingId) => {
    if (!confirm('Cancel this listing and return items?')) return;

    try {
      setError('');
      
      const response = await fetch(`/api/market/${listingId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel listing');
      }
      
      setSuccess(`Returned ${data.returned} ${data.item_type} to your inventory`);
      loadMyListings();
      refreshPlayerData();
    } catch (error) {
      setError(error.message);
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString();
  };

  return (
    <div className="game-screen">
      <h2 className="sidebar-header">Player Market</h2>
      
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>
      )}
      
      {success && (
        <div style={{ color: '#33ff99', margin: '10px 0' }}>{success}</div>
      )}

      {/* Tab Navigation */}
      <div style={{ margin: '15px 0' }}>
        <a 
          onClick={() => setActiveTab('browse')}
          style={{ color: activeTab === 'browse' ? '#ffff99' : '#33ff99', marginRight: '20px' }}
        >
          [browse market]
        </a>
        <a 
          onClick={() => setActiveTab('sell')}
          style={{ color: activeTab === 'sell' ? '#ffff99' : '#33ff99', marginRight: '20px' }}
        >
          [sell items]
        </a>
        <a 
          onClick={() => setActiveTab('my-listings')}
          style={{ color: activeTab === 'my-listings' ? '#ffff99' : '#33ff99' }}
        >
          [my listings]
        </a>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div>
          <div style={{ margin: '10px 0' }}>
            Show: 
            <a 
              onClick={() => setFilter('all')}
              style={{ color: filter === 'all' ? '#ffff99' : '#33ff99', margin: '0 10px' }}
            >
              [all]
            </a>
            <a 
              onClick={() => setFilter('gems')}
              style={{ color: filter === 'gems' ? '#ffff99' : '#33ff99', margin: '0 10px' }}
            >
              [gems]
            </a>
            <a 
              onClick={() => setFilter('metals')}
              style={{ color: filter === 'metals' ? '#ffff99' : '#33ff99', margin: '0 10px' }}
            >
              [metals]
            </a>
          </div>

          {loading ? (
            <div>Loading listings...</div>
          ) : listings.length === 0 ? (
            <div style={{ margin: '20px 0', color: '#999' }}>
              No items for sale. Be the first to list something!
            </div>
          ) : (
            <div style={{ margin: '20px 0' }}>
              {listings.map(listing => (
                <div key={listing.id} style={{ margin: '8px 0' }}>
                  <span style={{ color: 'white' }}>
                    {listing.quantity} {listing.item_type} - {formatPrice(listing.unit_price)}g each
                    {listing.quantity > 1 && ` (total: ${formatPrice(listing.quantity * listing.unit_price)}g)`}
                  </span>
                  {' - '}
                  <span style={{ color: '#999' }}>Seller: {listing.seller_name}</span>
                  {' '}
                  <a 
                    onClick={() => buyItem(listing)}
                    style={{ color: '#33ff99' }}
                  >
                    [buy]
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sell Tab */}
      {activeTab === 'sell' && (
        <div>
          <h3 style={{ color: '#ffff99' }}>Your Resources</h3>
          <div style={{ margin: '15px 0' }}>
            <div style={{ margin: '5px 0' }}>
              Gems: {player?.gems || 0} 
              {player?.gems > 0 && (
                <a 
                  onClick={() => setSellDialog('gems')}
                  style={{ color: '#33ff99', marginLeft: '10px' }}
                >
                  [sell]
                </a>
              )}
            </div>
            <div style={{ margin: '5px 0' }}>
              Metals: {player?.metals || 0}
              {player?.metals > 0 && (
                <a 
                  onClick={() => setSellDialog('metals')}
                  style={{ color: '#33ff99', marginLeft: '10px' }}
                >
                  [sell]
                </a>
              )}
            </div>
          </div>

          {sellDialog && (
            <div style={{ 
              border: '1px solid #33ff99', 
              padding: '15px', 
              margin: '20px 0',
              background: '#001100'
            }}>
              <h3 style={{ color: '#ffff99' }}>
                Sell {sellDialog} (You have: {player[sellDialog]})
              </h3>
              <div style={{ margin: '10px 0' }}>
                <label style={{ color: 'white' }}>
                  Quantity: 
                  <input 
                    type="number"
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                    min="1"
                    max={player[sellDialog]}
                    style={{ 
                      marginLeft: '10px',
                      background: 'black',
                      color: '#33ff99',
                      border: '1px solid #33ff99',
                      padding: '2px 5px'
                    }}
                  />
                </label>
              </div>
              <div style={{ margin: '10px 0' }}>
                <label style={{ color: 'white' }}>
                  Price per unit: 
                  <input 
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    min={MARKET_LIMITS.MIN_PRICE}
                    max={MARKET_LIMITS.MAX_PRICE}
                    style={{ 
                      marginLeft: '10px',
                      background: 'black',
                      color: '#33ff99',
                      border: '1px solid #33ff99',
                      padding: '2px 5px'
                    }}
                  />
                  <span style={{ color: '#999', marginLeft: '5px' }}>gold</span>
                </label>
              </div>
              {sellQuantity && sellPrice && (
                <div style={{ color: '#ffff99', margin: '10px 0' }}>
                  Estimated Total: {formatPrice(parseInt(sellQuantity) * parseInt(sellPrice))} gold
                </div>
              )}
              <div style={{ margin: '15px 0' }}>
                <a 
                  onClick={createListing}
                  style={{ color: '#33ff99', marginRight: '20px' }}
                >
                  [create listing]
                </a>
                <a 
                  onClick={() => {
                    setSellDialog(null);
                    setSellQuantity('');
                    setSellPrice('');
                  }}
                  style={{ color: '#ff3333' }}
                >
                  [cancel]
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Listings Tab */}
      {activeTab === 'my-listings' && (
        <div>
          {myListings.length === 0 ? (
            <div style={{ margin: '20px 0', color: '#999' }}>
              You have no market listings.
            </div>
          ) : (
            <div style={{ margin: '20px 0' }}>
              {myListings.filter(l => l.status === 'active').length > 0 && (
                <>
                  <h3 style={{ color: '#ffff99' }}>Active Listings</h3>
                  {myListings.filter(l => l.status === 'active').map(listing => (
                    <div key={listing.id} style={{ margin: '8px 0' }}>
                      <span style={{ color: 'white' }}>
                        {listing.quantity} {listing.item_type} - {formatPrice(listing.unit_price)}g each
                      </span>
                      {' '}
                      <a 
                        onClick={() => cancelListing(listing.id)}
                        style={{ color: '#ff3333' }}
                      >
                        [cancel]
                      </a>
                    </div>
                  ))}
                </>
              )}
              
              {myListings.filter(l => l.status === 'sold').length > 0 && (
                <>
                  <h3 style={{ color: '#ffff99', marginTop: '20px' }}>Recently Sold</h3>
                  {myListings.filter(l => l.status === 'sold').slice(0, 10).map(listing => (
                    <div key={listing.id} style={{ margin: '8px 0', color: '#999' }}>
                      {listing.quantity} {listing.item_type} sold to {listing.buyer_name} for {formatPrice(listing.quantity * listing.unit_price)}g
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MarketScreen;