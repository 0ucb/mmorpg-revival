# MarcoLand Revival - Development Plan

## Project Overview
Recreation of the MarcoLand browser MMORPG with modern technologies, focusing on the complete single-player loop before expanding to social features.

## Core Decisions
- **Mana Cycles**: 6-hour regeneration (configurable, not hardcoded)
- **Authentication**: Required from day one, with social login support
- **Database**: Pre-populate from wiki data + admin tools
- **MVP Goal**: Complete single-player gameplay loop
- **Architecture**: API-first approach with parallel web UI development
- **Towns**: Basic implementation initially, wars postponed

## Development Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Basic infrastructure and authentication

#### 1.1 Authentication System
- [ ] Supabase Auth setup with email/password
- [ ] Google OAuth integration  
- [ ] Discord OAuth integration
- [ ] Session management
- [ ] API authentication middleware
- [ ] Protected route handling

#### 1.2 Database Setup
- [ ] Run schema.sql in Supabase
- [ ] Run api-functions.sql
- [ ] Create migration system for future updates
- [ ] Set up RLS policies properly

#### 1.3 Data Import
- [ ] Parse weapons from wiki data
- [ ] Parse armor from wiki data
- [ ] Parse monsters from wiki data
- [ ] Create database seeder scripts
- [ ] Verify data integrity

#### 1.4 Configuration System
- [ ] Environment-based config
- [ ] Mana regeneration timer (6 hours, configurable)
- [ ] Game constants file
- [ ] Feature flags for gradual rollout

### Phase 2: Core API (Week 2-3)
**Goal**: RESTful API for all single-player actions

#### 2.1 Player Management
- [ ] POST /api/auth/register - Create character on registration
- [ ] GET /api/players/me - Get own profile
- [ ] PUT /api/players/me - Update display name
- [ ] GET /api/players/me/stats - Get detailed stats

#### 2.2 Combat System
- [ ] GET /api/beach/monsters - List available monsters
- [ ] POST /api/beach/fight - Execute combat (1 or 5 mana)
- [ ] Combat damage calculations
- [ ] Experience and gold rewards
- [ ] Death/revival system

#### 2.3 Character Progression  
- [ ] POST /api/temple/pray - Spend mana for stats
- [ ] Implement stat caps and diminishing returns
- [ ] Level up calculations
- [ ] Automatic HP/Mana increases

#### 2.4 Inventory System
- [ ] GET /api/inventory - List player items
- [ ] POST /api/inventory/equip - Equip item
- [ ] POST /api/inventory/unequip - Unequip item
- [ ] Encumbrance calculations
- [ ] Equipment requirements validation

#### 2.5 Economy
- [ ] GET /api/shop - List available items
- [ ] POST /api/shop/buy - Purchase item
- [ ] POST /api/shop/sell - Sell item
- [ ] GET /api/forge - List forgeable items
- [ ] POST /api/forge/upgrade - Forge equipment

#### 2.6 Resource Management
- [ ] Mana regeneration system (every 6 hours)
- [ ] HP regeneration on level up
- [ ] Healing with gold/gems
- [ ] Resource scheduling/cron jobs

### Phase 3: Web Interface (Week 3-4)
**Goal**: Functional web UI for single-player game

#### 3.1 Authentication UI
- [ ] Login page with social options
- [ ] Registration with character creation
- [ ] Password reset flow
- [ ] Session persistence

#### 3.2 Game Layout
- [ ] Main navigation menu
- [ ] Character stats display
- [ ] Resource bars (HP/Mana/Gold)
- [ ] Current location indicator
- [ ] Mobile-responsive design

#### 3.3 Beach (Combat)
- [ ] Monster selection interface
- [ ] Combat log display
- [ ] Batch fighting (1/5 mana)
- [ ] Death/revival interface
- [ ] Rewards display

#### 3.4 Temple (Training)
- [ ] Pray interface (5/50/all mana)
- [ ] Stat gain animations/feedback
- [ ] Efficiency indicator
- [ ] Stats history

#### 3.5 Inventory
- [ ] Equipment grid
- [ ] Item tooltips with stats
- [ ] Equip/unequip actions
- [ ] Encumbrance indicator
- [ ] Sort/filter options

#### 3.6 Shop & Forge
- [ ] Item catalog with filters
- [ ] Purchase confirmation
- [ ] Forge requirements display
- [ ] Success/failure feedback

### Phase 4: Admin Tools (Week 4-5)
**Goal**: Content management system

#### 4.1 Admin Panel
- [ ] Authentication for admin users
- [ ] Dashboard with game statistics
- [ ] Player management interface
- [ ] System health monitoring

