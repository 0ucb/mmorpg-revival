// PvP API utility functions
// Follows established patterns from auth.js and game.js

const API_BASE = '/api/pvp';

// Generic API call wrapper with credentials
async function pvpApiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return { data, error: null };
    } catch (error) {
        console.error(`PvP API Error (${method} ${endpoint}):`, error);
        return { data: null, error: error.message };
    }
}

// Get available PvP targets
export async function getPvPTargets() {
    return pvpApiCall('/targets');
}

// Get current PvP status (mana, protection, stats)
export async function getPvPStatus() {
    return pvpApiCall('/status');
}

// Get PvP battle history
export async function getPvPHistory(limit = 50) {
    const endpoint = `/history${limit ? `?limit=${limit}` : ''}`;
    return pvpApiCall(endpoint);
}

// Attack a player by username
export async function attackPlayer(username) {
    if (!username || typeof username !== 'string') {
        return { data: null, error: 'Invalid username provided' };
    }
    
    return pvpApiCall(`/attack/${encodeURIComponent(username)}`, 'POST');
}

// Utility function to refresh all PvP data
export async function refreshPvPData() {
    const [targetsResult, statusResult, historyResult] = await Promise.all([
        getPvPTargets(),
        getPvPStatus(),
        getPvPHistory()
    ]);
    
    return {
        targets: targetsResult.data?.targets || [],
        status: statusResult.data || {},
        history: historyResult.data?.battles || [],
        errors: [
            targetsResult.error,
            statusResult.error,
            historyResult.error
        ].filter(Boolean)
    };
}

// Format time remaining for display
export function formatProtectionTime(milliseconds) {
    if (!milliseconds || milliseconds <= 0) return null;
    
    const totalMinutes = Math.ceil(milliseconds / (60 * 1000));
    if (totalMinutes < 60) {
        return `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) {
        return `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    
    return `${hours}h ${minutes}m`;
}

// Format PvP mana display
export function formatPvPMana(currentMana, maxMana = 5) {
    return `${currentMana}/${maxMana}`;
}

// Check if player can attack (has mana and not protected)
export function canPerformAttack(pvpStatus) {
    return {
        hasEnoughMana: (pvpStatus.pvp_mana || 0) >= 1,
        isProtected: (pvpStatus.protection_time_remaining || 0) > 0,
        canAttack: (pvpStatus.pvp_mana || 0) >= 1 && (pvpStatus.protection_time_remaining || 0) === 0
    };
}

// Calculate K/D ratio display
export function formatKDRatio(kills, deaths) {
    if (!deaths || deaths === 0) {
        return kills ? kills.toString() : '0';
    }
    return (kills / deaths).toFixed(2);
}

// Validate target selection
export function validateAttackTarget(target, attackerLevel) {
    if (!target) return { valid: false, reason: 'No target selected' };
    if (!target.username) return { valid: false, reason: 'Invalid target data' };
    
    // Level range check (±25%)
    const levelDiff = Math.abs(attackerLevel - target.level);
    const maxLevelDiff = Math.ceil(attackerLevel * 0.25);
    
    if (levelDiff > maxLevelDiff) {
        return { 
            valid: false, 
            reason: `Target level (${target.level}) outside valid range (${attackerLevel - maxLevelDiff}-${attackerLevel + maxLevelDiff})` 
        };
    }
    
    // Health check
    if (target.health <= 0) {
        return { valid: false, reason: 'Target is dead' };
    }
    
    return { valid: true, reason: null };
}

// Error message mapping for better UX
export function getErrorDisplayMessage(error) {
    const errorMappings = {
        'Insufficient PvP mana': 'You need PvP mana to attack. Wait for it to regenerate (1 per hour).',
        'Target is protected': 'This player is currently protected and cannot be attacked.',
        'Cannot attack this target': 'This target is outside your level range or otherwise invalid.',
        'Target player not found': 'Player not found. They may have been deleted or changed their username.',
        'You cannot attack yourself': 'You cannot attack your own character.',
        'You must be alive to attack other players': 'You must heal before you can attack other players.',
        'Too many attacks': 'You are attacking too frequently. Please wait a moment before trying again.'
    };
    
    // Check for exact matches first
    if (errorMappings[error]) {
        return errorMappings[error];
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(errorMappings)) {
        if (error.includes(key.toLowerCase()) || error.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    
    // Fallback to original error message
    return error || 'An unexpected error occurred. Please try again.';
}