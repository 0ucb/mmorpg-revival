# MarcoLand Revival

A modern recreation of the classic browser-based MMORPG MarcoLand (formerly at tiipsi.com), active from 2006-2008.

## About

MarcoLand was a text-based, asynchronous MMORPG where players could battle monsters, complete quests, trade items, and join guilds. This project aims to recreate the game using modern web technologies while preserving the original gameplay experience.

## Current Status

🎮 **Production-Ready Single-Player Game** - Phase 5 Complete

### ✅ Implemented Features
- **Complete Authentication System**: Secure email/password with httpOnly cookies
- **Full React Frontend**: Complete web UI with authentic MarcoLand navigation
- **Character Creation & Progression**: Automatic setup with authentic MarcoLand mechanics
- **Beach Combat System**: Fight 30 monsters (Goblin to Nazgul) with detailed turn-based combat
- **Complete Temple Prayer System**: Convert mana to focused stat gains with decimal precision
  - Clickable mana amount links ([5] [50] [all]) for flexible prayers
  - Focused stat gains (all gains go to chosen stat: strength/speed/intelligence)
  - Authentic MarcoLand decimal precision (DECIMAL(6,3)) with exact gain display
- **Authentic NPC Shop Structure**: Separate shops matching original MarcoLand city
  - **Blacksmith**: Weapons only ("Buy Your Weapons Here")
  - **Armourer**: Armor only ("Buy Your Armours Here") 
  - **Gems Store**: 30 daily gems at 90g each with daily limit enforcement
  - **Market & Resources**: Vote system and Mana Tree infrastructure ready
- **Complete Equipment System**: 51 weapons + 56 armor pieces with full economic cycle
  - Authentic encumbrance and speed modifier mechanics
  - Combat integration (weapon damage, armor protection)
  - Complete inventory management with [unequip] functionality
- **Robust Mana Management**: 6-hour regeneration with offline catch-up system
- **Authentic Navigation**: Complete city structure matching original MarcoLand
- **Level Progression**: Automatic level-ups, XP calculation, stat point rewards
- **Database Security**: Complete RLS policies and atomic operations
- **Production-Ready**: Comprehensive error handling, clean UX without alert() popups

### 🎯 Current Status
- **Core Single-Player Loop**: Complete and fully functional
- **Daily Trading Foundation**: NPC shops ready for arbitrage strategies
- **Authentic MarcoLand Experience**: True to original game mechanics and interface

### 📋 Next Features (Phase 6+)
- **Player Market System**: Complete player-to-player trading (gems, metals, equipment)
- **Daily Resource Activities**: Voting rewards and Mana Tree purchases (gems → max mana)
- **PvP Combat**: Player vs player with separate PvP mana pools and intelligence modifiers
- **Skills System**: Gems Finding skill with daily progression and economic impact
- **Social Features**: Towns, guilds, buddy/blacklist systems for target management
- **Advanced Systems**: Quests, town wars, creature summoning and dungeon exploration

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/0ucb/mmorpg-revival.git
cd mmorpg-revival
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3000
```

5. Set up the database:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the scripts in order:
     1. `/database/migrate-to-equipment-system.sql` (includes schema + equipment functions)
     2. `/database/api-functions.sql`
     3. `/database/system-tables.sql`
     4. `/database/rls-policies.sql`

6. Seed game data:
```bash
node database/seeders/monsters.js     # Load monster data
node database/seeders/equipment.js    # Load 51 weapons + 56 armor pieces
```

### Running the Game

**Option 1: Use the convenient batch files (Windows)**
1. **Start Backend**: Double-click `start.bat` 
2. **Start Frontend**: Double-click `client/start-client.bat`
3. **Play**: Visit `http://localhost:3001` in your browser

**Option 2: Manual start**
1. **Backend**: 
   ```bash
   npm run dev  # Starts on http://localhost:3000
   ```
2. **Frontend** (in separate terminal):
   ```bash
   cd client
   npm run dev  # Starts on http://localhost:3001
   ```
3. **Play**: Visit `http://localhost:3001` in your browser

### First Time Setup
1. Register a new account using the web interface
2. Your character will be automatically created with starting stats
3. Begin playing! Fight monsters, pray for stats, buy equipment

## Project Structure

