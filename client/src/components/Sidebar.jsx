import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPlayerInfo, getPlayerStats } from '../api/equipment';
import { useAuth } from '../contexts/AuthContext';

function Sidebar() {
  const [playerData, setPlayerData] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { signOut, user, player, refreshTrigger } = useAuth();

  // Calculate experience needed for next level (matches backend formula)
  const calculateExperienceNeeded = (level) => {
    return 150 * level * level + 200;
  };

  useEffect(() => {
    loadPlayerData();
  }, []);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load player basic info and stats
      const [playerInfo, stats] = await Promise.all([
        getPlayerInfo(),
        getPlayerStats()
      ]);

      setPlayerData(playerInfo);
      setPlayerStats(stats);
    } catch (err) {
      console.error('Error loading player data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Listen for refresh triggers and reload data
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadPlayerData();
    }
  }, [refreshTrigger]);

  if (loading) {
    return (
      <>
        <div className="sidebar-header">Links and Stats</div>
        <div className="loading">Loading player data...</div>
      </>
    );
  }

  return (
    <>
      <div className="sidebar-header">Links and Stats</div>
      
      {/* Player Info Section */}
      <div className="player-stats">
        <div className="player-name">
          {player?.display_name || playerData?.display_name || user?.email?.split('@')[0] || 'dummy'} <span className="verified-icon">✓</span>
        </div>
        
        <div className="stat-line">ID : {player?.id || playerData?.id || 8168}</div>
        <div className="stat-line">Strength : {playerStats?.strength?.toFixed(3) || '1.000'}</div>
        <div className="stat-line">Speed : {playerStats?.speed?.toFixed(3) || '1.000'}</div>
        <div className="stat-line">Intelligence : {playerStats?.intelligence?.toFixed(3) || '0.000'}</div>
        <div className="stat-line">Magic Points : {playerData?.magic_points || 2}/{playerData?.max_magic_points || 2}</div>
        <div className="stat-line">Level : {playerData?.level || 1}</div>
        <div className="stat-line">Experience : {playerData?.experience || 0}/{calculateExperienceNeeded(playerData?.level || 1)}</div>
        <div className="stat-line">HP : {playerData?.health || 10}/{playerData?.max_health || 10}</div>
        <div className="stat-line">Mana : {playerData?.mana || 50}/{playerData?.max_mana || 50}</div>
        <div className="stat-line">Gold : {playerData?.gold || 2900}</div>
        <div className="stat-line">Metals : {playerData?.metals || 0}</div>
        <div className="stat-line">Gems : {playerData?.gems || 10}</div>
      </div>

      {/* Navigation Menu */}
      <div className="nav-menu">
        <Link to="/" className="nav-item">My Home</Link>
        <Link to="/city" className="nav-item">The city</Link>
        <Link to="/battle" className="nav-item">Fighting</Link>
        <Link to="/temple" className="nav-item">Temple</Link>
        <a href="#" className="nav-item disabled">Daily Arena</a>
        <a href="#" className="nav-item disabled">Forum boards</a>
        <a href="#" className="nav-item disabled">Chat room(3)</a>
        <a href="#" className="nav-item disabled">Send mail</a>
        <a href="#" className="nav-item disabled">Buddy list</a>
        <a href="#" className="nav-item disabled">Blacklist</a>
        <a href="#" className="nav-item disabled">Player search</a>
        <a href="#" className="nav-item disabled">New messages(0)</a>
        <a href="#" className="nav-item disabled">Spells</a>
        <button 
          className="nav-item logout-button"
          onClick={signOut}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
        >
          Logout
        </button>
      </div>

      {/* Server Stats */}
      <div className="server-stats">
        <div>- Online: 17 player(s).</div>
        <div>- Member Count: 31337</div>
      </div>

      {/* Help Links */}
      <div className="help-links">
        <a href="#">FAQ</a>
        <a href="#">Emoticons</a>
        <a href="#">Help</a>
        <a href="#">How to make money</a>
        <a href="#">Rules</a>
      </div>

      {error && (
        <div className="error">
          Failed to load real data. Using demo values.
        </div>
      )}
    </>
  );
}

export default Sidebar;