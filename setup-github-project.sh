#!/bin/bash

# GitHub Project Setup Script for MarcoLand Revival
# This script will create the repository, labels, milestones, and initial issues

echo "🎮 Setting up MarcoLand Revival GitHub Project..."

# Create the repository
echo "📦 Creating repository..."
gh repo create marcoland-revival \
  --public \
  --description "Modern recreation of the MarcoLand browser MMORPG (2006-2008)" \
  --homepage "https://github.com/yourusername/marcoland-revival" \
  --add-readme \
  --clone

# Set up git remote if not already done
git remote add origin https://github.com/$(gh api user --jq .login)/marcoland-revival.git 2>/dev/null || true
git branch -M main

# Push existing code
echo "📤 Pushing code to repository..."
git push -u origin main

# Create labels
echo "🏷️ Creating labels..."

# Phase labels
gh label create "phase-1-foundation" --description "Foundation & Setup" --color "0E8A16"
gh label create "phase-2-core-api" --description "Core API Development" --color "1D76DB"
gh label create "phase-3-web-ui" --description "Web Interface" --color "5319E7"
gh label create "phase-4-admin" --description "Admin Tools" --color "B60205"
gh label create "phase-5-polish" --description "Polish & Testing" --color "FBCA04"
gh label create "phase-6-social" --description "Social Features" --color "E99695"
gh label create "phase-7-advanced" --description "Advanced Systems" --color "C5DEF5"

# Type labels
gh label create "feature" --description "New functionality" --color "A2EEEF"
gh label create "bug" --description "Something isn't working" --color "D73A4A"
gh label create "enhancement" --description "Improvement to existing feature" --color "A8E6CF"
gh label create "documentation" --description "Documentation updates" --color "0075CA"
gh label create "testing" --description "Test coverage" --color "FFD93D"
gh label create "infrastructure" --description "DevOps and setup" --color "C2E0C6"

# Priority labels
gh label create "priority-critical" --description "Blocks progress" --color "B60205"
gh label create "priority-high" --description "Important for phase" --color "D93F0B"
gh label create "priority-medium" --description "Should do" --color "FBCA04"
gh label create "priority-low" --description "Nice to have" --color "C5DEF5"

# Component labels
gh label create "api" --description "Backend API" --color "1D76DB"
gh label create "ui" --description "Frontend interface" --color "5319E7"
gh label create "database" --description "Database/schema" --color "0E8A16"
gh label create "auth" --description "Authentication system" --color "D4C5F9"
gh label create "combat" --description "Battle system" --color "F9D0C4"
gh label create "inventory" --description "Items/equipment" --color "FEF2C0"
gh label create "economy" --description "Shop/trading" --color "BFD4F2"
gh label create "admin" --description "Admin tools" --color "C2E0C6"

echo "📅 Creating milestones..."

# Create milestones
gh api repos/$(gh api user --jq .login)/marcoland-revival/milestones \
  --method POST \
  --field title="MVP - Single Player" \
  --field description="Complete single-player gameplay loop (Phases 1-3)" \
  --field due_on="$(date -d '+6 weeks' --iso-8601)T23:59:59Z"

gh api repos/$(gh api user --jq .login)/marcoland-revival/milestones \
  --method POST \
  --field title="Alpha - Admin Tools" \
  --field description="Admin panel and content management (Phase 4)" \
  --field due_on="$(date -d '+8 weeks' --iso-8601)T23:59:59Z"

gh api repos/$(gh api user --jq .login)/marcoland-revival/milestones \
  --method POST \
  --field title="Beta - Multiplayer" \
  --field description="Basic social features (Phase 6)" \
  --field due_on="$(date -d '+10 weeks' --iso-8601)T23:59:59Z"

gh api repos/$(gh api user --jq .login)/marcoland-revival/milestones \
  --method POST \
  --field title="1.0 Release" \
  --field description="Polished and complete experience" \
  --field due_on="$(date -d '+12 weeks' --iso-8601)T23:59:59Z"

echo "📝 Creating Phase 1 issues..."

# Phase 1.1: Authentication System
gh issue create \
  --title "[FEATURE] Set up Supabase Auth with email/password" \
  --body "Implement basic authentication using Supabase Auth service with email/password support" \
  --label "phase-1-foundation,auth,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Google OAuth integration" \
  --body "Add Google social login option to authentication" \
  --label "phase-1-foundation,auth,priority-high,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Discord OAuth integration" \
  --body "Add Discord social login option to authentication" \
  --label "phase-1-foundation,auth,priority-high,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Session management system" \
  --body "Implement secure session handling and persistence" \
  --label "phase-1-foundation,auth,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] API authentication middleware" \
  --body "Create middleware to protect API endpoints" \
  --label "phase-1-foundation,auth,api,priority-critical,feature" \
  --milestone "MVP - Single Player"

# Phase 1.2: Database Setup
gh issue create \
  --title "[FEATURE] Run schema.sql in Supabase" \
  --body "Execute the main database schema setup" \
  --label "phase-1-foundation,database,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Run api-functions.sql" \
  --body "Set up PostgreSQL functions for game logic" \
  --label "phase-1-foundation,database,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Create migration system" \
  --body "Set up database migration tooling for future updates" \
  --label "phase-1-foundation,database,infrastructure,priority-high,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Configure RLS policies" \
  --body "Set up Row Level Security policies for all tables" \
  --label "phase-1-foundation,database,auth,priority-critical,feature" \
  --milestone "MVP - Single Player"

