import React, { useState, useEffect } from 'react';
import { getPlayerInfo, getPlayerStats } from '../api/equipment';
import { useAuth } from '../contexts/AuthContext';

function Sidebar() {
  const [playerData, setPlayerData] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { signOut, user, player } = useAuth();

  useEffect(() => {
    loadPlayerData();
  }, []);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load player basic info and stats
      const [player, stats] = await Promise.all([
        getPlayerInfo(),
        getPlayerStats()
      ]);

      setPlayerData(player);
      setPlayerStats(stats);
    } catch (err) {
      console.error('Error loading player data:', err);
      setError(err.message);
      // Set fallback dummy data for demo
      setPlayerData({
        id: 8168,
        display_name: 'dummy',
        gold: 2900
      });
      setPlayerStats({
        strength: 1.000,
        speed: 1.000,
        intelligence: 0.000,
        magic_points: 2,
        max_magic_points: 2,
        level: 1,
        experience: 0,
        experience_needed: 350,
        hp: 10,
        max_hp: 10,
        mana: 50,
        max_mana: 50,
        metals: 0,
        gems: 10
      });
    } finally {
      setLoading(false);
    }
  };

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
        <div className="stat-line">Magic Points : {playerStats?.magic_points || 2}/{playerStats?.max_magic_points || 2}</div>
        <div className="stat-line">Level : {playerStats?.level || 1}</div>
        <div className="stat-line">Experience : {playerStats?.experience || 0}/{playerStats?.experience_needed || 350}</div>
        <div className="stat-line">HP : {playerStats?.hp || 10}/{playerStats?.max_hp || 10}</div>
        <div className="stat-line">Mana : {playerStats?.mana || 50}/{playerStats?.max_mana || 50}</div>
        <div className="stat-line">Gold : {playerData?.gold || 2900}</div>
        <div className="stat-line">Metals : {playerStats?.metals || 0}</div>
        <div className="stat-line">Gems : {playerStats?.gems || 10}</div>
      </div>

      {/* Navigation Menu */}
      <div className="nav-menu">
        <a href="#" className="nav-item">My Home</a>
        <a href="#" className="nav-item">The city</a>
        <a href="#" className="nav-item">Fighting</a>
        <a href="#" className="nav-item">Daily Arena</a>
        <a href="#" className="nav-item">Forum boards</a>
        <a href="#" className="nav-item">Chat room(3)</a>
        <a href="#" className="nav-item">Send mail</a>
        <a href="#" className="nav-item">Buddy list</a>
        <a href="#" className="nav-item">Blacklist</a>
        <a href="#" className="nav-item">Player search</a>
        <a href="#" className="nav-item">New messages(0)</a>
        <a href="#" className="nav-item">Spells</a>
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