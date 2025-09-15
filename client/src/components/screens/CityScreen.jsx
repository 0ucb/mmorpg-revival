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
            <a href="#" className="city-link disabled">Armourer</a>
            <a href="#" className="city-link disabled">Gambler</a>
            <a href="#" className="city-link disabled">Town gems store</a>
            <a href="#" className="city-link disabled">Food shop</a>
            <a href="#" className="city-link disabled">Market</a>
            <a href="#" className="city-link disabled">Alchemy Shop</a>
            <a href="#" className="city-link disabled">Spell Shop</a>
          </div>

          <h3>Fun Zone</h3>
          <div className="city-links">
          </div>

          <h3>In the woods</h3>
          <div className="city-links">
            <a href="#" className="city-link disabled">Tall tree of Mana</a>
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