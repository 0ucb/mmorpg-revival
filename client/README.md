# MarcoLand Revival - Web Interface

A React-based web interface for the MarcoLand Revival MMORPG, featuring the authentic MarcoLand UI design and equipment management system.

## Features

✅ **Authentic MarcoLand Design**
- 3-column layout with 280px sidebars
- Black background with bright green (#33FF99) borders
- Verdana 10px typography matching original game
- Complete color scheme recreation

✅ **Equipment Interface**
- Equipment slots display (weapon, head, body, legs, hands, feet)
- Inventory management with item actions
- Real-time sell functionality with gold updates
- Equipment action with slot detection
- Encumbrance and protection calculations

✅ **Player Stats Sidebar**
- Real-time player statistics display
- Navigation menu with MarcoLand structure
- Server statistics
- Help links section

✅ **API Integration**
- Complete backend API connectivity
- Error handling with fallback demo data
- Loading states for all operations
- Real-time data updates

## Installation

### Prerequisites
- Node.js 18+ installed
- MarcoLand Revival backend server running on port 3000
- Player authentication setup in backend

### Setup

1. **Install Dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The client will start on `http://localhost:3001` with API proxy to `http://localhost:3000`

3. **Build for Production**
   ```bash
   npm run build
   ```

## File Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Layout.jsx           # 3-column layout wrapper
│   │   ├── Sidebar.jsx          # Left sidebar with player stats
│   │   ├── RightSidebar.jsx     # Right sidebar with game info
│   │   ├── EquipmentScreen.jsx  # Main equipment interface
│   │   └── InventoryItem.jsx    # Individual item component
│   ├── styles/
│   │   └── main.css            # MarcoLand styling
│   ├── api/
│   │   └── equipment.js        # API integration utilities
│   ├── App.jsx                 # Main application
│   └── main.jsx               # React entry point
├── package.json
├── vite.config.js             # Vite configuration
└── index.html
```

## API Integration

The client connects to the following backend endpoints:

### Equipment System
- `GET /api/equipment/inventory` - Load player equipment and inventory
- `POST /api/equipment/sell` - Sell equipment for gold
- `POST /api/equipment/slot/:slot` - Equip/unequip items
- `GET /api/equipment/shop` - Browse available equipment

### Player Data
- `GET /api/players/me` - Get player basic info
- `GET /api/players/me/stats` - Get detailed player stats

### Authentication
- All requests use `credentials: 'include'` for session cookies
- Graceful error handling with demo data fallbacks

## UI Specifications

### MarcoLand Design System

**Colors:**
- Background: `#000000` (black)
- Borders: `#33FF99` (bright green)
- Text: `#ffffff` (white)
- Links: `#33FF99` (hover: `#006600`)
- Item names: `#ff0000` (red)
- Buttons: `#33FF99` background, `#000000` text

**Typography:**
- Font: Verdana, Arial, sans-serif
- Base size: 10px
- Headers: 11-14px
- Line height: 1.2

**Layout:**
- Left sidebar: 280px fixed width
- Right sidebar: 280px fixed width
- Center content: Flexible width
- All panels have green borders

### Component Behavior

**Equipment Screen:**
- Shows equipped items in 6 slots (weapon, head, body, legs, hands, feet)
- Displays encumbrance and protection stats
- Lists inventory items with [Sell] and [Equip] buttons
- Real-time updates after actions

**Inventory Items:**
- Red item names matching original design
- Weapon stats: "Damage : [ min/max ] Strength Needed = [ req ]"
- Armor stats: "Protection : [ value ] Strength Needed = [ req ]"
- Inline action buttons with loading states

**Player Stats Sidebar:**
- Real-time stat display
- Navigation menu with "-->" prefix
- Server statistics
- Help links with "-" prefix

## Error Handling

The application includes comprehensive error handling:

1. **API Connection Failures**: Falls back to demo data
2. **Authentication Issues**: Shows appropriate error messages
3. **Action Failures**: User-friendly error alerts
4. **Loading States**: Visual feedback during operations

## Development Notes

### API Proxy
The Vite development server proxies API calls to the backend:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  }
}
```

### Responsive Design
- Mobile responsive with stacked layout on small screens
- Maintains MarcoLand aesthetic on all screen sizes
- Sidebar collapses gracefully

### Performance
- Optimized re-renders with proper state management
- Efficient API calls with error boundaries
- Loading states prevent UI blocking

## Testing

### Manual Testing Checklist

1. **Layout**: Verify 3-column layout displays correctly
2. **Styling**: Confirm MarcoLand colors and fonts match
3. **Player Stats**: Check real-time stat loading from API
4. **Equipment Display**: Verify equipped slots show correctly  
5. **Inventory**: Confirm items display with proper stats
6. **Sell Function**: Test selling items updates gold
7. **Equip Function**: Test equipping items updates slots
8. **Error Handling**: Verify graceful fallback with demo data
9. **Loading States**: Confirm buttons show "Processing..." state

### Backend Requirements

The client expects the backend to be running with:
- Authentication system active
- Equipment API endpoints responding
- Player data endpoints available
- CORS properly configured for localhost:3001

## Deployment

### Production Build
```bash
npm run build
```

### Environment Configuration
Create `.env` file for different API base URLs:
```
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Hosting Recommendations
- **Frontend**: Vercel, Netlify, or GitHub Pages
- **Backend**: Railway, Render, or DigitalOcean
- **Database**: Already using Supabase

## Next Steps

### Potential Improvements
1. **Real-time Mana Timer**: Implement 6-hour countdown
2. **Shop Interface**: Add equipment purchasing screen
3. **Combat Interface**: Fighting/monster selection
4. **Temple Interface**: Prayer system for stat training
5. **Mobile App**: PWA conversion
6. **Performance**: Add service worker for caching

### Additional Screens to Implement
- Login/Registration
- Shop/Blacksmith
- Fighting/Beach
- Temple/Prayers
- City Hub

## Issues and Solutions

### Common Problems

**API Connection Issues:**
- Ensure backend server is running on port 3000
- Check CORS configuration allows localhost:3001
- Verify authentication endpoints are working

**Styling Issues:**
- Confirm CSS file is imported in main.jsx
- Check for CSS conflicts with browser defaults
- Verify green border colors match specification

**Data Loading Problems:**
- Check network tab for API response errors
- Verify authentication tokens are being sent
- Confirm database has required player/equipment data

## Support

For issues or questions:
1. Check backend server logs for API errors
2. Inspect browser console for JavaScript errors
3. Verify database contains equipment and player data
4. Test API endpoints directly with curl/Postman