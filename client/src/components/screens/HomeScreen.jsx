import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPlayerInfo, getPlayerStats, getEquipmentInventory } from '../../api/equipment';

function HomeScreen() {
  const [playerData, setPlayerData] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerData();
  }, []);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      const [player, stats, equip] = await Promise.all([
        getPlayerInfo(),
        getPlayerStats(),
        getEquipmentInventory()
      ]);

      setPlayerData(player);
      setPlayerStats(stats);
      setEquipment(equip);
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

  const playerName = playerData?.display_name || 'Player';

  return (
    <div className="home-screen">
      <div className="box-header">My Home</div>
      
      <div className="welcome-message">
        <p>Welcome <strong>{playerName}</strong> this is your home, where you can check your stats and customize your character.</p>
      </div>

      <div className="home-layout">
        <div className="home-left-column">
          <h3><u>Stats</u></h3>
          <div className="stat-row">
            <span>ID :</span> <span>{playerData?.id || 8168}</span>
          </div>
          <div className="stat-row">
            <span>Level :</span> <span>{playerStats?.level || 1}</span>
          </div>
          <div className="stat-row">
            <span>Strength :</span> <span>{playerStats?.strength?.toFixed(3) || '1.000'}</span>
          </div>
          <div className="stat-row">
            <span>Speed :</span> <span>{playerStats?.speed?.toFixed(3) || '1.000'}</span>
          </div>
          <div className="stat-row">
            <span>Intelligence :</span> <span>{playerStats?.intelligence?.toFixed(3) || '0.000'}</span>
          </div>
          <div className="stat-row">
            <span>Magic Points :</span> <span>{playerStats?.magic_points || 2}/{playerStats?.max_magic_points || 2}</span>
          </div>
          <div className="stat-row">
            <span>Experience :</span> <span>{playerStats?.experience || 0}/{playerStats?.experience_needed || 350}</span>
          </div>
          <div className="stat-row">
            <span>HP :</span> <span>{playerStats?.hp || 10}/{playerStats?.max_hp || 10}</span>
          </div>
          <div className="stat-row">
            <span>Arena :</span> <span>1</span>
          </div>
          <div className="stat-row">
            <span>Mana :</span> <span>{playerStats?.mana || 50}/{playerStats?.max_mana || 50}</span>
          </div>

          <div className="stat-row">
            <span>Encumbrance :</span> <span>0/1</span>
          </div>

          <div className="stat-row">
            <span>Gold :</span> <span>{playerData?.gold || 2900}</span>
          </div>
          <div className="stat-row">
            <span>Metals :</span> <span>{playerStats?.metals || 0}</span>
          </div>
          <div className="stat-row">
            <span>Gems :</span> <span>{playerStats?.gems || 10}</span>
          </div>
          <div className="stat-row">
            <span>Quarzes :</span> <span>0</span>
          </div>

          <div className="stat-row">
            <span>Age :</span> <span>1</span>
          </div>
          <div className="stat-row">
            <span>Visits :</span> <span>6</span>
          </div>
          <div className="stat-row">
            <span>Last Killed :</span> <span></span>
          </div>
          <div className="stat-row">
            <span>Last Killed by :</span> <span></span>
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
            <span>Lower body :</span> <span></span>
          </div>
          <div className="stat-row">
            <span>Upper body :</span> <span></span>
          </div>
          <div className="stat-row">
            <span>Head :</span> <span></span>
          </div>
          <div className="stat-row">
            <span>Hands :</span> <span></span>
          </div>
          <div className="stat-row">
            <span>Feet :</span> <span></span>
          </div>
          <div className="stat-row">
            <span>Weapon :</span> <span></span>
          </div>

          <h3><u>Fighting</u></h3>
          <div className="stat-row">
            <span>vs Humans :</span> <span>0/0 - 0 %</span>
          </div>
          <div className="stat-row">
            <span>vs Creatures :</span> <span>0/0 - 0 %</span>
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