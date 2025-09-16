import React, { useEffect, useReducer, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { validateMarketListing, validatePurchaseQuantity, MARKET_LIMITS } from '@shared/validation/market';
import { marketReducer, marketInitialState } from '../../reducers/marketReducer';
import { MarketTabs } from '../market/MarketTabs';
import { MarketFilters } from '../market/MarketFilters';
import { MarketListing } from '../market/MarketListing';
import { SellDialog } from '../market/SellDialog';

function MarketScreen() {
  const { player, refreshPlayer } = useAuth();
  const [state, dispatch] = useReducer(marketReducer, marketInitialState);
  
  // Memoized filtered listings
  const filteredListings = useMemo(() => {
    if (state.filter === 'all') return state.listings;
    return state.listings.filter(l => l.item_type === state.filter);
  }, [state.listings, state.filter]);

  useEffect(() => {
    loadListings();
    if (state.activeTab === 'my-listings') {
      loadMyListings();
    }
  }, [state.activeTab, state.filter]);

  const loadListings = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const url = state.filter === 'all' ? '/api/market' : `/api/market?type=${state.filter}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load listings');
      }
      
      const data = await response.json();
      dispatch({ type: 'SET_LISTINGS', payload: data });
    } catch (error) {
      console.error('Error loading listings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load market listings' });
    }
  }, [state.filter]);

  const loadMyListings = useCallback(async () => {
    try {
      const response = await fetch('/api/market/my-listings', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load your listings');
      }
      
      const data = await response.json();
      dispatch({ type: 'SET_MY_LISTINGS', payload: data });
    } catch (error) {
      console.error('Error loading my listings:', error);
    }
  }, []);

  const buyItem = useCallback(async (listing) => {
    const quantity = listing.quantity > 100 
      ? prompt(`How many ${listing.item_type} to buy? (1-${listing.quantity})`, listing.quantity)
      : listing.quantity;
    
    if (!quantity) return;
    
    const qty = parseInt(quantity);
    const validation = validatePurchaseQuantity(qty, listing.quantity);
    if (!validation.valid) {
      dispatch({ type: 'SET_ERROR', payload: validation.errors[0] });
      return;
    }

    try {
      dispatch({ type: 'RESET_MESSAGES' });
      
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
      
      dispatch({ type: 'SET_SUCCESS', payload: `Purchased ${data.purchased} ${listing.item_type} for ${data.total_cost} gold!` });
      loadListings();
      refreshPlayer();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [loadListings, refreshPlayer]);

  const createListing = useCallback(async () => {
    if (!state.sellDialog) return;
    
    const qty = parseInt(state.sellQuantity);
    const price = parseInt(state.sellPrice);
    
    const validation = validateMarketListing(qty, price, state.sellDialog);
    if (!validation.valid) {
      dispatch({ type: 'SET_ERROR', payload: validation.errors[0] });
      return;
    }

    try {
      dispatch({ type: 'RESET_MESSAGES' });
      
      const response = await fetch('/api/market', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: state.sellDialog,
          quantity: qty,
          unit_price: price
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing');
      }
      
      dispatch({ type: 'SET_SUCCESS', payload: `Listed ${qty} ${state.sellDialog} for ${price} gold each!` });
      dispatch({ type: 'CLOSE_SELL_DIALOG' });
      loadListings();
      refreshPlayer();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.sellDialog, state.sellQuantity, state.sellPrice, loadListings, refreshPlayer]);

  const cancelListing = useCallback(async (listingId) => {
    if (!confirm('Cancel this listing and return items?')) return;

    try {
      dispatch({ type: 'RESET_MESSAGES' });
      
      const response = await fetch(`/api/market/${listingId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel listing');
      }
      
      dispatch({ type: 'SET_SUCCESS', payload: `Returned ${data.returned} ${data.item_type} to your inventory` });
      loadMyListings();
      refreshPlayer();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [loadMyListings, refreshPlayer]);

  const formatPrice = useCallback((price) => {
    return price.toLocaleString();
  }, []);

  // Memoized callbacks for child components
  const handleTabChange = useCallback((tab) => {
    dispatch({ type: 'SET_TAB', payload: tab });
  }, []);

  const handleFilterChange = useCallback((filter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const handleOpenSellDialog = useCallback((itemType) => {
    dispatch({ type: 'OPEN_SELL_DIALOG', payload: itemType });
  }, []);

  return (
    <div className="game-screen">
      <h2 className="sidebar-header">Player Market</h2>
      
      {state.error && (
        <div style={{ color: 'red', margin: '10px 0' }}>{state.error}</div>
      )}
      
      {state.success && (
        <div style={{ color: '#33ff99', margin: '10px 0' }}>{state.success}</div>
      )}

      <MarketTabs activeTab={state.activeTab} onTabChange={handleTabChange} />

      {/* Browse Tab */}
      {state.activeTab === 'browse' && (
        <div>
          <MarketFilters currentFilter={state.filter} onFilterChange={handleFilterChange} />

          {state.loading ? (
            <div>Loading listings...</div>
          ) : filteredListings.length === 0 ? (
            <div style={{ margin: '20px 0', color: '#999' }}>
              No items for sale. Be the first to list something!
            </div>
          ) : (
            <div style={{ margin: '20px 0' }}>
              {filteredListings.map(listing => (
                <MarketListing 
                  key={listing.id}
                  listing={listing}
                  onBuy={buyItem}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sell Tab */}
      {state.activeTab === 'sell' && (
        <div>
          <h3 style={{ color: '#ffff99' }}>Your Resources</h3>
          <div style={{ margin: '15px 0' }}>
            <div style={{ margin: '5px 0' }}>
              Gems: {player?.gems || 0} 
              {player?.gems > 0 && (
                <a 
                  onClick={() => handleOpenSellDialog('gems')}
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
                  onClick={() => handleOpenSellDialog('metals')}
                  style={{ color: '#33ff99', marginLeft: '10px' }}
                >
                  [sell]
                </a>
              )}
            </div>
          </div>

          {state.sellDialog && (
            <SellDialog
              itemType={state.sellDialog}
              maxQuantity={player[state.sellDialog]}
              quantity={state.sellQuantity}
              price={state.sellPrice}
              onQuantityChange={(value) => dispatch({ type: 'SET_SELL_QUANTITY', payload: value })}
              onPriceChange={(value) => dispatch({ type: 'SET_SELL_PRICE', payload: value })}
              onConfirm={createListing}
              onCancel={() => dispatch({ type: 'CLOSE_SELL_DIALOG' })}
              formatPrice={formatPrice}
            />
          )}
        </div>
      )}

      {/* My Listings Tab */}
      {state.activeTab === 'my-listings' && (
        <div>
          {state.myListings.length === 0 ? (
            <div style={{ margin: '20px 0', color: '#999' }}>
              You have no market listings.
            </div>
          ) : (
            <div style={{ margin: '20px 0' }}>
              {state.myListings.filter(l => l.status === 'active').length > 0 && (
                <>
                  <h3 style={{ color: '#ffff99' }}>Active Listings</h3>
                  {state.myListings.filter(l => l.status === 'active').map(listing => (
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
              
              {state.myListings.filter(l => l.status === 'sold').length > 0 && (
                <>
                  <h3 style={{ color: '#ffff99', marginTop: '20px' }}>Recently Sold</h3>
                  {state.myListings.filter(l => l.status === 'sold').slice(0, 10).map(listing => (
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