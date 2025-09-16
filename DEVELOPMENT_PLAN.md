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

#### 2.5 NPC Shops (Authentic City Structure)
**ARCHITECTURE CORRECTION**: Replace unified equipment shop with separate NPC stores matching original game

- [ ] **REFACTOR**: Split `/api/equipment/shop` into separate NPC shop endpoints:
  - [ ] GET /api/blacksmith - Weapons only ("Buy Your Weapons Here")
  - [ ] POST /api/blacksmith/purchase - Buy weapon with gold validation
  - [ ] GET /api/armourer - Armor only ("Buy Your Armours Here") 
  - [ ] POST /api/armourer/purchase - Buy armor with gold validation
  - [ ] GET /api/gems-store - 30 daily gems at 90g each
  - [ ] POST /api/gems-store/purchase - Buy up to 30 gems daily
  - [ ] GET /api/metals-store - 30 daily metals at 90g each  
  - [ ] POST /api/metals-store/purchase - Buy up to 30 metals daily
  - [ ] GET /api/food-shop - Food items with pricing
  - [ ] POST /api/food-shop/purchase - Buy food items
- [x] POST /api/equipment/sell - Sell equipment back to NPC shops (50% rate)
- [x] Complete buy/sell economic cycle with atomic operations

#### 2.6 Player Market & Trading
- [ ] GET /api/market - Browse all player listings (gems, armor, weapons, food)
- [ ] POST /api/market/list - List item for sale to other players
- [ ] POST /api/market/purchase - Buy from player listings  
- [ ] DELETE /api/market/cancel - Cancel own listing
- [ ] GET /api/auction-house - Special auction system
- [ ] POST /api/auction-house/bid - Bid on auctions
- [ ] Market price history and trend analysis

#### 2.7 Resource Management
- [x] Mana regeneration system (every 6 hours)
- [x] HP regeneration on level up
- [x] Healing with gold/gems
- [x] Resource scheduling/cron jobs
- [ ] GET /api/resources/vote - Daily voting interface
- [ ] POST /api/resources/vote - Submit daily vote (500-1000g + rare mana reload)
- [ ] GET /api/resources/mana-tree - Tall Tree of Mana interface
- [ ] POST /api/resources/mana-tree/purchase - Buy mana with 100 gems (daily limit)

#### 2.8 PvP Mana System
- [ ] PvP mana pool separate from regular mana (5-50 capacity)
- [ ] PvP mana expansion (+0.2 per 2 kills within level range)
- [ ] PvP mana reduction (-0.2 per death)
- [ ] Daily PvP mana regeneration
- [ ] GET /api/pvp/targets - Find viable PvP targets within level range
- [ ] POST /api/pvp/attack - Attack player using PvP or regular mana
- [ ] PvP combat with intelligence multiplier and speed mechanics

#### 2.9 Skills System
- [ ] GET /api/skills - List available skills and current progress
- [ ] POST /api/skills/purchase - Buy skills (gems finding: 20,000g)
- [ ] POST /api/skills/activate - Daily skill activation (gems finding: 5 mana)
- [ ] Gems finding progression (+2% success/day, -1% per missed day)
- [ ] Master forging system (150,000g entry, 100+ day training)
- [ ] Adept recruitment and management system

#### 2.10 Creature System
- [ ] GET /api/creatures/market - Creature marketplace with dynamic pricing
- [ ] POST /api/creatures/purchase - Buy creature (level + wealth based pricing)
- [ ] GET /api/creatures/mine - View owned creature stats and development
- [ ] POST /api/creatures/train - Fight other creatures for experience
- [ ] POST /api/creatures/allocate - Distribute stat points (bite/kick/punch/hp)
- [ ] GET /api/spells/summoning - List available summoning spells
- [ ] POST /api/creatures/summon - Summon creature for PvP (100+ INT, MPs required)
- [ ] Creature vs player combat with metal stealing mechanics

#### 2.11 Dungeon System
- [ ] GET /api/dungeon/enter - Enter dungeon (1 mana cost)
- [ ] GET /api/dungeon/map - Current dungeon map and position
- [ ] POST /api/dungeon/move - Navigate through dungeon
- [ ] GET /api/dungeon/search - Search current square for treasure
- [ ] POST /api/dungeon/fight - Combat with dungeon monsters
- [ ] POST /api/dungeon/checkpoint - Set checkpoint (100 metals)
- [ ] POST /api/dungeon/recall - Teleport to checkpoint (MP cost)
- [ ] Grand prize system with dungeon resets

#### 2.12 Social Infrastructure
- [ ] GET /api/social/buddy-list - Manage friend list with descriptions
- [ ] POST /api/social/buddy/add - Add player to buddy list
- [ ] GET /api/social/blacklist - PvP target management system
- [ ] POST /api/social/blacklist/add - Add player to blacklist with notes
- [ ] GET /api/social/blacklist/targets - Find alive targets for PvP
- [ ] POST /api/social/message - Direct messaging system
- [ ] GET /api/social/chat - Global chat system
- [ ] User customization (colors, links, number formatting)