# Phase 1.3: Data Import
gh issue create \
  --title "[FEATURE] Parse and import weapons from wiki" \
  --body "Extract 50+ weapons from wiki data and seed database" \
  --label "phase-1-foundation,database,priority-high,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Parse and import armor from wiki" \
  --body "Extract armor pieces from wiki data and seed database" \
  --label "phase-1-foundation,database,priority-high,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Parse and import monsters from wiki" \
  --body "Extract 30+ monsters from wiki data with stats" \
  --label "phase-1-foundation,database,priority-high,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Create database seeder scripts" \
  --body "Build reusable scripts for database population" \
  --label "phase-1-foundation,database,infrastructure,priority-high,feature" \
  --milestone "MVP - Single Player"

# Phase 1.4: Configuration System
gh issue create \
  --title "[FEATURE] Environment-based configuration" \
  --body "Set up config system for different environments" \
  --label "phase-1-foundation,infrastructure,priority-high,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Configurable mana regeneration timer" \
  --body "Implement 6-hour mana regeneration (configurable)" \
  --label "phase-1-foundation,api,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Game constants file" \
  --body "Create centralized constants for game mechanics" \
  --label "phase-1-foundation,priority-medium,feature" \
  --milestone "MVP - Single Player"

echo "📝 Creating Phase 2 Core API issues..."

# Phase 2.1: Player Management
gh issue create \
  --title "[API] POST /api/auth/register - Character creation" \
  --body "Create character automatically on registration" \
  --label "phase-2-core-api,api,auth,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[API] GET /api/players/me - Get own profile" \
  --body "Endpoint to retrieve current player's data" \
  --label "phase-2-core-api,api,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[API] PUT /api/players/me - Update profile" \
  --body "Allow players to update their display name" \
  --label "phase-2-core-api,api,priority-medium,feature" \
  --milestone "MVP - Single Player"

# Phase 2.2: Combat System
gh issue create \
  --title "[API] GET /api/beach/monsters - List monsters" \
  --body "Return available monsters based on player level" \
  --label "phase-2-core-api,api,combat,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[API] POST /api/beach/fight - Execute combat" \
  --body "Implement combat with damage calculations (1 or 5 mana)" \
  --label "phase-2-core-api,api,combat,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Combat damage calculations" \
  --body "Implement damage formulas from wiki documentation" \
  --label "phase-2-core-api,combat,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Death and revival system" \
  --body "Handle player death and gem-based revival" \
  --label "phase-2-core-api,combat,priority-high,feature" \
  --milestone "MVP - Single Player"

# Phase 2.3: Character Progression
gh issue create \
  --title "[API] POST /api/temple/pray - Stat training" \
  --body "Spend mana for random stat points with diminishing returns" \
  --label "phase-2-core-api,api,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Level up system" \
  --body "Automatic HP/Mana increases on level up" \
  --label "phase-2-core-api,priority-critical,feature" \
  --milestone "MVP - Single Player"

# Phase 2.4: Inventory System
gh issue create \
  --title "[API] GET /api/inventory - List items" \
  --body "Return player's inventory with item details" \
  --label "phase-2-core-api,api,inventory,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[API] POST /api/inventory/equip - Equip item" \
  --body "Equip item with requirement validation" \
  --label "phase-2-core-api,api,inventory,priority-critical,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[FEATURE] Encumbrance calculations" \
  --body "Implement speed penalties from equipment weight" \
  --label "phase-2-core-api,inventory,combat,priority-high,feature" \
  --milestone "MVP - Single Player"

# Phase 2.5: Economy
gh issue create \
  --title "[API] GET /api/shop - List shop items" \
  --body "Return available items for purchase" \
  --label "phase-2-core-api,api,economy,priority-high,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[API] POST /api/shop/buy - Purchase item" \
  --body "Buy items with gold/currency validation" \
  --label "phase-2-core-api,api,economy,priority-high,feature" \
  --milestone "MVP - Single Player"

gh issue create \
  --title "[API] POST /api/forge/upgrade - Forge equipment" \
  --body "Upgrade equipment using metals and gold" \
  --label "phase-2-core-api,api,economy,priority-medium,feature" \
  --milestone "MVP - Single Player"

echo "🚀 Creating GitHub Project..."

# Create the project board
gh project create \
  --owner $(gh api user --jq .login) \
  --title "MarcoLand Revival Development" \
  --body "Development tracking for MarcoLand MMORPG recreation. See DEVELOPMENT_PLAN.md for details."

echo "✅ Setup complete!"
echo ""
echo "📊 Your GitHub project has been created with:"
echo "  - Repository: marcoland-revival"
echo "  - 30+ labels for organization"
echo "  - 4 milestones with due dates"
echo "  - 30+ initial issues for Phases 1-2"
echo ""
echo "🔗 Visit your repo: https://github.com/$(gh api user --jq .login)/marcoland-revival"
echo ""
echo "📋 Next steps:"
echo "  1. Go to the Projects tab in your repo"
echo "  2. Set up the board columns (Backlog, Ready, In Progress, Review, Done)"
echo "  3. Add issues to the project board"
echo "  4. Configure automation rules"