import { supabaseAdmin } from '../../server/config/supabase.js';

const monsters = [
  {
    name: "Goblin",
    level: 1,
    health: 10,
    damage_min: 1,
    damage_max: 4,
    defense: 0,
    experience_reward: 25,
    gold_reward: 25
  },
  {
    name: "Cobold",
    level: 2,
    health: 25,
    damage_min: 5,
    damage_max: 10,
    defense: 3,
    experience_reward: 40,
    gold_reward: 35
  },
  {
    name: "Hobgoblin",
    level: 3,
    health: 40,
    damage_min: 10,
    damage_max: 17,
    defense: 6,
    experience_reward: 60,
    gold_reward: 50
  },
  {
    name: "Skeleton",
    level: 5,
    health: 70,
    damage_min: 15,
    damage_max: 25,
    defense: 10,
    experience_reward: 80,
    gold_reward: 65
  },
  {
    name: "Lizard Man",
    level: 7,
    health: 100,
    damage_min: 25,
    damage_max: 45,
    defense: 20,
    experience_reward: 100,
    gold_reward: 85
  },
  {
    name: "Malfera",
    level: 10,
    health: 170,
    damage_min: 65,
    damage_max: 80,
    defense: 40,
    experience_reward: 145,
    gold_reward: 108
  },
  {
    name: "Ghoul",
    level: 15,
    health: 310,
    damage_min: 105,
    damage_max: 130,
    defense: 70,
    experience_reward: 220,
    gold_reward: 170
  },
  {
    name: "Undead Knight",
    level: 18,
    health: 400,
    damage_min: 80,
    damage_max: 105,
    defense: 100,
    experience_reward: 245,
    gold_reward: 195
  },
  {
    name: "Three Headed Snake",
    level: 20,
    health: 520,
    damage_min: 195,
    damage_max: 230,
    defense: 160,
    experience_reward: 275,
    gold_reward: 218
  },
  {
    name: "Chimera",
    level: 25,
    health: 750,
    damage_min: 205,
    damage_max: 245,
    defense: 180,
    experience_reward: 335,
    gold_reward: 263
  },
  {
    name: "Skilled Ninja",
    level: 30,
    health: 1000,
    damage_min: 215,
    damage_max: 250,
    defense: 200,
    experience_reward: 405,
    gold_reward: 310
  },
  {
    name: "Baby Dragon",
    level: 35,
    health: 1250,
    damage_min: 240,
    damage_max: 275,
    defense: 215,
    experience_reward: 465,
    gold_reward: 370
  },
  {
    name: "Skeleton King",
    level: 40,
    health: 1600,
    damage_min: 250,
    damage_max: 305,
    defense: 240,
    experience_reward: 540,
    gold_reward: 430
  },
  {
    name: "Young Copper Dragon",
    level: 45,
    health: 2250,
    damage_min: 265,
    damage_max: 320,
    defense: 255,
    experience_reward: 605,
    gold_reward: 465
  },
  {
    name: "Illithid",
    level: 55,
    health: 3200,
    damage_min: 285,
    damage_max: 345,
    defense: 270,
    experience_reward: 665,
    gold_reward: 515
  },
  {
    name: "Shaolin Monk",
    level: 55,
    health: 3700,
    damage_min: 305,
    damage_max: 365,
    defense: 290,
    experience_reward: 735,
    gold_reward: 577
  },
  {
    name: "Young Shadow Dragon",
    level: 60,
    health: 4100,
    damage_min: 320,
    damage_max: 380,
    defense: 300,
    experience_reward: 805,
    gold_reward: 620
  },
  {
    name: "Zombie Lord",
    level: 65,
    health: 4800,
    damage_min: 325,
    damage_max: 390,
    defense: 320,
    experience_reward: 860,
    gold_reward: 663
  },
  {
    name: "Copper Dragon",
    level: 70,
    health: 5100,
    damage_min: 345,
    damage_max: 405,
    defense: 350,
    experience_reward: 930,
    gold_reward: 710
  },
  {
    name: "Gold Dragon",
    level: 75,
    health: 6000,
    damage_min: 375,
    damage_max: 430,
    defense: 380,
    experience_reward: 990,
    gold_reward: 765
  },
  {
    name: "Shadow Dragon",
    level: 80,
    health: 7200,
    damage_min: 390,
    damage_max: 460,
    defense: 400,
    experience_reward: 1055,
    gold_reward: 820
  },
  {
    name: "Chromatic Dragon",
    level: 85,
    health: 8000,
    damage_min: 410,
    damage_max: 490,
    defense: 410,
    experience_reward: 1120,
    gold_reward: 870
  },
  {
    name: "Wyrm",
    level: 90,
    health: 9500,
    damage_min: 450,
    damage_max: 500,
    defense: 450,
    experience_reward: 1185,
    gold_reward: 915
  },
  {
    name: "Dragon King",
    level: 95,
    health: 11000,
    damage_min: 605,
    damage_max: 655,
    defense: 500,
    experience_reward: 1250,
    gold_reward: 1020
  },
  {
    name: "Weapon X",
    level: 100,
    health: 7500,
    damage_min: 70,
    damage_max: 810,
    defense: 500,
    experience_reward: 1320,
    gold_reward: 1020
  },
  {
    name: "Kaolor the Conqueror",
    level: 120,
    health: 15000,
    damage_min: 720,
    damage_max: 1020,
    defense: 700,
    experience_reward: 1570,
    gold_reward: 1205
  },
  {
    name: "Apocalypse",
    level: 150,
    health: 20000,
    damage_min: 960,
    damage_max: 1210,
    defense: 900,
    experience_reward: 1970,
    gold_reward: 1515
  },
  {
    name: "Gargantua",
    level: 180,
    health: 25000,
    damage_min: 1250,
    damage_max: 1550,
    defense: 1000,
    experience_reward: 2360,
    gold_reward: 1810
  },
  {
    name: "Cayne - Lesser Deity",
    level: 200,
    health: 30000,
    damage_min: 1549,
    damage_max: 1834,
    defense: 1200,
    experience_reward: 2615,
    gold_reward: 2015
  },
  {
    name: "Nazgul",
    level: 201,
    health: 60000,
    damage_min: 3900,
    damage_max: 4200,
    defense: 1500,
    experience_reward: 2620,
    gold_reward: 2019
  }
];

