# MarcoLand Revival Project - Context for AI Assistants

## Project Overview
This is a recreation of MarcoLand (tiipsi.com), a defunct browser-based MMORPG from ~2006-2008. The goal is to rebuild the game using modern technologies while preserving the original gameplay mechanics and feel.

## Original Game Information
- **Name**: MarcoLand
- **URL**: tiipsi.com (defunct)
- **Type**: Asynchronous browser-based MMORPG
- **Era**: Active 2006-2008
- **Style**: HTML-based, text-heavy with minimal graphics

## Recovered Game Mechanics

### Core Stats
- **Primary Stats**: Strength, Speed (Agility), Intelligence
- **Resources**: HP (Health Points), Mana
- **Currency**: Gold Coins (GC), Metals, Gems, Quarz

### Key Formulas
```
Experience to level up: 150 * (level^2) + 200
Maximum HP: 2 * (level^2) + 3 * level
Maximum Mana: level * 3 + 50 (up to level 175)
```

### Damage Calculation
- **PvE**: `damage = (Strength + weapon_damage) * speed_modifier - protection`
- **PvP**: `damage = (Strength + weapon_damage) * speed_modifier * intelligence_modifier - protection`
- **Speed Modifier**: `0.5 + 0.5 * (speed/encumbrance)` (capped at 1)

### Praying System
Players can pray at the Temple of Tiipsi to gain stats:
- Under 1100 total stats: 3.5 stats per 50 mana
- 1100-1300 total stats: 2.5 stats per 50 mana
- 1300-1500 total stats: 1.5 stats per 50 mana
- Over 1500 total stats: 1.1 stats per 50 mana

## Technical Architecture

### Backend
- **Database**: Supabase (PostgreSQL)
- **API**: RESTful endpoints for all game actions
- **Authentication**: Supabase Auth
- **Real-time**: Not required (async gameplay)

### Frontend
- **Initial**: Simple HTML/JS (matching original style)
- **Future**: Could upgrade to React/Vue/Svelte

### Key Database Tables
- `players` - User accounts and character data
- `player_stats` - Strength, speed, intelligence, etc.
- `inventory` - Player items and equipment
- `items` - Weapon/armor definitions (50+ weapons, multiple armor pieces)
- `creatures` - Monsters and NPCs
- `quests` - Quest definitions and objectives
- `player_quests` - Quest progress tracking
- `combat_logs` - Battle history
- `guilds` - Player guilds/clans
- `market_listings` - Player-to-player trading

## Scraped Data Available
Located in `/scraped-data/`:
- **Wiki Pages**: Game formulas, weapon/armor lists, monster guides
- **HTML Pages**: Login, signup, game interface templates
- **Game Logic**: Form structures, authentication flow

## Current Development Status

### Completed
- ✅ Project structure setup
- ✅ Database schema design
- ✅ Wayback Machine scraper
- ✅ Wiki data extraction
- ✅ Game mechanics documentation

### In Progress
- 🔄 Basic authentication system
- 🔄 Core game loop implementation

### Todo
- ⏳ Player registration/login
- ⏳ Character creation
- ⏳ Battle system
- ⏳ Inventory management
- ⏳ Quest system
- ⏳ Guild system
- ⏳ Market/trading

## API Design Philosophy
All game actions should be available via REST API to allow:
- Third-party clients
- Mobile apps
- Automation/bots (if desired)
- Easy testing

## Important Files
- `/database/schema.sql` - Complete database structure
- `/database/api-functions.sql` - PostgreSQL functions for game logic
- `/scraped-data/wiki/extracted/` - Game mechanics and formulas
- `/server/index.js` - API server setup

## Development Commands
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run scrape      # Run Wayback scraper
npm run db:migrate  # Run database migrations
```

## Environment Variables
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
PORT=3000
```

## Testing Approach
1. Start with basic authentication
2. Implement simple character creation
3. Add basic movement/actions
4. Layer in combat system
5. Add items/inventory
6. Implement quests
7. Add social features (guilds, chat)

## Notes for AI Assistants
- Preserve the original game's simplicity and text-based nature
- Focus on game mechanics over graphics
- Ensure all actions are API-accessible
- Use the scraped wiki data as the source of truth for game mechanics
- The game is asynchronous - no real-time features needed
- Start simple, iterate based on working features
- **NEVER add fallbacks or backwards compatibility** - keep the codebase clean and forward-looking
- **No legacy support** - this is a fresh recreation, not a migration