#### 2.13 Rule Enforcement System
- [ ] Admin jail system with variable sentence lengths
- [ ] Multiple account detection and prevention
- [ ] Funds transfer detection and blocking
- [ ] Automation/scripting detection
- [ ] Player reporting system
- [ ] Administrative investigation tools
- [ ] Appeal system for rule violations

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

#### 3.6 Authentic City Structure
**REFACTOR REQUIRED**: Update city navigation to match original MarcoLand

- [ ] **Separate NPC Shops**:
  - [ ] Blacksmith interface (weapons only, matching original)
  - [ ] Armourer interface (armor only, matching original)  
  - [ ] Gems store (30 daily limit, "BUY 30 GEMS DAILY")
  - [ ] Metals store (30 daily limit, "BUY 30 METALS DAILY")
  - [ ] Food shop with pricing
  - [ ] Spell Shop (free spells, "Buy Immunity at level 5 here")

- [ ] **Player Market & Trading**:
  - [ ] Market interface ("Sell Your Gems, Armours, Weapons, Food here")
  - [ ] Auction House for special player auctions
  - [ ] Price comparison and market efficiency tools
  - [ ] Transaction history and profit tracking

- [ ] **Resource Locations**:
  - [ ] Daily voting interface with rewards ("Vote here! DO IT")
  - [ ] Tall Tree of Mana ("Buy 1 Daily Mana here, DO IT")
  - [ ] Monk's Alley (MP purchases)

#### 3.7 Skills & Progression
- [ ] Skills overview with purchase options
- [ ] Daily skill activation interface
- [ ] Gems finding progress tracking
- [ ] Master forging interface with adept management
- [ ] Forging workshop with material requirements

#### 3.8 PvP Interface
- [ ] Target finder with level range filtering
- [ ] Blacklist management with sortable columns
- [ ] PvP combat logs with detailed results
- [ ] PvP mana tracking and expansion progress
- [ ] Attack history and win/loss ratios

#### 3.9 Creature Management
- [ ] Creature marketplace with dynamic pricing
- [ ] Creature development interface
- [ ] Stat allocation system
- [ ] Creature vs creature training
- [ ] Summoning interface with spell requirements

#### 3.10 Dungeon Explorer
- [ ] Dungeon entry with cost confirmation
- [ ] Interactive dungeon map
- [ ] Treasure discovery interface
- [ ] Checkpoint management system
- [ ] Combat encounters with no-heal mechanics

#### 3.11 Social Features
- [ ] Buddy list with online status
- [ ] Blacklist with target management
- [ ] Global chat interface
- [ ] Direct messaging system
- [ ] User customization options

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

#### 4.3 Player Management & Rule Enforcement
- [ ] View player profiles with complete activity history
- [ ] Modify player resources (for support/corrections)
- [ ] Jail system with variable sentence management
- [ ] Multiple account detection and linking
- [ ] Funds transfer violation tracking
- [ ] Automation detection algorithms
- [ ] Player reporting review system
- [ ] Ban/unban functionality with appeal process
- [ ] Activity logs and behavioral analysis

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

### Phase 6: Social Features & Complex Systems (Week 6-8)
**Goal**: Complete multiplayer interaction systems

#### 6.1 Towns (Guild System)
- [ ] Create/join town with application process
- [ ] Town roster with member roles
- [ ] Town chat and messaging
- [ ] Advanced permissions (president/vice-president/officers/members)
- [ ] Town armory with equipment sharing
- [ ] Town healer with gem-free revival
- [ ] Leave town with cooldown periods

#### 6.2 Advanced PvP System  
- [ ] PvP mana system (5-50 capacity with expansion mechanics)
- [ ] Level-range based targeting (60% rule)
- [ ] Attack calculations with intelligence multiplier
- [ ] Detailed battle logs with damage breakdowns
- [ ] Target acquisition tools (Sum-It-All integration)
- [ ] Best of Marcoland ranking system
- [ ] Immunity spell system (10-minute protection)

#### 6.3 Player Marketplace
- [ ] List items for sale with dynamic pricing
- [ ] Browse listings with advanced filters
- [ ] Purchase from players with transaction security
- [ ] Market manipulation detection
- [ ] Price history and trend analysis
- [ ] Bundle size optimization (metals/gems)
- [ ] Market efficiency algorithms

#### 6.4 Creature Combat System
- [ ] Creature summoning for PvP metal farming
- [ ] Summon spell tiers with stat multipliers
- [ ] Safe target calculation (guaranteed kills)
- [ ] Metal stealing mechanics
- [ ] Creature vs creature training matches
- [ ] Advanced creature development strategies

