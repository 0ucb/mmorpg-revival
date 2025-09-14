# MarcoLand Revival Project - Development Guide

## Project Overview
Recreation of MarcoLand, a defunct browser-based MMORPG from 2006-2008. Focus on preserving original gameplay mechanics using modern tech stack.

## Game Data Sources
- `/scraped-data/wiki/extracted/` - Game mechanics and formulas
- `/scraped-data/html/` - Original UI templates and structure
- Use scraped data as the source of truth for game mechanics

## Tech Stack
- **Database**: Supabase (PostgreSQL)
- **API**: REST endpoints
- **Frontend**: Simple HTML/JS (matching original text-based style)
- **Auth**: Supabase Auth
- **Deployment**: TBD

## Development Practices

### Code Style
- Follow existing patterns in the codebase
- Check imports and dependencies before using libraries
- No comments unless requested
- Clean, forward-looking code only
- **NEVER add fallbacks or backwards compatibility** - keep codebase clean
- **No legacy support** - this is a fresh recreation, not a migration

### API Design
- All game actions via REST endpoints
- Enables third-party clients, mobile apps, automation
- Easy testing and development

### Development Workflow
1. Check `/database/schema.sql` for data structure
2. Reference `/scraped-data/` for game mechanics
3. Build incrementally: auth → characters → core gameplay
4. Test API endpoints as you build

### Key Files
- `/database/` - Schema and functions
- `/server/` - API implementation
- `/client/` - Frontend interface
- `/scraped-data/` - Original game data

### Commands
```bash
npm run dev         # Development server
npm run scrape      # Extract game data
npm run db:migrate  # Database setup
```

### Environment Setup
```bash
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key
```