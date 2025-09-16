import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function PvPScreen() {
    const { player, refreshPlayer } = useAuth();
    const [targets, setTargets] = useState([]);
    const [pvpStatus, setPvpStatus] = useState({ pvp_mana: 0, stats: {} });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attacking, setAttacking] = useState(null);
    const [lastCombatResult, setLastCombatResult] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('targets');

    useEffect(() => {
        loadPvPData();
    }, []);

    const loadTargets = async () => {
        try {
            const response = await fetch('/api/pvp/targets', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok) {
                setTargets(data.targets || []);
                setPvpStatus(prev => ({
                    ...prev,
                    pvp_mana: data.pvp_mana,
                    pvp_mana_display: data.pvp_mana_display,
                    can_attack: data.can_attack
                }));
            } else {
                throw new Error(data.error || 'Failed to load targets');
            }
        } catch (error) {
            console.error('Error loading targets:', error);
            throw error;
        }
    };

    const loadStatus = async () => {
        try {
            const response = await fetch('/api/pvp/status', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok) {
                setPvpStatus(prev => ({
                    ...prev,
                    ...data
                }));
            }
        } catch (error) {
            console.error('Error loading PvP status:', error);
        }
    };

    const loadHistory = async () => {
        try {
            const response = await fetch('/api/pvp/history', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok) {
                setHistory(data.battles || []);
            }
        } catch (error) {
            console.error('Error loading PvP history:', error);
        }
    };

    const loadPvPData = async () => {
        try {
            setLoading(true);
            setError(null);
            await Promise.all([
                loadTargets(),
                loadStatus(),
                loadHistory()
            ]);
        } catch (error) {
            console.error('Error loading PvP data:', error);
            setError('Failed to load PvP data');
        } finally {
            setLoading(false);
        }
    };

    const handleAttack = async (username) => {
        if (attacking) return;
        
        try {
            setAttacking(username);
            setError(null);
            
            const response = await fetch(`/api/pvp/attack/${username}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok) {
                setLastCombatResult({
                    ...data.combat_result,
                    target: username,
                    pvp_mana_remaining: data.pvp_mana_remaining
                });
                
                await loadPvPData();
                await refreshPlayer();
                setActiveTab('status');
            } else {
                setError(data.error || 'Attack failed');
            }
        } catch (error) {
            console.error('Error attacking player:', error);
            setError('Failed to attack player');
        } finally {
            setAttacking(null);
        }
    };

    const formatTimeRemaining = (milliseconds) => {
        if (!milliseconds || milliseconds <= 0) return null;
        
        const minutes = Math.ceil(milliseconds / (60 * 1000));
        if (minutes < 60) {
            return `${minutes} minutes`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="pvp-screen">
                <div className="sidebar-header">Arena (PvP)</div>
                <div className="loading-content">Loading...</div>
            </div>
        );
    }

    return (
        <div className="pvp-screen">
            <div className="sidebar-header">Arena (PvP)</div>
            
            {/* PvP Mana Display */}
            <div className="pvp-mana-status">
                <strong>PvP Mana: {pvpStatus.pvp_mana_display || '0/5'}</strong>
                {!pvpStatus.can_attack && (
                    <span className="mana-warning"> (Need 1 mana to attack)</span>
                )}
            </div>
            
            {/* Protection Status */}
            {pvpStatus.protection_time_remaining > 0 && (
                <div className="protection-status">
                    <strong>Protected for: {formatTimeRemaining(pvpStatus.protection_time_remaining)}</strong>
                </div>
            )}
            
            {/* Tab Navigation */}
            <div className="pvp-tabs">
                <button 
                    className={`tab-button ${activeTab === 'targets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('targets')}
                >
                    Targets
                </button>
                <button 
                    className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    History
                </button>
                <button 
                    className={`tab-button ${activeTab === 'status' ? 'active' : ''}`}
                    onClick={() => setActiveTab('status')}
                >
                    Status
                </button>
            </div>
            
            {/* Error Display */}
            {error && (
                <div className="error-message">
                    Error: {error}
                </div>
            )}
            
            {/* Tab Content */}
            {activeTab === 'targets' && (
                <div className="targets-tab">
                    {targets.length === 0 ? (
                        <div className="no-targets">No valid targets found in your level range.</div>
                    ) : (
                        <div className="targets-list">
                            <div className="targets-header">
                                <span>Player</span>
                                <span>Level</span>
                                <span>Health</span>
                                <span>Action</span>
                            </div>
                            {targets.map(target => (
                                <div key={target.id} className="target-row">
                                    <span className="target-name">{target.username}</span>
                                    <span className="target-level">Level {target.level}</span>
                                    <span className="target-health">
                                        {target.health}/{target.max_health} ({target.health_percentage}%)
                                    </span>
                                    <span className="target-action">
                                        {pvpStatus.can_attack ? (
                                            <button 
                                                className="attack-link"
                                                onClick={() => handleAttack(target.username)}
                                                disabled={attacking === target.username}
                                            >
                                                {attacking === target.username ? 'Attacking...' : '[attack]'}
                                            </button>
                                        ) : (
                                            <span className="disabled-action">Need mana</span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'history' && (
                <div className="history-tab">
                    {history.length === 0 ? (
                        <div className="no-history">No battle history yet.</div>
                    ) : (
                        <div className="history-list">
                            {history.map(battle => (
                                <div key={battle.id} className="battle-record">
                                    <div className="battle-summary">
                                        <strong>
                                            {battle.was_attacker ? 'You attacked' : 'You were attacked by'} {battle.opponent}
                                        </strong>
                                        <span className="battle-date">{formatDate(battle.date)}</span>
                                    </div>
                                    <div className="battle-details">
                                        Damage: {battle.damage} | 
                                        {battle.was_kill ? ' KILL' : ' Survived'} |
                                        INT Mod: {battle.intelligence_modifier}x
                                        {battle.resources_stolen.gold > 0 && (
                                            <span className="resources-stolen">
                                                | Stole: {battle.resources_stolen.gold}g 
                                                {battle.resources_stolen.gems > 0 && ` ${battle.resources_stolen.gems} gems`}
                                                {battle.resources_stolen.metals > 0 && ` ${battle.resources_stolen.metals} metals`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'status' && (
                <div className="status-tab">
                    {lastCombatResult && (
                        <div className="combat-result">
                            <h3>Last Combat Result</h3>
                            <div className="combat-details">
                                <p>You attacked <strong>{lastCombatResult.target}</strong></p>
                                <p>Damage dealt: <strong>{lastCombatResult.damage}</strong></p>
                                <p>Intelligence modifier: <strong>{lastCombatResult.intelligence_modifier}x</strong></p>
                                <p>Result: <strong>{lastCombatResult.is_kill ? 'KILL' : 'Survived'}</strong></p>
                                {lastCombatResult.is_kill && lastCombatResult.resources_stolen && (
                                    <div className="resources-gained">
                                        <p>Resources stolen:</p>
                                        <ul>
                                            <li>Gold: {lastCombatResult.resources_stolen.gold}</li>
                                            <li>Gems: {lastCombatResult.resources_stolen.gems}</li>
                                            <li>Metals: {lastCombatResult.resources_stolen.metals}</li>
                                        </ul>
                                    </div>
                                )}
                                <p>PvP Mana remaining: <strong>{lastCombatResult.pvp_mana_remaining}/5</strong></p>
                            </div>
                        </div>
                    )}
                    
                    <div className="pvp-stats">
                        <h3>PvP Statistics</h3>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">Kills:</span>
                                <span className="stat-value">{pvpStatus.stats?.kills || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Deaths:</span>
                                <span className="stat-value">{pvpStatus.stats?.deaths || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">K/D Ratio:</span>
                                <span className="stat-value">{pvpStatus.stats?.kd_ratio || '0'}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Damage Dealt:</span>
                                <span className="stat-value">{pvpStatus.stats?.damage_dealt || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Damage Taken:</span>
                                <span className="stat-value">{pvpStatus.stats?.damage_taken || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PvPScreen;