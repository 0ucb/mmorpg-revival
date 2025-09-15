import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBeachMonsters } from '../../api/game';

function BeachScreen() {
  const navigate = useNavigate();
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonsters();
  }, []);

  const loadMonsters = async () => {
    try {
      setLoading(true);
      const monsterData = await getBeachMonsters();
      setMonsters(monsterData);
    } catch (error) {
      console.error('Error loading monsters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFight = (monster) => {
    navigate('/combat', { 
      state: { monster } 
    });
  };

  if (loading) {
    return (
      <div className="loading-content">
        <h2>Loading monsters...</h2>
      </div>
    );
  }

  return (
    <div className="beach-screen">
      <div className="sidebar-header">Training beach</div>
      
      <div className="monsters-table">
        <div className="table-header">
          <span>Creature name</span>
          <span>Level</span>
          <span>HP</span>
        </div>
        {monsters && monsters.map ? monsters.map(monster => (
          <div key={monster.id} className="monster-row">
            <span 
              className="monster-name clickable"
              onClick={() => handleFight(monster)}
            >
              {monster.name}
            </span>
            <span className="monster-level">Level {monster.level}</span>
            <span className="monster-hp">{monster.health} HP</span>
          </div>
        )) : null}
      </div>
    </div>
  );
}

export default BeachScreen;