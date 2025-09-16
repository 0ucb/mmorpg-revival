import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function HomeScreen() {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerData();
  }, []);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/players/me/complete-stats', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load player data');
      }

      const data = await response.json();
      setPlayerData(data);
    } catch (error) {
      console.error('Error loading player data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-content">
        <h2>Loading your character data...</h2>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="loading-content">
        <h2>Failed to load character data</h2>
      </div>
    );
  }

  const calculateAge = () => {
    if (!playerData.created_at) return 0;
    const created = new Date(playerData.created_at);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatEquipmentName = (name) => {
    return name || '';
  };

  return (
    <div className="home-screen">
      <div className="box-header">My Home</div>
      
      <div className="welcome-message">
        <p>Welcome <strong>{playerData.display_name || playerData.username}</strong> this is your home, where you can check your stats and customize your character.</p>
      </div>

      <div className="home-layout">
        <div className="home-left-column">
          <h3><u>Stats</u></h3>
          <div className="stat-row">
            <span>ID :</span> <span>{playerData.id ? playerData.id.substring(0, 8) : ''}</span>
          </div>
          <div className="stat-row">
            <span>Level :</span> <span>{playerData.level}</span>
          </div>
          <div className="stat-row">
            <span>Strength :</span> <span>{playerData.strength?.toFixed(3)}</span>
          </div>
          <div className="stat-row">
            <span>Speed :</span> <span>{playerData.speed?.toFixed(3)}</span>
          </div>
          <div className="stat-row">
            <span>Intelligence :</span> <span>{playerData.intelligence?.toFixed(3)}</span>
          </div>
          <div className="stat-row">
            <span>Magic Points :</span> <span>{playerData.magic_points}/{playerData.max_magic_points}</span>
          </div>
          <div className="stat-row">
            <span>Experience :</span> <span>{playerData.experience}/{playerData.experience_needed}</span>
          </div>
          <div className="stat-row">
            <span>HP :</span> <span>{playerData.health}/{playerData.max_health}</span>
          </div>
          <div className="stat-row">
            <span>Arena :</span> <span>1</span>
          </div>
          <div className="stat-row">
            <span>Mana :</span> <span>{playerData.mana}/{playerData.max_mana}</span>
          </div>

          <div className="stat-row">
            <span>Encumbrance :</span> <span>{playerData.total_encumbrance}/{Math.floor(playerData.speed)}</span>
          </div>

          <div className="stat-row">
            <span>Gold :</span> <span>{playerData.gold}</span>
          </div>
          <div className="stat-row">
            <span>Metals :</span> <span>{playerData.metals}</span>
          </div>
          <div className="stat-row">
            <span>Gems :</span> <span>{playerData.gems}</span>
          </div>
          <div className="stat-row">
            <span>Quarzes :</span> <span>{playerData.quartz}</span>
          </div>

          <div className="stat-row">
            <span>Age :</span> <span>{calculateAge()}</span>
          </div>
          <div className="stat-row">
            <span>Visits :</span> <span>-</span>
          </div>
          <div className="stat-row">
            <span>Last Killed :</span> <span>-</span>
          </div>
          <div className="stat-row">
            <span>Last Killed by :</span> <span>-</span>
          </div>

          <div className="stat-row">
            <span>Total Forum Posts:</span> <span>0</span>
          </div>
          <div className="stat-row">
            <span>Posts Today:</span> <span>0</span>
          </div>
          <div className="stat-row">
            <span>Max Daily Posts:</span> <span>2</span>
          </div>

          <div className="city-clan-link">
            <Link to="/city" className="underlined-link">City-Clan</Link>
          </div>
        </div>

        <div className="home-right-column">
          <h3><u>Equipped</u></h3>
          <div className="stat-row">
            <span>Lower body :</span> <span>{formatEquipmentName(playerData.equipped?.legs)}</span>
          </div>
          <div className="stat-row">
            <span>Upper body :</span> <span>{formatEquipmentName(playerData.equipped?.body)}</span>
          </div>
          <div className="stat-row">
            <span>Head :</span> <span>{formatEquipmentName(playerData.equipped?.head)}</span>
          </div>
          <div className="stat-row">
            <span>Hands :</span> <span>{formatEquipmentName(playerData.equipped?.hands)}</span>
          </div>
          <div className="stat-row">
            <span>Feet :</span> <span>{formatEquipmentName(playerData.equipped?.feet)}</span>
          </div>
          <div className="stat-row">
            <span>Weapon :</span> <span>{formatEquipmentName(playerData.equipped?.weapon)}</span>
          </div>

          <h3><u>Fighting</u></h3>
          <div className="stat-row">
            <span>vs Humans :</span> <span>{playerData.pvp_stats?.wins}/{playerData.pvp_stats?.losses} - {playerData.pvp_stats?.win_percentage} %</span>
          </div>

          <div className="my-equipment-link">
            <Link to="/equipment" className="green-underlined-link">My equipment</Link>
          </div>

          <h3><u>My links</u></h3>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;