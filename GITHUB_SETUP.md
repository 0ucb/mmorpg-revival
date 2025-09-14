# GitHub Project Setup Guide

Since the GitHub CLI isn't available, here are the manual steps to set up your project on GitHub:

## 1. Create Repository

1. Go to https://github.com/new
2. Repository name: `marcoland-revival`
3. Description: `Modern recreation of the MarcoLand browser MMORPG (2006-2008)`
4. Set to **Public**
5. Click "Create repository"

## 2. Push Your Code

Run these commands in your terminal:

```bash
cd mmorpg-revival
git remote add origin https://github.com/YOUR_USERNAME/marcoland-revival.git
git branch -M main
git push -u origin main
```

## 3. Create Labels

Go to: `https://github.com/YOUR_USERNAME/marcoland-revival/labels`

Click "New label" for each:

### Phase Labels (Green shades)
- `phase-1-foundation` - #0E8A16
- `phase-2-core-api` - #1D76DB  
- `phase-3-web-ui` - #5319E7
- `phase-4-admin` - #B60205
- `phase-5-polish` - #FBCA04
- `phase-6-social` - #E99695
- `phase-7-advanced` - #C5DEF5

### Priority Labels
- `priority-critical` - #B60205 (Red)
- `priority-high` - #D93F0B (Orange)
- `priority-medium` - #FBCA04 (Yellow)
- `priority-low` - #C5DEF5 (Light Blue)

### Component Labels
- `api` - #1D76DB
- `ui` - #5319E7
- `database` - #0E8A16
- `auth` - #D4C5F9
- `combat` - #F9D0C4
- `inventory` - #FEF2C0
- `economy` - #BFD4F2
- `admin` - #C2E0C6

## 4. Create Milestones

Go to: `https://github.com/YOUR_USERNAME/marcoland-revival/milestones`

Create these milestones:

1. **MVP - Single Player**
   - Due date: 6 weeks from today
   - Description: Complete single-player gameplay loop (Phases 1-3)

2. **Alpha - Admin Tools**
   - Due date: 8 weeks from today
   - Description: Admin panel and content management (Phase 4)

3. **Beta - Multiplayer**
   - Due date: 10 weeks from today
   - Description: Basic social features (Phase 6)

4. **1.0 Release**
   - Due date: 12 weeks from today
   - Description: Polished and complete experience

## 5. Create Initial Issues

Go to: `https://github.com/YOUR_USERNAME/marcoland-revival/issues`

### Phase 1.1: Authentication System

**Issue #1: Set up Supabase Auth with email/password**
- Labels: `phase-1-foundation`, `auth`, `priority-critical`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Implement basic authentication using Supabase Auth service with email/password support

Acceptance Criteria:
- [ ] Users can register with email/password
- [ ] Users can login with existing credentials
- [ ] Sessions persist across page refreshes
- [ ] Logout functionality works
```

**Issue #2: Google OAuth integration**
- Labels: `phase-1-foundation`, `auth`, `priority-high`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Add Google social login option to authentication

Acceptance Criteria:
- [ ] Google OAuth configured in Supabase
- [ ] Login with Google button on auth pages
- [ ] New users auto-create player profile
- [ ] Existing users link to their profile
```

**Issue #3: Discord OAuth integration**
- Labels: `phase-1-foundation`, `auth`, `priority-high`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Add Discord social login option to authentication

Acceptance Criteria:
- [ ] Discord OAuth configured in Supabase
- [ ] Login with Discord button on auth pages
- [ ] New users auto-create player profile
- [ ] Existing users link to their profile
```

**Issue #4: Session management system**
- Labels: `phase-1-foundation`, `auth`, `priority-critical`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Implement secure session handling and persistence

Acceptance Criteria:
- [ ] Sessions persist across page refreshes
- [ ] Session timeout after inactivity
- [ ] Refresh tokens work properly
- [ ] Secure cookie configuration
```

**Issue #5: API authentication middleware**
- Labels: `phase-1-foundation`, `auth`, `api`, `priority-critical`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Create middleware to protect API endpoints