#### 6.5 Complete Social Infrastructure
- [ ] Buddy list with online tracking and notes
- [ ] Blacklist system with PvP target management
- [ ] Global chat with learning community features
- [ ] Direct messaging with notification system
- [ ] User customization (colors, layouts, user links)
- [ ] Daily routine automation tools

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

### Phase 3-4 (UI & Admin Tools)
- All core systems have functional web interfaces
- Daily trading routines possible (metals/gems arbitrage)
- PvP mana system operational with target management
- Skills system (gems finding) functional with progression tracking
- Admin tools support rule enforcement and content management

### Phase 5 (Polish & Testing)
- Game stable under concurrent user load
- All economic systems balanced (trading profits, forging costs, creature pricing)
- Anti-cheat systems operational (multi-account, automation detection)
- Comprehensive test coverage for all game mechanics
- No critical gameplay blocking bugs

### Phase 6+ (Complete Systems)
- Players can execute optimal daily routines through UI
- PvP ecosystem supports efficient target acquisition and blacklist management
- Creature system enables endgame metal farming strategies
- Market systems support advanced trading strategies
- Towns provide equipment sharing and social coordination
- Rule enforcement maintains fair competitive environment
- All interconnected systems enable complex strategic gameplay

## Risk Mitigation

### Technical Risks
- **Database performance**: Index optimization, caching layer
- **Scaling issues**: Horizontal scaling plan, CDN usage
- **Security vulnerabilities**: Regular audits, rate limiting

### Game Design Risks  
- **Economic Exploits**: Server-side validation for all trading, market price limits
- **PvP Abuse**: Level range enforcement, PvP mana caps, attack frequency limits
- **Multi-accounting**: IP tracking, behavioral analysis, automated detection
- **Automation/Botting**: Pattern recognition, timing analysis, admin investigation tools
- **Market Manipulation**: Price change limits, transaction volume monitoring
- **Balance Issues**: Admin tools for real-time adjustments, extensive playtesting
- **Player Retention**: Complex interconnected systems create deep engagement

## Development Principles

1. **API-First**: Every action through API, browser second
2. **No Backwards Compatibility**: Clean, forward-looking code
3. **Data-Driven**: Use wiki data as source of truth
4. **Configurable**: Key values in config, not hardcoded
5. **Testable**: Comprehensive test coverage
6. **Secure**: Server-side validation, RLS policies

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

### ⚠️ **Architecture Correction Needed (2025-09-15)**
**Issue Identified**: Current unified `/api/equipment/shop` doesn't match original MarcoLand city structure

**Problem**: 
- We have one equipment endpoint for all items
- Original game had separate NPC shops: Blacksmith (weapons), Armourer (armor), Gems store, Metals store, Food shop
- Player Market was separate from NPC shops

**Required Changes**:
1. **Refactor Equipment System**: Split unified shop into separate NPC store endpoints
2. **Update City UI**: Implement authentic city navigation matching original locations  
3. **Implement Player Market**: Separate system for player-to-player trading
4. **Add Daily Limits**: Gems/Metals stores with 30 daily purchase limits

**Impact**: Moderate - requires API refactoring but improves authenticity and user experience

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

- **Weeks 1-3**: Foundation + Core API (COMPLETE ✅)
- **Weeks 4-5**: Extended API (Markets, PvP Mana, Skills, Creatures, Dungeon)
- **Weeks 6-7**: Complete Web Interface (All Systems)
- **Weeks 8-9**: Admin Tools + Rule Enforcement
- **Weeks 10-11**: Polish, Testing & Performance
- **Weeks 12+**: Social Features & Complex Systems

**Revised MVP Timeline**: 11 weeks for complete single-player experience with all systems
**Full Multiplayer**: 15+ weeks for complete MarcoLand recreation

## System Complexity Considerations

The comprehensive MarcoLand guide revealed significantly more complex interconnected systems than initially estimated:

### Core Interdependencies
- **Daily Trading** requires both NPC stores and player markets
- **PvP Optimization** needs blacklist management, target finding, and mana tracking
- **Economic Success** depends on gems finding skill, market manipulation, and creature farming
- **Creature System** requires summoning spells, PvP integration, and complex damage calculations
- **Social Features** are essential for town equipment sharing and target acquisition

### Development Impact
- **API Complexity**: 12 major system areas instead of 6
- **Database Requirements**: Additional tables for creatures, dungeons, social features, rule enforcement
- **UI Scope**: 11 interface areas instead of 6 basic screens
- **Testing Requirements**: Complex integration testing for interconnected systems
- **Admin Tools**: Sophisticated rule enforcement and economic monitoring needed

## Questions to Resolve

1. Frontend framework choice (React vs Vue vs Svelte)
2. Hosting platform selection
3. Payment processing for future premium features
4. Community features (forum, Discord integration)
5. Mobile app strategy (PWA vs native)