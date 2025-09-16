import React from 'react';

export function MarketFilters({ currentFilter, onFilterChange }) {
  const filters = [
    { id: 'all', label: 'all' },
    { id: 'gems', label: 'gems' },
    { id: 'metals', label: 'metals' }
  ];

  return (
    <div style={{ margin: '10px 0' }}>
      Show: 
      {filters.map((filter) => (
        <a
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          style={{ 
            color: currentFilter === filter.id ? '#ffff99' : '#33ff99',
            margin: '0 10px',
            cursor: 'pointer'
          }}
        >
          [{filter.label}]
        </a>
      ))}
    </div>
  );
}