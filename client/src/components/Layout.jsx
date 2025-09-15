import React from 'react';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';

function Layout({ children }) {
  return (
    <div className="app-container">
      <div className="game-box left-sidebar">
        <Sidebar />
      </div>
      <div className="game-box main-content">
        {children}
      </div>
      <div className="right-sidebar">
        <RightSidebar />
      </div>
    </div>
  );
}

export default Layout;