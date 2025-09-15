# MarcoLand UI Documentation

## Main Layout Structure

### 3-Column Layout
- **Left Sidebar**: Links and Stats (280px width)
- **Center Content**: Main game area with news/content
- **Right Sidebar**: Game Info panel (280px width)

## Color Scheme
- **Background**: Black (#000000)
- **Borders**: Green (#33FF99, bright green)
- **Text**: White (#FFFFFF)
- **Links**: Light green (hover: dark green)
- **Accent**: Green highlights

## Typography
- **Font Family**: Verdana
- **Font Size**: 10px (base), 11px (headers)
- **Line Height**: Consistent spacing

---

## Left Sidebar: "Links and Stats"

### Player Info Header
```
dummy [verified icon]
```

### Core Stats Block
```
ID : 8168
Strength : 1.000
Speed : 1.000
Intelligence : 0.000
Magic Points : 2/2
Level : 1
Experience : 0/350
HP : 10/10
Mana : 50/50
Gold : 3000
Metals : 0
Gems : 10
```

### Navigation Menu
```
--> My Home
--> The city
--> Fighting
--> Daily Arena
--> Forum boards
--> Chat room(3)
--> Send mail
--> Buddy list
--> Blacklist
--> Player search
--> New messages(0)
--> Spells
--> Logout
```

### Server Stats
```
- Online: 17 player(s).
- Member Count: 31337
```

### Help Links
```
- FAQ
- Emoticons
- Help
- How to make money
- Rules
```

---

## Center Content: Character Stats Screen

### Welcome Message
```
Welcome dummy this is your home, where you can check your stats and customize your character.
```

### Stats Section
```
Stats

ID : 8168
Level : 1
Strength : 1.000
Speed : 1.000
Intelligence : 0.000
Magic Points : 2/2
Experience : 0/350
HP : 10/10
Arena : 1
Mana : 50/50

Encumbrance : 0/1

Gold : 2900
Metals : 0
Gems : 10
Quarzes : 0

Age : 1
Visits : 6
Last Killed : [empty]
Last Killed by : [empty]

Total Forum Posts: 0
Posts Today: 0
Max Daily Posts: 2
```

### Equipment Section
```
Equipped

Lower body : [empty]
Upper body : [empty]
Head : [empty]
Hands : [empty]
Feet : [empty]
Weapon : [empty]
```

### Fighting Stats Section
```
Fighting

vs Humans : 0/0 - 0 %
vs Creatures : 0/0 - 0 %
```

### Additional Sections
```
City-Clan
[content area]

My equipment
[link/button]

My links
[content area]
```

---

## Right Sidebar: "Game Info"

### Mana Timer
```
Next mana restore at: 00:00:00
Current time : 08:32:23
```

### Creator Info
```
Original creator :
    Repsah
```

### External Links
```
Vote for Marcoland and earn money.
MPOG Top 200
[Top 200 logo image]
```

### User Links Section
```
User Links
There are no links for this user
```

---

## UI Patterns & Components

### Stats Display Format
- **Label : Value** (with space padding)
- **Fractions**: "2/2", "0/350", "10/10" 
- **Decimals**: "1.000" (3 decimal places)
- **Percentages**: "0 %" (with space)

### Navigation Links
- **Format**: "--> Link Name"
- **Counters**: "(3)", "(0)" for notifications
- **States**: Active, hover, disabled

### Section Headers
- **Green background** with white text
- **Consistent spacing** and borders
- **Clear hierarchy**

### Empty States
- **Equipment slots**: Show slot name with empty value
- **Stats**: Show 0 or empty as appropriate
- **Lists**: "There are no links for this user"

## API Mapping to UI

### Left Sidebar Stats → API Endpoints
- Player info → `GET /api/players/me`
- Stats → `GET /api/players/me/stats`
- Mana/HP → Real-time from player stats
- Gold → Updated after purchases/sales

### Center Stats Screen → API Data
- Detailed stats → `GET /api/players/me/stats`
- Equipment → `GET /api/equipment/inventory`
- Fighting stats → Combat history data

### Navigation → API Endpoints
- Fighting → `GET /api/beach/monsters`
- Equipment → `GET /api/equipment/inventory`
- Shop/Purchase → `GET /api/equipment/shop`

---

## Equipment Interface ("My equipment")

### Equipment Slots Display
```
Lower body :
Upper body :
Head :
Hands :
Feet :
Weapon :
```
*All slots currently empty*

### Equipment Summary Stats
```
Encumbrance : 0/1
Total Protection : 0
```

### Inventory Section Header
```
My equipment
```

### Individual Item Display Pattern
```
Rusty Dagger    Damage : [ 1/5 ] Strength Needed = [ 0 ]    [Sell]    [Equip]
```

### Item Display Components
- **Item Name**: Red text (Rusty Dagger)
- **Stats**: Damage range in brackets `[ 1/5 ]`
- **Requirements**: `Strength Needed = [ 0 ]`
- **Actions**: Two buttons - `[Sell]` and `[Equip]`

### UI Pattern Analysis
- **Equipment slots**: Listed vertically with empty states
- **Stats summary**: Key totals displayed prominently
- **Item actions**: Inline buttons for quick actions
- **Item stats**: Standardized format for damage/requirements

### API Mapping
- **Equipment slots** → `GET /api/equipment/inventory` (equipped items)
- **Inventory items** → `GET /api/equipment/inventory` (unequipped items)
- **[Sell] button** → `POST /api/equipment/sell` ✨ *Our new endpoint!*
- **[Equip] button** → `POST /api/equipment/slot/:slot`
- **Stats calculation** → Server-side calculation of encumbrance/protection

### Button Actions
- **[Sell]**: Calls our new sell endpoint with inventory_id
- **[Equip]**: Moves item from inventory to equipment slot
- **[Unequip]** (when equipped): Moves item back to inventory

### Item Information Display
- **Weapons**: Show damage range and strength requirement
- **Armor**: Would show protection, encumbrance, strength requirement
- **Color coding**: Red for item names, standard white for stats

---

## Shop Interface ("Blacksmith")

### Shop Header
```
Blacksmith
```

### Welcome Message
```
Oooo, welcome to my shop dear friend, here you can find the best weapons on earth for a reasonable price!
```

### Shop Table Structure
```
Name    Damage    Cost    Strength needed    
```

### Item Listing Pattern
```
Rusty Dagger    1 - 5    100    0    [Buy]
Knife           3 - 7    500    2    [Buy]
Dagger          5 - 10   1000   10   [Buy]
...
Planar Scimitar     350 - 390    1000000    400    [Buy]
Blade of the Ancients    460 - 500    2000000    500    [Buy]
```

### Complete Weapon Catalog
The shop shows the full progression from starter to endgame weapons:

**Starter Weapons (0-15 Strength)**
- Rusty Dagger: 1-5 damage, 100 gold, 0 strength
- Knife: 3-7 damage, 500 gold, 2 strength  
- Dagger: 5-10 damage, 1000 gold, 10 strength

**Mid-Level Weapons (15-50 Strength)**
- Bronze Dagger: 7-11 damage, 2000 gold, 12 strength
- Enchanted Dagger: 10-15 damage, 5000 gold, 15 strength
- Long Sword: 20-25 damage, 20000 gold, 25 strength

**High-End Weapons (50+ Strength)**
- Searing Scimitar: 50-65 damage, 80000 gold, 65 strength
- Doom Blade: 60-70 damage, 85000 gold, 68 strength
- Titan Hammer: 60-80 damage, 100000 gold, 80 strength

**Legendary Weapons (400-500 Strength)**
- Planar Scimitar: 350-390 damage, 1000000 gold, 400 strength
- Blade of the Ancients: 460-500 damage, 2000000 gold, 500 strength

### Navigation
```
[Back]
```

### Shop UI Patterns
- **Table format**: Clean columns for easy comparison
- **Price progression**: Clear cost scaling with power
- **Strength gates**: Higher-tier items require more strength
- **Single action**: Only `[Buy]` button per item
- **Scrollable list**: Long catalog in single page

### API Mapping
- **Item catalog** → `GET /api/equipment/shop?type=weapons`
- **[Buy] button** → `POST /api/equipment/purchase`
- **Player affordability** → Check against player's gold from sidebar
- **Strength validation** → Check against player's strength from sidebar

### Purchase Flow
1. Player clicks `[Buy]` on desired item
2. System validates gold and strength requirements
3. If successful: item moves to inventory, gold deducted
4. If failed: show appropriate error message
5. Update sidebar stats immediately

### UI Considerations
- **Affordability indication**: Could highlight/disable items player can't afford
- **Strength requirements**: Could highlight items player can't use
- **Inventory space**: Currently no apparent limit shown
- **Confirmation**: No confirmation dialog shown in this interface

---

## City Hub Interface ("The city")

### Welcome Message
```
Welcome dummy this is the city, now you can explore it.
```

### Location Categories

#### In the streets
```
Blacksmith          ← Equipment shop (weapons)
Armourer            ← Equipment shop (armor) 
Gambler
Town gems store
Food shop
Market
Alchemy Shop
Spell Shop
Fun Zone
```

#### In the woods
```
Tall tree of Mana
Monk's Alley
Reviving fruits
Enchantress
```

#### On the town hill
```
Council building
Temple of Tiipsi    ← Prayer/stat training
Other Towns
Jail  
Message board
```

#### The underground
```
Dungeon
Rich sands
Daily Arena
Creatures black market
```

### Navigation Pattern
- **Categorized areas**: Thematically grouped locations
- **Direct access**: Click any location name to enter
- **Hub structure**: Central access point to all game areas

### Key Locations for Our APIs
- **Blacksmith** → Equipment shop (weapons) - `GET /api/equipment/shop?type=weapons`
- **Armourer** → Equipment shop (armor) - `GET /api/equipment/shop?type=armor`
- **Temple of Tiipsi** → Prayer system - `POST /api/temple/pray`
- **Rich sands/Dungeon** → Likely fighting areas - `GET /api/beach/monsters`

---

## Fighting Hub Interface ("Fighting")

### Combat Areas Menu
```
Training beach          ← PvE monster combat
Search an opponent      ← Player search for PvP
Battle a player         ← Direct PvP combat  
Explore the dungeon     ← Advanced PvE area
Fight in the Arena      ← Arena/tournament system
```

### Navigation Pattern
- **Categorized combat**: Different types of fighting
- **PvE vs PvP**: Clear separation of monster vs player combat
- **Difficulty progression**: Training beach → Dungeon for increasing challenge

### API Mapping
- **Training beach** → `GET /api/beach/monsters`, `POST /api/beach/fight`
- **Battle a player** → PvP system (future implementation)
- **Explore the dungeon** → Advanced monster combat
- **Fight in the Arena** → Arena/tournament system

---

## Monster Selection Interface ("Training beach")

### Welcome Message
```
We have a whole bunch of creatures you can train with, just chose the right one for you, be careful, not too strong though or you might get hurt.
```

### Monster Table Structure
```
Creature name    Level    HP
```

### Monster Progression List
```
Goblin              Level 1     10 HP
Cobold              Level 2     25 HP  
HobGoblin           Level 3     40 HP
Skeleton            Level 5     70 HP
Lizard Man          Level 7     100 HP
Malfera             Level 10    170 HP
Goul                Level 15    310 HP
Undead Knight       Level 18    400 HP
Three headed Snake  Level 20    520 HP
Chimera             Level 25    750 HP
Skilled Ninja       Level 30    1000 HP
Baby Dragon         Level 35    1250 HP
Skeleton King       Level 40    1600 HP
Young Copper Dragon Level 45    2250 HP
...
Dragon King         Level 95    11000 HP
Weapon X            Level 100   7500 HP
```

### Monster Selection Patterns
- **Progressive difficulty**: Clear level-based progression from 1 to 100
- **HP scaling**: Health increases significantly with level
- **Thematic names**: Fantasy creatures with evocative names
- **Clickable selection**: Each monster name is likely clickable for combat

### Combat Considerations
- **Player Level**: Currently Level 1 (10 HP) - should fight Level 1-3 monsters
- **Equipment impact**: Player's equipped weapon/armor affects combat success
- **Risk/reward**: Higher level monsters give more experience but more dangerous

### API Mapping
- **Monster list** → `GET /api/beach/monsters`
- **Monster selection** → `POST /api/beach/fight` with monster_id
- **Combat resolution** → Server calculates damage with equipment effects
- **Rewards** → Experience and gold based on monster level

### UI Flow
1. Player views monster list
2. Clicks on appropriate monster based on their strength
3. Combat calculations happen server-side
4. Results displayed (victory/defeat, rewards, XP gain)
5. Player stats updated in sidebar

### Monster Categories by Level Range
- **Starter (1-10)**: Goblin, Cobold, HobGoblin, Skeleton, Lizard Man, Malfera
- **Intermediate (11-30)**: Goul, Undead Knight, Three headed Snake, Chimera, Skilled Ninja
- **Advanced (31-60)**: Baby Dragon, Skeleton King, Young Copper Dragon
- **Expert (61-100)**: Dragon King, Weapon X

---

## Temple Interface ("Temple of Tiipsi")

### Temple Lore
```
Tiipsi is your God.

Tiipsi watches over you day and night, and you must please Him.
Tiipsi rules the world of Marcoland, bad luck and good luck are His will.
In this temple, just a small sign of His magnificence, you can try to please Him, 
fall on your knees and pray, He might reward your prayers.
Since you must concentrate and you need to take your time, each prayer will cost you 5 mana.
```

### Prayer Options (5 Mana Each)
```
Pray for strength.
Pray for speed.
Pray for intelligence.
```

### Navigation
```
[ Back ]
```

### Temple Prayer System
- **Cost**: 5 mana per prayer
- **Stat Selection**: Choose which stat to improve
- **RNG Results**: Prayer success/failure is random
- **Resource Management**: Requires mana to use

### API Mapping
- **Prayer options** → `POST /api/temple/pray`
- **Mana requirement** → 5 mana per prayer (matches our API)
- **Stat selection** → Request body includes stat type
- **Results** → Success/failure with stat gain amount

### Prayer Flow
1. Player selects desired stat to pray for
2. System deducts 5 mana
3. Random stat gain calculated server-side
4. Results displayed to player
5. Sidebar stats updated immediately

### UI Considerations
- **Mana Check**: Disable prayer options if player has < 5 mana
- **Stat Focus**: Each prayer targets specific stat only
- **Cost Display**: Clear indication of mana cost
- **Immediate Feedback**: Show prayer results and stat gains

### Extended Prayer System (Not shown in this interface)
Based on our API implementation, there are also:
- **50 mana prayers**: More powerful stat gains
- **All mana prayers**: Maximum efficiency stat gains

These might be accessible through different interfaces or unlocked at higher levels.

---

## Technical Notes

### Responsive Behavior
- **Fixed 3-column layout**
- **Sidebar widths**: Approximately 280px each
- **Center content**: Flexible width
- **Minimum total width**: ~800px

### Real-time Updates
- **Mana timer**: Updates every second
- **Stats**: Update after actions
- **Notifications**: Chat room counts, messages

### State Management
- **Current location**: Highlight active page
- **User session**: Persistent login state
- **Resource updates**: Gold, mana, HP changes