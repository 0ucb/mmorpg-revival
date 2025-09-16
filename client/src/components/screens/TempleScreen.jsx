import React, { useState, useEffect } from 'react';
import { prayAtTemple } from '../../api/game';
import { getPlayerStats } from '../../api/equipment';
import { useAuth } from '../../contexts/AuthContext';

function TempleScreen() {
  const { refreshPlayer } = useAuth();
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [praying, setPraying] = useState(false);
  const [prayerResult, setPrayerResult] = useState(null);

  useEffect(() => {
    loadPlayerStats();
  }, []);

  const loadPlayerStats = async () => {
    try {
      setLoading(true);
      const stats = await getPlayerStats();
      setPlayerStats(stats);
    } catch (error) {
      console.error('Error loading player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrayer = async (stat, manaCost) => {
    if (!playerStats || playerStats.mana < manaCost) {
      console.error('Not enough mana for this prayer!');
      return;
    }

    try {
      setPraying(true);
      setPrayerResult(null);
      
      const result = await prayAtTemple(stat, manaCost);
      setPrayerResult(result);
      
      await loadPlayerStats();
      // Refresh player data in sidebar after prayer
      await refreshPlayer();
    } catch (error) {
      console.error('Error praying:', error);
      setPrayerResult({
        success: false,
        message: error.message
      });
    } finally {
      setPraying(false);
    }
  };

  const getSuccessMessage = () => {
    if (!prayerResult?.stat_gains) {
      return 'The gods have blessed you!';
    }
    
    // Find which stat was increased
    const gains = prayerResult.stat_gains;
    const statName = gains.strength > 0 ? 'strength' : gains.speed > 0 ? 'speed' : 'intelligence';
    const gainAmount = gains[statName];
    
    return `The gods have blessed you! +${gainAmount} ${statName}`;
  };

  const renderPrayerOption = (stat, prayerText) => {
    const currentMana = playerStats?.mana || 0;
    const allMana = currentMana;
    
    return (
      <div key={stat} style={{ 
        margin: '8px 0', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px' 
      }}>
        <span style={{ 
          color: 'white', 
          minWidth: '200px' 
        }}>{prayerText}</span>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          {[5, 50].map(amount => (
            <a
              key={amount}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePrayer(stat, amount);
              }}
              className={`mana-link ${currentMana < amount || praying ? 'disabled' : ''}`}
              style={{
                color: '#33FF99',
                textDecoration: 'none',
                marginRight: '8px',
                cursor: currentMana >= amount && !praying ? 'pointer' : 'default',
                opacity: currentMana >= amount && !praying ? 1 : 0.5
              }}
            >
              [{amount}]
            </a>
          ))}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePrayer(stat, "all");
            }}
            className={`mana-link ${allMana <= 0 || praying ? 'disabled' : ''}`}
            style={{
              color: '#33FF99',
              textDecoration: 'none',
              cursor: allMana > 0 && !praying ? 'pointer' : 'default',
              opacity: allMana > 0 && !praying ? 1 : 0.5
            }}
          >
            [all]
          </a>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-content">
        <h2>Entering the sacred temple...</h2>
      </div>
    );
  }

  return (
    <div className="temple-screen">
      <div className="sidebar-header">Temple of Tiipsi</div>
      
      <div className="temple-lore">
        <p><span className="tiipsi-name">Tiipsi</span> is your God.</p>
        <br />
        <p><span className="tiipsi-name">Tiipsi</span> watches over you day and night, and you must please Him.</p>
        <p><span className="tiipsi-name">Tiipsi</span> rules the world of Marcoland, bad luck and good luck are His will.</p>
        <p>In this temple, just a small sign of His magnificence, you can try to please Him, fall on your knees and pray, He might reward your prayers.</p>
        <p>Since you must concentrate and you need to take your time, each prayer will cost you <strong>5 mana</strong>.</p>
      </div>

      {prayerResult && (
        <div className={`prayer-result ${prayerResult.success ? 'blessing' : 'failure'}`}>
          <p><strong>Result:</strong> {prayerResult.success ? getSuccessMessage() : 'Prayer failed!'}</p>
          <p>{prayerResult.message}</p>
        </div>
      )}

      <div className="prayer-links">
        {renderPrayerOption('strength', 'Pray for strength.')}
        {renderPrayerOption('speed', 'Pray for speed.')}
        {renderPrayerOption('intelligence', 'Pray for intelligence.')}
      </div>

      <div className="temple-actions">
        <button className="action-button">[ Back ]</button>
      </div>
    </div>
  );
}

export default TempleScreen;