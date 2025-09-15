# MarcoLand Revival Project - Development Guide

## Project Overview
Recreation of MarcoLand, a defunct browser-based MMORPG from 2006-2008. Focus on preserving original gameplay mechanics using modern tech stack.

## Game Data Sources
- `/scraped-data/wiki/extracted/` - Game mechanics and formulas
- `/scraped-data/html/` - Original UI templates and structure
- Use scraped data as the source of truth for game mechanics

## Tech Stack
- **Database**: Supabase (PostgreSQL)
- **Backend**: Node.js/Express REST API (port 3000)
- **Frontend**: React with Vite (port 3001)
- **Auth**: httpOnly cookies with Supabase backend
- **Development**: Hot reload with CORS-enabled frontend/backend
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

### Test-Driven Development (TDD)
- **Always write tests first** before implementing features
- Red-Green-Refactor cycle: failing test → make it pass → improve code
- Test API endpoints with actual HTTP requests
- Test database operations with real database interactions
- Test game mechanics against scraped data formulas
- Use descriptive test names that explain the expected behavior
- Keep tests fast and isolated
- Mock external services (Supabase) only when necessary for speed

### Development Workflow
1. Check `/database/schema.sql` for data structure
2. Reference `/scraped-data/` for game mechanics
3. **Write failing tests** for the feature you're building
4. Build incrementally: auth → characters → core gameplay
5. Make tests pass with minimal code
6. Refactor and improve
7. Test API endpoints as you build

### Key Files
- `/database/` - Schema and functions
- `/server/` - API implementation
- `/client/` - Frontend interface
- `/scraped-data/` - Original game data

### Commands
```bash
# Backend (root directory)
npm run dev         # Start backend API server (port 3000)
npm test            # Run test suite (44 passing tests)
npm run scrape      # Extract game data
npm run db:migrate  # Database setup

# Frontend (client directory)  
cd client && npm run dev  # Start React frontend (port 3001)

# Convenience (Windows)
start.bat                    # Start backend
client/start-client.bat      # Start frontend

# Troubleshooting
wmic process where "name='node.exe'" delete  # Kill all Node.js processes (Windows)
```

### Environment Setup
```bash
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key
```

## Current Status (Phase 3 Complete)

### ✅ Production-Ready Single-Player Game
- **Authentication**: Secure httpOnly cookie system with CORS support
- **Frontend**: Complete React interface with equipment management, combat, character progression  
- **Backend**: Full REST API with 44 passing tests
- **Database**: Complete schema with atomic operations and RLS security
- **Game Systems**: Beach combat, Temple prayers, Equipment economy (buy/sell)

### Key Authentication Implementation
- **CORS**: Configured for frontend (port 3001) to backend (port 3000) communication
- **Sessions**: httpOnly cookies prevent XSS, support credentials across origins
- **API Routes**: `/api/players/me`, `/api/auth/*`, `/api/equipment/*` all cookie-authenticated
- **Middleware**: Updated to prioritize cookies over Bearer tokens

### Development Notes
- Both frontend and backend must run simultaneously for full functionality
- Frontend proxies `/api` requests to backend automatically
- Authentication context simplified to use only backend APIs (no mixed Supabase client)
- Equipment loading issues resolved with proper API endpoint mounting