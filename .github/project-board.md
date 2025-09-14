# GitHub Project Board Structure

## Recommended Setup

### 1. Create GitHub Repository
```bash
# If you haven't already
gh repo create marcoland-revival --public --description "Modern recreation of the MarcoLand browser MMORPG"

# Push existing code
git remote add origin https://github.com/YOUR_USERNAME/marcoland-revival.git
git branch -M main
git push -u origin main
```

### 2. Create Project Board

Go to your repository → Projects → New Project → Board view

### 3. Columns Structure

1. **📋 Backlog** - All future tasks
2. **🎯 Phase Planning** - Current phase planning
3. **🚀 Ready** - Ready to start
4. **🔨 In Progress** - Active development
5. **👀 Review** - In PR/testing
6. **✅ Done** - Completed

### 4. Labels to Create

#### Phase Labels
- `phase-1-foundation`
- `phase-2-core-api`
- `phase-3-web-ui`
- `phase-4-admin`
- `phase-5-polish`
- `phase-6-social`
- `phase-7-advanced`

#### Type Labels
- `feature` - New functionality
- `bug` - Something broken
- `enhancement` - Improvement
- `documentation` - Docs updates
- `testing` - Test coverage
- `infrastructure` - DevOps/setup

#### Priority Labels
- `priority-critical` - Blocks progress
- `priority-high` - Important for phase
- `priority-medium` - Should do
- `priority-low` - Nice to have

#### Component Labels
- `api` - Backend API
- `ui` - Frontend
- `database` - DB/schema
- `auth` - Authentication
- `combat` - Battle system
- `inventory` - Items/equipment
- `economy` - Shop/trading
- `admin` - Admin tools

### 5. Milestones

Create these milestones with due dates:

1. **MVP - Single Player** (Week 6)
   - Complete single-player loop
   - All Phase 1-3 tasks

2. **Alpha - Admin Tools** (Week 8)
   - Admin panel complete
   - Phase 4 tasks

3. **Beta - Multiplayer** (Week 10)
   - Basic social features
   - Phase 6 tasks

4. **1.0 Release** (Week 12+)
   - Polished experience
   - Phase 5 complete

### 6. Initial Issues to Create

Copy from DEVELOPMENT_PLAN.md Phase 1-2 items as individual issues.

#### Example Issues:

**[FEATURE] Implement Supabase Authentication**
- Labels: `phase-1-foundation`, `auth`, `priority-critical`
- Milestone: MVP - Single Player
- Description: Set up Supabase auth with email/password

**[FEATURE] Google OAuth Integration**
- Labels: `phase-1-foundation`, `auth`, `priority-high`  
- Milestone: MVP - Single Player
- Description: Add Google social login

**[FEATURE] Database Schema Migration**
- Labels: `phase-1-foundation`, `database`, `priority-critical`
- Milestone: MVP - Single Player
- Description: Run schema.sql and api-functions.sql

**[FEATURE] Import Weapons from Wiki**
- Labels: `phase-1-foundation`, `database`, `priority-high`
- Milestone: MVP - Single Player
- Description: Parse and import 50+ weapons

**[FEATURE] Beach Combat API**
- Labels: `phase-2-core-api`, `api`, `combat`, `priority-critical`
- Milestone: MVP - Single Player
- Description: POST /api/beach/fight endpoint

### 7. Automation Rules

Set up these automations in Project settings:

- When PR merged → Move to Done
- When issue closed → Move to Done  
- When PR opened → Move to Review
- When assigned → Move to In Progress

### 8. Project Views

Create additional views:

1. **Roadmap View** (Timeline)
   - Group by Milestone
   - Sort by Priority

2. **Sprint View** (Board)
   - Filter current milestone only
   - Group by Status

3. **Component View** (Table)
   - Group by Component label
   - Sort by Phase

## Quick Start Commands

```bash
# Create all Phase 1 issues at once
gh issue create --title "[FEATURE] Supabase Auth Setup" --label "phase-1-foundation,auth,priority-critical" --milestone "MVP - Single Player"
gh issue create --title "[FEATURE] Google OAuth" --label "phase-1-foundation,auth,priority-high" --milestone "MVP - Single Player"
gh issue create --title "[FEATURE] Discord OAuth" --label "phase-1-foundation,auth,priority-medium" --milestone "MVP - Single Player"
# ... etc

# Create project
gh project create --title "MarcoLand Revival" --body "Development tracking for MarcoLand MMORPG recreation"

# Link issues to project
gh project item-add PROJECT_NUMBER --issue ISSUE_NUMBER
```

## Development Workflow

1. Pick issue from Ready column
2. Move to In Progress
3. Create feature branch: `git checkout -b feature/issue-number-description`
4. Develop feature
5. Push and create PR
6. Link PR to issue: "Closes #123"
7. Move to Review
8. After merge, auto-moves to Done

## Weekly Planning

Every Monday:
1. Review Done column from last week
2. Move next phase items to Ready
3. Assign issues for the week
4. Update milestone progress

## Tracking Metrics

- Velocity: Issues completed per week
- Burndown: Remaining issues in milestone
- Cycle time: In Progress → Done duration
- Phase progress: % complete per phase