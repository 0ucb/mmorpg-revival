import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// API calls for voting
const getVoteStatus = async () => {
  const response = await fetch('/api/resources/vote', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};

const submitVote = async () => {
  const response = await fetch('/api/resources/vote', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
};

function VoteScreen() {
  const { refreshPlayer } = useAuth();
  const [voteStatus, setVoteStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    loadVoteStatus();
  }, []);

  const loadVoteStatus = async () => {
    try {
      setLoading(true);
      const data = await getVoteStatus();
      
      if (data.success) {
        setVoteStatus(data);
      }
    } catch (error) {
      console.error('Error loading vote status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    try {
      setVoting(true);
      const result = await submitVote();
      
      if (result.success) {
        const manaBonus = result.mana_reload ? ' + RARE MANA RELOAD!' : '';
        alert(`Voted successfully! Earned ${result.gold_awarded} gold${manaBonus}`);
        
        // Refresh player data and vote status
        await refreshPlayer();
        await loadVoteStatus();
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert(`Failed to vote: ${error.message}`);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-content">
        <h2>Loading voting interface...</h2>
      </div>
    );
  }

  return (
    <div className="vote-screen">
      <div className="sidebar-header">Daily Vote</div>
      
      <div className="vote-status">
        <p><strong>Your Gold:</strong> {voteStatus.player_gold}</p>
        {voteStatus.voted_today && (
          <p><strong>Today's Earnings:</strong> {voteStatus.gold_earned_today} gold</p>
        )}
      </div>

      <div className="vote-section">
        {voteStatus.can_vote ? (
          <div className="voting-available">
            <h2>VOTE HERE! DO IT</h2>
            <p>Vote daily to support MarcoLand and earn rewards!</p>
            
            <div className="vote-rewards">
              <h3>Guaranteed Rewards:</h3>
              <ul>
                <li>{voteStatus.gold_range} gold per vote</li>
                <li>{voteStatus.mana_reload_chance} chance for rare mana reload</li>
              </ul>
            </div>

            <button
              className="city-link vote-button"
              onClick={handleVote}
              disabled={voting}
              style={{ 
                fontSize: '1.2em', 
                padding: '10px 20px',
                margin: '10px 0'
              }}
            >
              {voting ? 'Voting...' : 'VOTE NOW'}
            </button>
          </div>
        ) : (
          <div className="already-voted">
            <h2>Already Voted Today</h2>
            <p>{voteStatus.message}</p>
            <p>Come back tomorrow for another vote!</p>
            
            <div className="daily-reset-info">
              <p>Voting resets at midnight server time.</p>
              <p>Don't forget to vote daily for consistent income!</p>
            </div>
          </div>
        )}
      </div>

      <div className="vote-info">
        <h3>About Daily Voting</h3>
        <ul>
          <li>One vote per day limit</li>
          <li>Guaranteed 500-1000 gold reward</li>
          <li>5% chance for complete mana restore</li>
          <li>Essential part of daily MarcoLand routine</li>
          <li>Free and easy way to earn gold</li>
          <li>Supports the server and community</li>
        </ul>
      </div>
    </div>
  );
}

export default VoteScreen;