import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { fightMonster } from '../../api/game';
import { useAuth } from '../../contexts/AuthContext';

function CombatScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshPlayer } = useAuth();
  const { monster } = location.state || {};
  
  const [combatResult, setCombatResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!monster) {
      navigate('/beach');
      return;
    }
    
    initiateCombat();
  }, [monster, navigate]);

  const initiateCombat = async () => {
    try {
      setLoading(true);
      const result = await fightMonster(monster.id);
      console.log('Combat result:', result);
      setCombatResult(result);
      
      // Refresh player data in sidebar after combat
      await refreshPlayer();
    } catch (err) {
      console.error('Combat error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!monster) {
    return null;
  }

  if (loading) {
    return (
      <div className="combat-screen">
        <div className="box-header">Combat in Progress</div>
        <div className="combat-loading">
          <p>Engaging {monster.name} in combat...</p>
          <div className="combat-spinner">⚔️</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="combat-screen">
        <div className="box-header">Combat Error</div>
        <div className="combat-error">
          <p>Error during combat: {error}</p>
          <Link to="/beach" className="marcoland-button">Return to Beach</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="combat-screen">
      <div className="sidebar-header">Combat Results</div>
      
      <div className="combat-log">
        {combatResult.combat_result?.combat_log && combatResult.combat_result.combat_log.map((logEntry, index) => {
          const isKillMessage = logEntry.toLowerCase().includes('killed');
          const isGemMessage = logEntry.toLowerCase().includes('gem');
          return (
            <div key={index} className={`log-entry ${isKillMessage ? 'kill-message' : ''} ${isGemMessage ? 'gem-message' : ''}`}>
              {isGemMessage ? (
                <>
                  You found <span className="cyan">{logEntry.match(/\d+/)?.[0] || '1'}</span> gem searching the {monster.name}'s body
                </>
              ) : (
                logEntry
              )}
            </div>
          );
        })}
      </div>

      <div className="combat-actions">
        <button 
          className="action-button"
          onClick={() => {
            navigate('/combat', { 
              state: { monster },
              replace: true
            });
          }}
        >
          [ Fight again ]
        </button>
        <button className="action-button disabled">
          [ Heal yourself ]
        </button>
      </div>
    </div>
  );
}

export default CombatScreen;