```
mmorpg-revival/
├── client/                    # React Frontend (port 3001)
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # Authentication context
│   │   ├── api/               # API client utilities
│   │   └── styles/            # CSS styling
│   ├── start-client.bat       # Frontend startup script
│   └── package.json
├── server/                    # Backend API Server (port 3000)
│   ├── routes/                # API route handlers
│   ├── middleware/            # Authentication middleware  
│   ├── config/                # Game configuration
│   ├── services/              # Background services
│   └── index.js               # Main server file
├── database/                  # Database schemas and functions
│   ├── migrate-to-equipment-system.sql  # Main schema
│   ├── equipment-functions.sql          # Equipment system
│   └── seeders/               # Game data seeders
├── scraped-data/              # Recovered MarcoLand data
│   ├── wiki/                  # Game documentation and formulas
│   ├── html/                  # Original HTML pages  
│   └── game-logic/            # Extracted game mechanics
├── start.bat                  # Backend startup script
└── CLAUDE.md                  # AI assistant context
```

## Available Scripts

### Backend (Root Directory)
```bash
npm run dev          # Start backend API server (port 3000)
npm run scrape       # Run Wayback Machine scraper
npm run db:migrate   # Run database migrations
npm test             # Run test suite (44 passing tests)
```

### Frontend (Client Directory)
```bash
cd client
npm run dev          # Start React frontend (port 3001)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Convenience Scripts
```bash
# Windows
start.bat            # Start backend server
client/start-client.bat  # Start frontend client

# Manual (cross-platform)
npm run dev & cd client && npm run dev
```

## API Documentation

The API is available at `http://localhost:3000/api/docs` when the server is running.

### Currently Available Endpoints

#### Authentication
- `POST /api/auth/register` - Create new account with character
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - End current session
- `GET /api/auth/session` - Validate and get session info
- `POST /api/auth/oauth/:provider` - Start OAuth flow (google/discord/github)
- `POST /api/auth/oauth/callback` - Handle OAuth callback

#### Beach Combat
- `GET /api/beach/monsters` - List all 30 monsters with efficiency stats
- `POST /api/beach/fight` - Fight a monster (1 mana per fight)

#### Temple Training
- `POST /api/temple/pray` - Convert mana to stat points (5/50/all mana)
- `GET /api/temple/efficiency` - View current prayer efficiency

#### Equipment System (⚠️ Architecture Update Planned)
- `GET /api/equipment/shop` - Browse available equipment (will be split into separate shops)
- `POST /api/equipment/purchase` - Buy equipment with gold
- `POST /api/equipment/sell` - Sell equipment back to shop (50% value)
- `GET /api/equipment/inventory` - View equipped items and inventory
- `POST /api/equipment/slot/:slot` - Equip/unequip items in slots

#### Planned API Updates (Next PR)
- `GET /api/blacksmith` - Weapons only (replacing unified shop)
- `GET /api/armourer` - Armor only (replacing unified shop)
- `GET /api/gems-store` - Daily gem purchases (30/day limit)
- `GET /api/market` - Player marketplace (placeholder → full implementation)
- `GET /api/resources/vote` - Daily voting system
- `GET /api/resources/mana-tree` - Mana purchases with gems

#### Player Data
- `GET /api/players/me` - Get current player information
- `GET /api/players/me/stats` - Get current player stats

### Web Interface
- **Frontend Available**: Complete React interface at `http://localhost:3001`
- **Authentication**: Login/register with session management
- **Equipment Management**: Browse shop, buy/sell items, manage inventory
- **Combat**: Fight monsters at the beach
- **Character Development**: Pray at temple, view stats and progression

## Game Mechanics

### Resource System
- **Mana**: Regenerates every 6 hours to full
- **HP**: Increases with level, heals with gold/gems
- **Gold**: Currency earned from monsters and trading

### Character Stats (3 Trainable Stats)
- **Strength**: Increases melee damage and equipment capacity
- **Speed**: Reduces damage penalty from encumbrance, determines attack order
- **Intelligence**: Provides damage multiplier in PvP (0.75x to 1.50x), required for spells

### Combat Formulas
```
PvE Damage = (Strength + Weapon Damage) × Speed Modifier - Enemy Protection
PvP Damage = (Strength + Weapon Damage) × Speed Modifier × Intelligence Modifier - Enemy Protection
Speed Modifier = 0.5 + 0.5 × (Speed / Encumbrance), capped at 1.0
```

### Progression
- Experience to next level: `150 × (level²) + 200`
- Max HP: `2 × (level²) + 3 × level`
- Max Mana: `(level × 3) + 50`
- Starting stats: 10 Strength/Speed/Intelligence each

## Architecture

