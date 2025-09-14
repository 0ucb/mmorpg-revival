# MarcoLand Revival

A modern recreation of the classic browser-based MMORPG MarcoLand (formerly at tiipsi.com), active from 2006-2008.

## About

MarcoLand was a text-based, asynchronous MMORPG where players could battle monsters, complete quests, trade items, and join guilds. This project aims to recreate the game using modern web technologies while preserving the original gameplay experience.

## Current Status

🚧 **In Active Development** - Foundation Complete

### ✅ Implemented Features
- **Authentication System**: Email/password and OAuth (Google, Discord, GitHub)
- **Character Creation**: Automatic character setup with starting stats
- **Mana Regeneration**: 6-hour cycle resource system
- **Database Security**: Complete RLS policies for all tables
- **API Foundation**: RESTful endpoints with JWT authentication
- **Game Configuration**: All formulas and mechanics from original game

### 🔄 In Progress
- Beach combat system
- Character progression (temple praying)
- Inventory management
- Basic town system

### 📋 Planned Features
- **Combat System**: Fight monsters and other players
- **Items & Equipment**: 50+ weapons and armor pieces
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
     1. `/database/schema.sql`
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

7. Test the authentication:
   - Open `http://localhost:3000/test-auth.html`
   - Try registering a new account
   - Test login functionality

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

### Coming Soon
- Beach combat endpoints
- Temple praying endpoints
- Inventory management
- Market/trading system

## Game Mechanics

### Resource System
- **Mana**: Regenerates every 6 hours to full
- **HP**: Increases with level, heals with gold/gems
- **Gold**: Currency earned from monsters and trading

### Character Stats
- **Strength**: Increases melee damage and equipment capacity
- **Speed**: Reduces damage penalty from encumbrance
- **Intelligence**: Provides damage bonus in PvP
- **Defense**: Reduces incoming damage
- **Luck**: Affects loot and critical chances

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
- Starting stats: 10 STR/DEF/AGI/INT, 5 LUCK

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
2. Check [`HANDOFF_AUTH_COMPLETE.md`](./HANDOFF_AUTH_COMPLETE.md) for current state
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

### Phase 2: Core Gameplay 🔄
- [ ] Beach combat system
- [ ] Temple praying for stats
- [ ] Inventory and equipment
- [ ] Shop for buying/selling
- [ ] Death and revival system

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