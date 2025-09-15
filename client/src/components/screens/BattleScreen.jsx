import React from 'react';
import { Link } from 'react-router-dom';

function BattleScreen() {
  return (
    <div className="battle-screen">
      <div className="sidebar-header">Fighting</div>
      
      <div className="battle-links">
        <Link to="/beach" className="battle-link">Training beach</Link>
        <a href="#" className="battle-link disabled">Search an opponent</a>
        <a href="#" className="battle-link disabled">Battle a player</a>
        <a href="#" className="battle-link disabled">Explore the dungeon</a>
        <a href="#" className="battle-link disabled">Fight in the Arena</a>
      </div>
    </div>
  );
}

export default BattleScreen;