Acceptance Criteria:
- [ ] Middleware verifies JWT tokens
- [ ] Protected routes return 401 when unauthorized
- [ ] User context available in protected routes
- [ ] Rate limiting implemented
```

### Phase 1.2: Database Setup

**Issue #6: Run schema.sql in Supabase**
- Labels: `phase-1-foundation`, `database`, `priority-critical`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Execute the main database schema setup

Acceptance Criteria:
- [ ] All tables created successfully
- [ ] Indexes created
- [ ] Foreign keys established
- [ ] No errors during execution
```

**Issue #7: Run api-functions.sql**
- Labels: `phase-1-foundation`, `database`, `priority-critical`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Set up PostgreSQL functions for game logic

Acceptance Criteria:
- [ ] All functions created successfully
- [ ] Functions tested with sample data
- [ ] Performance acceptable
- [ ] Error handling in place
```

**Issue #8: Configure RLS policies**
- Labels: `phase-1-foundation`, `database`, `auth`, `priority-critical`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Set up Row Level Security policies for all tables

Acceptance Criteria:
- [ ] Players can only modify own data
- [ ] Public data readable by all
- [ ] Admin override policies
- [ ] No security vulnerabilities
```

### Phase 1.3: Data Import

**Issue #9: Parse and import weapons from wiki**
- Labels: `phase-1-foundation`, `database`, `priority-high`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Extract 50+ weapons from wiki data and seed database

Acceptance Criteria:
- [ ] All weapons from wiki imported
- [ ] Damage ranges accurate
- [ ] Requirements correct
- [ ] Costs match original
```

**Issue #10: Parse and import monsters from wiki**
- Labels: `phase-1-foundation`, `database`, `priority-high`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Extract 30+ monsters from wiki data with stats

Acceptance Criteria:
- [ ] All monsters imported (Goblin to Nazgul)
- [ ] HP/damage/protection accurate
- [ ] XP/gold rewards correct
- [ ] Level requirements set
```

### Phase 2: Core API

**Issue #11: POST /api/beach/fight - Execute combat**
- Labels: `phase-2-core-api`, `api`, `combat`, `priority-critical`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Implement combat with damage calculations (1 or 5 mana)

Acceptance Criteria:
- [ ] Combat uses correct damage formula
- [ ] Mana deducted properly
- [ ] XP/gold rewards given
- [ ] Death handling works
- [ ] Can batch 1 or 5 fights
```

**Issue #12: POST /api/temple/pray - Stat training**
- Labels: `phase-2-core-api`, `api`, `priority-critical`, `feature`
- Milestone: MVP - Single Player
- Body:
```
Spend mana for random stat points with diminishing returns

Acceptance Criteria:
- [ ] Stats distributed randomly (STR/SPD/INT)
- [ ] Diminishing returns at 1100/1300/1500 stats
- [ ] Can pray 5/50/all mana
- [ ] Mana deducted correctly
```

## 6. Create Project Board

1. Go to your repository
2. Click "Projects" tab
3. Click "New project"
4. Choose "Board" template
5. Name it "MarcoLand Revival Development"

### Add Columns:
1. 📋 Backlog
2. 🎯 Phase Planning  
3. 🚀 Ready
4. 🔨 In Progress
5. 👀 Review
6. ✅ Done

### Add Issues to Board:
- Drag all created issues into the Backlog column
- Move Phase 1 issues to "Phase Planning"
- Move first 2-3 issues to "Ready"

## 7. Set Up Automation

In Project settings → Workflows:

1. **Item added to project** → Set status to "Backlog"
2. **Pull request merged** → Set status to "Done"
3. **Issue closed** → Set status to "Done"
4. **Pull request opened** → Set status to "Review"

## Quick Links for Your Repo

Once created, your important links will be:
- Repo: `https://github.com/YOUR_USERNAME/marcoland-revival`
- Issues: `https://github.com/YOUR_USERNAME/marcoland-revival/issues`
- Project: `https://github.com/YOUR_USERNAME/marcoland-revival/projects/1`
- Wiki: `https://github.com/YOUR_USERNAME/marcoland-revival/wiki`

## Alternative: Use GitHub's Issue Templates

Instead of creating issues manually, you can use the templates I created:

1. Go to Settings → Features → Issues → Set up templates
2. Add the templates from `.github/ISSUE_TEMPLATES/`
3. Now "New issue" will show template options

This manual setup will give you the same result as the automated script!