See [`ARCHITECTURE_ABSTRACT.md`](./ARCHITECTURE_ABSTRACT.md) for detailed system architecture.

### Key Design Principles
- **API-First**: Every action available via REST endpoints
- **Secure Authentication**: httpOnly cookies with CORS support
- **Modern Frontend**: React with Vite for fast development
- **Configurable**: Game mechanics in `/server/config/game.js`
- **Database Security**: Row-level security and atomic operations
- **Production Ready**: Comprehensive test coverage and error handling

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

### Development Guidelines
1. Read [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) for comprehensive roadmap
2. Check [`GAME_ABSTRACT.md`](./GAME_ABSTRACT.md) for complete game systems overview
3. Review [`NEXT_PR_AUTHENTIC_CITY_STRUCTURE.md`](./NEXT_PR_AUTHENTIC_CITY_STRUCTURE.md) for next priority
4. See [`MARCOLAND_DATA_EXTRACTION.md`](./MARCOLAND_DATA_EXTRACTION.md) for authentic mechanics
5. Follow existing code patterns and test coverage
6. Update documentation and maintain API compatibility

## Data Recovery

The `/scraper` directory contains tools to recover game data from the Wayback Machine:

```bash
node scraper/wayback-scraper.js    # Basic scraper
node scraper/wiki-scraper.js        # Wiki documentation scraper
node scraper/deep-scraper.js        # Comprehensive scraper
```

## License

This project is a fan recreation for educational purposes. All game mechanics and content are based on the original MarcoLand game.

## Acknowledgments

- Original MarcoLand creators and the tiipsi.com team
- The Internet Archive's Wayback Machine for preserving game data
- All original MarcoLand players who contributed to the wiki

## Support

For questions or issues, please open an issue on GitHub or check the `/scraped-data/wiki/` directory for original game documentation.

## Development Roadmap

### Phase 1: Foundation ✅ Complete
- [x] Project setup and database schema
- [x] Data recovery from Wayback Machine
- [x] Secure authentication system with httpOnly cookies
- [x] Character creation and progression
- [x] Mana regeneration service
- [x] Comprehensive API foundation

### Phase 2: Core Gameplay ✅ Complete
- [x] Beach combat system (30 monsters, authentic turn-based combat)
- [x] Temple praying system (convert mana to stats)
- [x] Complete equipment system (51 weapons, 56 armor pieces)
- [x] Equipment economy (buy/sell cycle with 50% sell-back)
- [x] Full combat integration with equipment stats

### Phase 3: Web Interface ✅ Complete
- [x] React frontend with modern UI/UX
- [x] Authentication screens (login/register)
- [x] Equipment management interface
- [x] Combat and character progression screens
- [x] Complete single-player experience

### Phase 4: Authentic Navigation ✅ Complete
- [x] Complete city structure matching original MarcoLand
- [x] All screens with proper navigation flow (Home → City → Beach/Temple/etc)
- [x] Authentic MarcoLand interface styling and behavior
- [x] Production-ready single-player game

### Phase 5: Authentic City Architecture 🔄 In Progress
- [ ] ⚠️ **Fix Equipment Shop Architecture**: Split unified shop into authentic separate stores
- [ ] **NPC Shops**: Blacksmith (weapons), Armourer (armor), Town gems store (daily limits)
- [ ] **Player Market Foundation**: Infrastructure for future player-to-player trading
- [ ] **Resource Management**: Daily voting system, Tall Tree of Mana

### Phase 6: Complete Trading Systems 📋 Planned
- [ ] **Full Player Market**: Complete trading system (gems, metals, equipment)
- [ ] **Daily Optimization**: Trading arbitrage and resource management strategies
- [ ] **Skills System**: Gems finding skill integration

### Phase 7: Social Features 📋 Planned  
- [ ] **PvP Combat**: Separate PvP mana pools, intelligence modifiers
- [ ] **Towns & Guilds**: Equipment sharing, social coordination
- [ ] **Advanced Systems**: Buddy/blacklist management, chat systems

### Phase 8: Advanced Systems 📋 Future
- [ ] **Creature System**: Creature summoning, PvP metal farming
- [ ] **Dungeon Exploration**: Treasure hunting, grand prizes
- [ ] **Complete Skills**: Master forging, advanced progression systems
- [ ] **Town Wars**: Large-scale PvP, siege weapons, legions
- [ ] **Quest System**: Storylines and advanced game content

---

*This is a fan project and is not affiliated with the original MarcoLand or tiipsi.com*