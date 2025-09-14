# MarcoLand Revival

A modern recreation of the classic browser-based MMORPG MarcoLand (formerly at tiipsi.com), active from 2006-2008.

## About

MarcoLand was a text-based, asynchronous MMORPG where players could battle monsters, complete quests, trade items, and join guilds. This project aims to recreate the game using modern web technologies while preserving the original gameplay experience.

## Features

### Core Gameplay
- **Character Development**: Level up your character, increase stats (Strength, Speed, Intelligence)
- **Combat System**: Fight monsters and other players with strategic turn-based combat
- **Items & Equipment**: 50+ weapons and various armor pieces with different requirements
- **Quests**: Complete missions for experience and rewards
- **Guilds**: Join or create guilds to play with others
- **Trading**: Player-to-player marketplace for items

### Technical Features
- **REST API**: All game actions available via API endpoints
- **Modern Backend**: PostgreSQL database via Supabase
- **Authentication**: Secure user authentication system
- **Cross-Platform**: Play on any device with a web browser

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mmorpg-revival.git
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

5. Start the development server:
```bash
npm run dev
```

6. Open your browser to `http://localhost:3000`

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

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login to existing account
- `GET /api/auth/session` - Get current session

#### Player Actions
- `GET /api/players/:username` - Get player profile
- `POST /api/players/:username/action` - Execute game action
- `GET /api/players/:username/inventory` - Get inventory

#### Game Data
- `GET /api/items` - List all items
- `GET /api/quests` - Available quests
- `GET /api/market/listings` - Market listings

## Game Mechanics

### Character Stats
- **Strength**: Increases melee damage
- **Speed**: Reduces damage penalty from encumbrance
- **Intelligence**: Provides damage bonus in PvP

### Combat Formula
```
PvE Damage = (Strength + Weapon Damage) × Speed Modifier - Enemy Protection
PvP Damage = (Strength + Weapon Damage) × Speed Modifier × Intelligence Modifier - Enemy Protection
```

### Leveling
- Experience needed: `150 × (level²) + 200`
- Max HP: `2 × (level²) + 3 × level`
- Max Mana: `level × 3 + 50`

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

### Development Guidelines
1. Preserve the original game's simplicity
2. Ensure all features are API-accessible
3. Test new features thoroughly
4. Document any new game mechanics

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

## Roadmap

- [x] Project setup and structure
- [x] Database schema design
- [x] Data recovery from Wayback Machine
- [x] API server foundation
- [ ] User authentication
- [ ] Basic game interface
- [ ] Combat system
- [ ] Inventory management
- [ ] Quest system
- [ ] Guild system
- [ ] Market/trading
- [ ] Mobile-responsive design

---

*This is a fan project and is not affiliated with the original MarcoLand or tiipsi.com*