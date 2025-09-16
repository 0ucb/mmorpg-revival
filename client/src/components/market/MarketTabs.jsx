import React from 'react';

export function MarketTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'browse', label: 'browse market' },
    { id: 'sell', label: 'sell items' },
    { id: 'my-listings', label: 'my listings' }
  ];

  return (
    <div style={{ margin: '15px 0' }}>
      {tabs.map((tab, index) => (
        <a
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{ 
            color: activeTab === tab.id ? '#ffff99' : '#33ff99',
            marginRight: index < tabs.length - 1 ? '20px' : '0',
            cursor: 'pointer'
          }}
        >
          [{tab.label}]
        </a>
      ))}
    </div>
  );
}