#### 4.2 Content Management
- [ ] CRUD for items
- [ ] CRUD for monsters  
- [ ] CRUD for quests (future)
- [ ] Game balance tools
- [ ] Bulk import/export

#### 4.3 Player Management
- [ ] View player profiles
- [ ] Modify player resources (for support)
- [ ] Ban/unban functionality
- [ ] Activity logs

### Phase 5: Polish & Testing (Week 5-6)
**Goal**: Production-ready single-player experience

#### 5.1 Testing
- [ ] Unit tests for combat formulas
- [ ] API endpoint testing
- [ ] Integration tests for game loops
- [ ] Load testing
- [ ] Security audit

#### 5.2 Performance
- [ ] Database query optimization
- [ ] Caching strategy
- [ ] CDN setup for assets
- [ ] API rate limiting
- [ ] Error tracking (Sentry)

#### 5.3 Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Player guide
- [ ] Deployment guide
- [ ] Contributing guidelines

### Phase 6: Basic Social Features (Week 6-7)
**Goal**: Minimal multiplayer interaction

#### 6.1 Towns (Basic Guilds)
- [ ] Create/join town
- [ ] Town roster
- [ ] Town chat
- [ ] Basic permissions (president/member)
- [ ] Leave town

#### 6.2 PvP System
- [ ] Attack player (10/day limit)
- [ ] Combat calculations with INT modifier
- [ ] Battle logs
- [ ] Leaderboards
- [ ] Protection/cooldown periods

#### 6.3 Market
- [ ] List items for sale
- [ ] Browse listings
- [ ] Purchase from players
- [ ] Transaction history
- [ ] Price history/trends

### Phase 7: Advanced Features (Future)
**Goal**: Complete game experience

#### 7.1 Quests
- [ ] Quest system
- [ ] Progress tracking
- [ ] Rewards distribution
- [ ] Daily/weekly quests

#### 7.2 Town Wars (Complex)
- [ ] War declarations
- [ ] 11x11 battlefield
- [ ] Siege weapons
- [ ] Legions
- [ ] War scheduling

#### 7.3 Advanced Systems
- [ ] Creatures/Golems
- [ ] Spell system
- [ ] Achievements
- [ ] Events/seasons

## Technical Stack

### Backend
- **Database**: Supabase (PostgreSQL)
- **API**: Node.js + Express
- **Auth**: Supabase Auth + Social OAuth
- **Scheduling**: node-cron for mana regeneration
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React (or Vue/Svelte - TBD)
- **State**: Zustand or Context API
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **Hosting**: Vercel/Netlify (frontend) + Railway/Render (backend)
- **Database**: Supabase
- **Monitoring**: Sentry
- **Analytics**: Plausible/Umami

## Success Metrics

### Phase 1-3 (MVP)
- Players can register and login
- Complete combat loop works
- Character progression functional
- Items can be equipped
- Mana regenerates every 6 hours

### Phase 4-5 
- Admin can manage content
- Game is stable under load
- No critical bugs
- Documentation complete

### Phase 6+
- Players can interact
- PvP system balanced
- Market economy emerging
- Towns forming

## Risk Mitigation

### Technical Risks
- **Database performance**: Index optimization, caching layer
- **Scaling issues**: Horizontal scaling plan, CDN usage
- **Security vulnerabilities**: Regular audits, rate limiting

### Game Design Risks  
- **Balance issues**: Admin tools for quick adjustments
- **Exploit prevention**: Server-side validation for everything
- **Player retention**: Analytics to track engagement

## Development Principles

1. **API-First**: Every action through API
2. **Mobile-First**: Responsive design priority
3. **No Backwards Compatibility**: Clean, forward-looking code
4. **Data-Driven**: Use wiki data as source of truth
5. **Configurable**: Key values in config, not hardcoded
6. **Testable**: Comprehensive test coverage
7. **Secure**: Server-side validation, RLS policies

## Next Steps

1. Set up development environment
2. Initialize Supabase project
3. Create API boilerplate
4. Import initial game data
5. Implement authentication
6. Build first API endpoint (GET /api/players/me)
7. Create basic UI shell

## Timeline Summary

- **Weeks 1-3**: Foundation + Core API
- **Weeks 3-4**: Web Interface  
- **Weeks 4-5**: Admin Tools
- **Weeks 5-6**: Polish & Testing
- **Week 6+**: Social Features
- **Future**: Advanced Systems

**Total MVP Timeline**: 6 weeks for full single-player experience

## Questions to Resolve

1. Frontend framework choice (React vs Vue vs Svelte)
2. Hosting platform selection
3. Payment processing for future premium features
4. Community features (forum, Discord integration)
5. Mobile app strategy (PWA vs native)