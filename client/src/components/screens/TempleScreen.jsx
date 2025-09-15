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
      alert('Not enough mana for this prayer!');
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
          <p><strong>Result:</strong> {prayerResult.success ? 'The gods have blessed you!' : 'Prayer failed!'}</p>
          <p>{prayerResult.message}</p>
        </div>
      )}

      <div className="prayer-links">
        <button 
          className="prayer-link"
          onClick={() => handlePrayer('strength', 5)}
          disabled={praying || !playerStats || playerStats.mana < 5}
        >
          Pray for strength.
        </button>
        
        <button 
          className="prayer-link green"
          onClick={() => handlePrayer('speed', 5)}
          disabled={praying || !playerStats || playerStats.mana < 5}
        >
          Pray for speed.
        </button>
        
        <button 
          className="prayer-link"
          onClick={() => handlePrayer('intelligence', 5)}
          disabled={praying || !playerStats || playerStats.mana < 5}
        >
          Pray for intelligence.
        </button>
      </div>

      <div className="temple-actions">
        <button className="action-button">[ Back ]</button>
      </div>
    </div>
  );
}

export default TempleScreen;