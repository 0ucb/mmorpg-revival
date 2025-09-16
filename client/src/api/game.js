const API_BASE = '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      console.warn('Authentication required - redirecting to login');
      window.location.reload();
      return null;
    }
    
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
    } catch {
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

const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
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

export const getBeachMonsters = async () => {
  const response = await apiCall('/beach/monsters');
  return response.monsters || [];
};

export const fightMonster = async (monsterId) => {
  return apiCall('/beach/fight', {
    method: 'POST',
    body: JSON.stringify({
      monsterId: monsterId,
      manaToSpend: 1
    })
  });
};

export const prayAtTemple = async (stat, manaCost = 5) => {
  // Convert manaCost to the expected string format
  let manaAmount;
  if (typeof manaCost === 'string') {
    manaAmount = manaCost; // Already "all"
  } else {
    manaAmount = manaCost.toString(); // Convert 5, 50 to "5", "50"
  }
  
  return apiCall('/temple/pray', {
    method: 'POST',
    body: JSON.stringify({
      stat: stat,
      manaAmount: manaAmount
    })
  });
};