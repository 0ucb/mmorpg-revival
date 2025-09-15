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
- [x] Supabase Auth setup with email/password
- [x] Google OAuth integration  
- [x] Discord OAuth integration
- [x] Session management
- [x] API authentication middleware
- [x] Protected route handling

#### 1.2 Database Setup
- [x] Run schema.sql in Supabase
- [x] Run api-functions.sql
- [x] Create migration system for future updates
- [x] Set up RLS policies properly

#### 1.3 Data Import
- [x] Parse weapons from wiki data
- [x] Parse armor from wiki data
- [x] Parse monsters from wiki data
- [x] Create database seeder scripts
- [x] Verify data integrity

#### 1.4 Configuration System
- [x] Environment-based config
- [x] Mana regeneration timer (6 hours, configurable)
- [x] Game constants file
- [x] Feature flags for gradual rollout

### Phase 2: Core API (Week 2-3)
**Goal**: RESTful API for all single-player actions

#### 2.1 Player Management
- [x] POST /api/auth/register - Create character on registration
- [x] GET /api/players/me - Get own profile
- [x] PUT /api/players/me - Update display name
- [x] GET /api/players/me/stats - Get detailed stats

#### 2.2 Combat System
- [x] GET /api/beach/monsters - List available monsters
- [x] POST /api/beach/fight - Execute combat (1 mana)
- [x] Combat damage calculations with equipment integration
- [x] Experience and gold rewards
- [x] Death/revival system

#### 2.3 Character Progression  
- [x] POST /api/temple/pray - Spend mana for stats
- [x] Implement stat caps and diminishing returns
- [x] Level up calculations
- [x] Automatic HP/Mana increases

#### 2.4 Equipment System
- [x] GET /api/equipment/inventory - List equipped/unequipped items
- [x] POST /api/equipment/slot/:slot - Equip/unequip items
- [x] GET /api/equipment/shop - Browse available equipment
- [x] POST /api/equipment/purchase - Buy equipment with gold
- [x] Encumbrance calculations with speed modifiers
- [x] Equipment requirements validation
- [x] Combat integration (weapon damage, armor protection)

#### 2.5 Economy
- [x] GET /api/equipment/shop - List available items (integrated with equipment system)
- [x] POST /api/equipment/purchase - Purchase equipment with gold validation
- [x] POST /api/equipment/sell - Sell equipment back to shop (50% sell-back rate)
- [x] Complete buy/sell economic cycle with atomic operations
- [ ] GET /api/forge - List forgeable items
- [ ] POST /api/forge/upgrade - Forge equipment

#### 2.6 Resource Management
- [x] Mana regeneration system (every 6 hours)
- [x] HP regeneration on level up
- [x] Healing with gold/gems
- [x] Resource scheduling/cron jobs

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
- [x] Unit tests for combat formulas
- [x] API endpoint testing (44 passing tests)
- [x] Integration tests for game loops
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

### Phase 1-2 (Core API - COMPLETE ✅)
- [x] Players can register and login
- [x] Complete combat loop works with equipment integration
- [x] Character progression functional (temple prayers)
- [x] Equipment system functional (51 weapons + 56 armor)
- [x] Complete economy system with buy/sell cycle
- [x] Mana regenerates every 6 hours
- [x] Authentic MarcoLand mechanics implemented
- [x] Comprehensive test coverage (44 passing tests)

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

## Recent Progress Updates

### ✅ Equipment Economy System Completed (2025-09-14)
**Major Milestone**: Complete buy/sell economic cycle implemented

**Features Added**:
- `sell_equipment()` database function with atomic operations
- `POST /api/equipment/sell` API endpoint 
- Comprehensive selling functionality tests (24 new test cases)
- 50% sell-back rate with minimum 1 gold pricing
- Complete economic cycle: Buy → Equip → Use → Unequip → Sell
- Updated API documentation

**Technical Details**:
- Database function prevents selling equipped items
- Row-level locking ensures atomic transactions
- Comprehensive error handling and validation
- Backwards compatible with existing equipment system
- Economic balance verified (~50% loss per cycle creates gold sink)

**Status**: Production ready with 44 passing tests

---

## Next Steps

**Current Priority**: Phase 3 - Web Interface Development

1. ✅ Complete core API functionality 
2. ✅ Implement equipment system with economy
3. **→ Build web UI for single-player game**
4. Create admin tools for content management
5. Polish and performance optimization
6. Add social features (towns, PvP, market)

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