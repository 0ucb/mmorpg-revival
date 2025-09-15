// API utility functions for equipment system

const API_BASE = '/api';

// Helper function to handle API responses with authentication
const handleResponse = async (response) => {
  if (!response.ok) {
    // Handle authentication errors specifically
    if (response.status === 401) {
      // Auth error - redirect to login by reloading the page
      // This will trigger the AuthWrapper to show login screen
      console.warn('Authentication required - redirecting to login');
      window.location.reload();
      return null;
    }
    
    // Handle other errors
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
    } catch {
      // If response isn't JSON, try to get text
      try {
        errorMessage = await response.text() || `HTTP ${response.status}`;
      } catch {
        errorMessage = `HTTP ${response.status}`;
      }
    }
    
    throw new Error(`API Error: ${errorMessage}`);
  }
  return response.json();
};

// Helper function to make authenticated API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include', // Include session cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    return handleResponse(response);
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
  }
};

// Get player basic information
export const getPlayerInfo = async () => {
  return apiCall('/players/me');
};

// Get player detailed stats
export const getPlayerStats = async () => {
  return apiCall('/players/me/stats');
};

// Get equipment inventory (equipped + unequipped items)
export const getEquipmentInventory = async () => {
  return apiCall('/equipment/inventory');
};

// Get equipment shop items
export const getEquipmentShop = async (type = 'all') => {
  return apiCall(`/equipment/shop?type=${type}`);
};

// Purchase equipment
export const purchaseEquipment = async (equipmentId, type) => {
  return apiCall('/equipment/purchase', {
    method: 'POST',
    body: JSON.stringify({
      equipment_id: equipmentId,
      type: type
    })
  });
};

// Sell equipment
export const sellEquipment = async (inventoryId) => {
  return apiCall('/equipment/sell', {
    method: 'POST',
    body: JSON.stringify({
      inventory_id: inventoryId
    })
  });
};

// Equip item to slot
export const equipItem = async (slot, itemId) => {
  return apiCall(`/equipment/slot/${slot}`, {
    method: 'POST',
    body: JSON.stringify({
      item_id: itemId
    })
  });
};

// Unequip item from slot
export const unequipItem = async (slot) => {
  return apiCall(`/equipment/slot/${slot}`, {
    method: 'POST',
    body: JSON.stringify({
      item_id: null
    })
  });
};