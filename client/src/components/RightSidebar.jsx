import React, { useState, useEffect } from 'react';

function RightSidebar() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <>
      {/* Game Info Box */}
      <div className="game-box">
        <div className="box-header">Game Info</div>
        <div className="game-info-content">
          <div>Next mana restore at: 00:00:00</div>
          <div>Current time: {formatTime(currentTime)}</div>
          <div>Original creator:</div>
          <div style={{ textAlign: 'right' }}>Repsah</div>
        </div>
      </div>

      {/* Vote/Advertisement Box */}
      <div className="game-box">
        <div className="vote-section-content">
          <div style={{ backgroundColor: '#008000', padding: '5px', textAlign: 'center' }}>
            Vote for Marcoland and <span style={{ textDecoration: 'underline' }}>earn money.</span>
          </div>
          <div>MPOG Top 200</div>
          <div style={{ 
            marginTop: '5px', 
            padding: '5px', 
            border: '1px solid #33FF99',
            backgroundColor: '#001100',
            fontSize: '8px',
            textAlign: 'center'
          }}>
            [MPOG TOP 200 Logo placeholder]
          </div>
        </div>
      </div>

      {/* User Links Box */}
      <div className="game-box">
        <div className="box-header">User Links</div>
        <div className="user-links-content">
          There are no links for this user
        </div>
      </div>
    </>
  );
}

export default RightSidebar;