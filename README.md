# MarcoLand Revival

A modern recreation of the classic browser-based MMORPG MarcoLand (formerly at tiipsi.com), active from 2006-2008.

## About

MarcoLand was a text-based, asynchronous MMORPG where players could battle monsters, complete quests, trade items, and join guilds. This project aims to recreate the game using modern web technologies while preserving the original gameplay experience.

## Current Status

🚧 **In Active Development** - Foundation Complete

### ✅ Implemented Features
- **Authentication System**: Email/password and OAuth (Google, Discord, GitHub)
- **Character Creation**: Automatic character setup with starting stats
- **Beach Combat System**: Fight 30 monsters (Goblin to Nazgul) with turn-based combat
- **Temple Prayer System**: Convert mana to stat points (Strength/Speed/Intelligence)
- **Equipment System**: Complete equipment system with 51 weapons + 56 armor pieces
  - Equipment shop API (browse, purchase, equip/unequip)
  - Authentic encumbrance and speed modifier mechanics
  - Combat integration (weapon damage, armor protection)
  - Atomic database operations prevent corruption
- **Level Progression**: Automatic level-ups, XP calculation, stat point rewards
- **Mana Regeneration**: 6-hour cycle resource system
- **Database Security**: Complete RLS policies for all tables
- **API Foundation**: RESTful endpoints with JWT authentication
- **Game Configuration**: All authentic formulas and mechanics from original game

### 🔄 In Progress
- **Shop System**: Web interface for equipment purchases

### 📋 Planned Features
- **Web Interface**: Complete frontend for all game systems
- **PvP Combat**: Fight other players with intelligence modifiers
- **Quests**: Missions for experience and rewards
- **Towns**: Guild system for group play
- **Trading**: Player-to-player marketplace
- **Town Wars**: Large-scale PvP battles

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

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
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

4. Set up the database:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the scripts in order:
     1. `/database/migrate-to-equipment-system.sql` (includes schema + equipment functions)
     2. `/database/api-functions.sql`
     3. `/database/system-tables.sql`
     4. `/database/rls-policies.sql`
   
5. Configure OAuth providers (optional):
   - In Supabase Dashboard → Authentication → Providers
   - Enable Google, Discord, and/or GitHub
   - Set redirect URL to `http://localhost:3000/auth/callback`

6. Start the development server:
```bash
npm run dev
```

7. Seed game data:
```bash
node database/seeders/monsters.js     # Load monster data
node database/seeders/equipment.js    # Load 51 weapons + 56 armor pieces
```

8. Test the game:
   - Open `http://localhost:3000/test-auth.html`
   - Register a new account and get auth token
   - Use token to test combat: `curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/beach/monsters`

## Project Structure

```
mmorpg-revival/
├── client/           # Frontend files
├── server/           # Backend API server
│   ├── routes/       # API route handlers
│   └── index.js      # Main server file
├── database/         # Database schemas and migrations
├── scraper/          # Wayback Machine scraper tools
├── scraped-data/     # Data recovered from original game
│   ├── wiki/         # Game documentation and formulas
│   ├── html/         # Original HTML pages
│   └── game-logic/   # Extracted game mechanics
├── public/           # Static assets
│   ├── assets/       # Images, sprites
│   ├── css/          # Stylesheets
│   └── js/           # Client-side JavaScript
└── CLAUDE.md         # AI assistant context

```

## Available Scripts

```bash
npm run dev          # Start development server
npm run scrape       # Run Wayback Machine scraper
npm run db:migrate   # Run database migrations
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

#### Equipment System
- `GET /api/equipment/shop` - Browse available equipment for purchase
- `POST /api/equipment/purchase` - Buy equipment with gold
- `GET /api/equipment/inventory` - View equipped items and inventory
- `POST /api/equipment/slot/:slot` - Equip/unequip items in slots

### Coming Soon
- Web interface for all game systems
- Equipment selling back to shop
- Player-to-player trading system
- PvP combat system

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
- **Stateless**: JWT authentication, no server sessions
- **Configurable**: Game mechanics in `/server/config/game.js`
- **Secure**: Row-level security on all database tables
- **Clean Code**: No backwards compatibility, forward-looking only

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

### Development Guidelines
1. Read [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) for roadmap
2. Check [`HANDOFF_COMBAT_COMPLETE.md`](./HANDOFF_COMBAT_COMPLETE.md) for current state
3. Review [`MARCOLAND_DATA_EXTRACTION.md`](./MARCOLAND_DATA_EXTRACTION.md) for authentic game mechanics
4. See [`NEXT_PR_PLAN.md`](./NEXT_PR_PLAN.md) for upcoming features
3. Follow existing code patterns
4. Test all endpoints
5. Update documentation

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

### Phase 1: Foundation ✅
- [x] Project setup and structure
- [x] Database schema design
- [x] Data recovery from Wayback Machine
- [x] Authentication system (email/OAuth)
- [x] Character creation
- [x] Mana regeneration service
- [x] API foundation with JWT

### Phase 2: Core Gameplay ✅
- [x] Beach combat system (30 monsters, turn-based combat, level progression)
- [x] Temple praying for stats (convert mana to Strength/Speed/Intelligence)
- [x] Equipment system (51 weapons, 56 armor pieces with combat integration)
- [ ] Equipment shop frontend interface
- [ ] Forging system for equipment enhancement

### Phase 3: Social Features 📋
- [ ] Basic towns (guilds)
- [ ] PvP combat (10 attacks/day)
- [ ] Player marketplace
- [ ] Chat system
- [ ] Friends list

### Phase 4: Advanced Systems 📋
- [ ] Quest system
- [ ] Town wars
- [ ] Siege weapons
- [ ] Legions
- [ ] Achievements

---

*This is a fan project and is not affiliated with the original MarcoLand or tiipsi.com*