export async function seedMonsters() {
  console.log('🌱 Seeding monsters...');
  
  try {
    // Clear existing monsters first
    const { error: deleteError } = await supabaseAdmin
      .from('creatures')
      .delete()
      .eq('creature_type', 'monster');
    
    if (deleteError) {
      console.error('Error clearing existing monsters:', deleteError);
      return;
    }

    // Insert new monsters
    const monstersToInsert = monsters.map(monster => ({
      name: monster.name,
      creature_type: 'monster',
      level: monster.level,
      health: monster.health,
      damage: Math.floor((monster.damage_min + monster.damage_max) / 2), // Average damage for base
      defense: monster.defense,
      experience_reward: monster.experience_reward,
      gold_reward: monster.gold_reward,
      loot_table: {
        gems: {
          drop_rate: 0.05, // 5% chance for gems
          min_amount: 1,
          max_amount: 1
        },
        damage_range: {
          min: monster.damage_min,
          max: monster.damage_max
        }
      }
    }));

    const { data, error } = await supabaseAdmin
      .from('creatures')
      .insert(monstersToInsert)
      .select();

    if (error) {
      console.error('Error inserting monsters:', error);
      return;
    }

    console.log(`✅ Successfully seeded ${data.length} monsters`);
    console.log('Monsters range from level', Math.min(...monsters.map(m => m.level)), 'to', Math.max(...monsters.map(m => m.level)));
    
  } catch (error) {
    console.error('Unexpected error during monster seeding:', error);
  }
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedMonsters();
  process.exit(0);
}