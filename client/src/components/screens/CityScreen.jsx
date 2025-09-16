import React from 'react';
import { Link } from 'react-router-dom';

function CityScreen() {
  return (
    <div className="city-screen">
      <div className="sidebar-header">The city</div>
      
      <div className="city-sections">
        <div className="city-column">
          <h3>In the streets</h3>
          <div className="city-links">
            <Link to="/blacksmith" className="city-link">Blacksmith</Link>
            <Link to="/armourer" className="city-link">Armourer</Link>
            <a href="#" className="city-link disabled">Gambler</a>
            <Link to="/gems-store" className="city-link">Town gems store</Link>
            <a href="#" className="city-link disabled">Food shop</a>
            <Link to="/market" className="city-link">Market</Link>
            <a href="#" className="city-link disabled">Alchemy Shop</a>
            <a href="#" className="city-link disabled">Spell Shop</a>
          </div>

          <h3>Fun Zone</h3>
          <div className="city-links">
            <Link to="/vote" className="city-link">Daily Vote</Link>
          </div>

          <h3>In the woods</h3>
          <div className="city-links">
            <Link to="/mana-tree" className="city-link">Tall tree of Mana</Link>
            <a href="#" className="city-link disabled">Monk's Alley</a>
            <a href="#" className="city-link disabled">Reviving fruits</a>
            <a href="#" className="city-link disabled">Enchantress</a>
          </div>
        </div>

        <div className="city-column">
          <h3>On the town hill</h3>
          <div className="city-links">
            <a href="#" className="city-link disabled">Council building</a>
            <Link to="/temple" className="city-link">Temple of Tiipsi</Link>
            <a href="#" className="city-link disabled">Other Towns</a>
            <a href="#" className="city-link disabled">Jail</a>
            <a href="#" className="city-link disabled">Message board</a>
          </div>

          <h3>The underground</h3>
          <div className="city-links">
            <a href="#" className="city-link disabled">Dungeon</a>
            <a href="#" className="city-link disabled">Rich sands</a>
            <a href="#" className="city-link disabled">Daily Arena</a>
            <a href="#" className="city-link disabled">Creatures black market</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CityScreen;