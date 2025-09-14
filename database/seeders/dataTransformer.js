import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Data transformer for MarcoLand weapon and armor data
 * Parses scraped JSON files and converts to clean database format
 * 
 * Usage:
 *   import { transformWeapons, transformArmor } from './database/seeders/dataTransformer.js';
 *   
 *   const weapons = transformWeapons();
 *   const armor = transformArmor();
 *   
 * Output format:
 *   Weapons: { name, damage_min, damage_max, strength_required, cost_gold }
 *   Armor: { name, slot, protection, encumbrance, strength_required, cost_gold }
 */

/**
 * Parse damage range string like "1 - 5" into separate min/max integers
 * @param {string} damageStr - Damage string like "1 - 5"
 * @returns {Object} - {min: number, max: number}
 */
function parseDamageRange(damageStr) {
  if (!damageStr || typeof damageStr !== 'string') {
    return { min: 0, max: 0 };
  }
  
  const parts = damageStr.split(' - ').map(s => s.trim());
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10);
    const max = parseInt(parts[1], 10);
    
    if (!isNaN(min) && !isNaN(max)) {
      return { min, max };
    }
  }
  
  // Fallback: try to parse as single number
  const single = parseInt(damageStr.trim(), 10);
  if (!isNaN(single)) {
    return { min: single, max: single };
  }
  
  return { min: 0, max: 0 };
}

/**
 * Parse integer with validation and fallback
 * @param {string} value - String to parse
 * @param {number} fallback - Default value if parsing fails
 * @returns {number}
 */
function parseIntSafe(value, fallback = 0) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  
  const parsed = parseInt(value.trim(), 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Determine armor slot from table header
 * @param {string} header - Table header like "Armour - Feet"
 * @returns {string} - Normalized slot name
 */
function determineArmorSlot(header) {
  if (!header || typeof header !== 'string') {
    return 'unknown';
  }
  
  const headerLower = header.toLowerCase();
  
  if (headerLower.includes('feet')) return 'feet';
  if (headerLower.includes('hands')) return 'hands';
  if (headerLower.includes('head')) return 'head';
  if (headerLower.includes('lower body') || headerLower.includes('legs')) return 'legs';
  if (headerLower.includes('upper body') || headerLower.includes('body')) return 'body';
  
  return 'unknown';
}

/**
 * Transform weapons data from scraped JSON
 * @returns {Array} - Array of clean weapon objects
 */
function transformWeapons() {
  try {
    const weaponsPath = path.join(__dirname, '../../scraped-data/wiki/extracted/weapons.json');
    
    if (!fs.existsSync(weaponsPath)) {
      throw new Error(`Weapons data file not found at: ${weaponsPath}`);
    }
    
    const rawData = JSON.parse(fs.readFileSync(weaponsPath, 'utf8'));
    
    if (!rawData.tables || !Array.isArray(rawData.tables) || rawData.tables.length === 0) {
      throw new Error('Invalid weapons data: no tables found');
    }
    
    const table = rawData.tables[0];
    
    if (!Array.isArray(table) || table.length < 2) {
      throw new Error('Invalid weapons table: insufficient data');
    }
    
    const headers = table[0];
    const rows = table.slice(1);
    
    // Validate headers
    const expectedHeaders = ['Weapon', 'Damage', 'Cost', 'Required Strenght', 'Picture'];
    if (!headers || headers.length < 4) {
      throw new Error('Invalid weapons table headers');
    }
    
    const weapons = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (!Array.isArray(row) || row.length < 4) {
        console.warn(`Skipping invalid weapon row ${i + 1}: insufficient columns`);
        continue;
      }
      
      const name = row[0]?.trim();
      const damageStr = row[1]?.trim();
      const costStr = row[2]?.trim();
      const strengthStr = row[3]?.trim();
      
      if (!name) {
        console.warn(`Skipping weapon row ${i + 1}: missing name`);
        continue;
      }
      
      const damage = parseDamageRange(damageStr);
      const cost = parseIntSafe(costStr, 0);
      const strength = parseIntSafe(strengthStr, 0);
      
      if (damage.min === 0 && damage.max === 0) {
        console.warn(`Warning: weapon '${name}' has zero damage`);
      }
      
      weapons.push({
        name: name,
        damage_min: damage.min,
        damage_max: damage.max,
        strength_required: strength,
        cost_gold: cost
      });
    }
    
    console.log(`Successfully transformed ${weapons.length} weapons`);
    return weapons;
    
  } catch (error) {
    console.error('Error transforming weapons data:', error.message);
    throw error;
  }
}

/**
 * Transform armor data from scraped JSON
 * @returns {Array} - Array of clean armor objects
 */
function transformArmor() {
  try {
    const armorPath = path.join(__dirname, '../../scraped-data/wiki/extracted/armours.json');
    
    if (!fs.existsSync(armorPath)) {
      throw new Error(`Armor data file not found at: ${armorPath}`);
    }
    
    const rawData = JSON.parse(fs.readFileSync(armorPath, 'utf8'));
    
    if (!rawData.tables || !Array.isArray(rawData.tables) || rawData.tables.length === 0) {
      throw new Error('Invalid armor data: no tables found');
    }
    
    const armor = [];
    
    // Process each armor table (different slots)
    for (let tableIndex = 0; tableIndex < rawData.tables.length; tableIndex++) {
      const table = rawData.tables[tableIndex];
      
      if (!Array.isArray(table) || table.length < 2) {
        console.warn(`Skipping invalid armor table ${tableIndex + 1}: insufficient data`);
        continue;
      }
      
      const headers = table[0];
      const rows = table.slice(1);
      
      if (!headers || headers.length < 4) {
        console.warn(`Skipping armor table ${tableIndex + 1}: invalid headers`);
        continue;
      }
      
      // Determine slot from first header (e.g., "Armour - Feet")
      const slot = determineArmorSlot(headers[0]);
      
      if (slot === 'unknown') {
        console.warn(`Warning: could not determine slot for table with header: ${headers[0]}`);
      }
      
      // Expected headers: [slot_header, "Protection", "Cost", "Encumbrance"]
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        if (!Array.isArray(row) || row.length < 4) {
          console.warn(`Skipping invalid armor row ${i + 1} in ${slot} table: insufficient columns`);
          continue;
        }
        
        const name = row[0]?.trim();
        const protectionStr = row[1]?.trim();
        const costStr = row[2]?.trim();
        const encumbranceStr = row[3]?.trim();
        
        if (!name) {
          console.warn(`Skipping armor row ${i + 1} in ${slot} table: missing name`);
          continue;
        }
        
        const protection = parseIntSafe(protectionStr, 0);
        const cost = parseIntSafe(costStr, 0);
        const encumbrance = parseIntSafe(encumbranceStr, 0);
        
        armor.push({
          name: name,
          slot: slot,
          protection: protection,
          encumbrance: encumbrance,
          strength_required: 0, // Default to 0 as no strength requirement in armor data
          cost_gold: cost
        });
      }
    }
    
    console.log(`Successfully transformed ${armor.length} armor pieces across ${rawData.tables.length} tables`);
    return armor;
    
  } catch (error) {
    console.error('Error transforming armor data:', error.message);
    throw error;
  }
}

/**
 * Validate transformed weapon data
 * @param {Array} weapons - Array of weapon objects
 * @returns {boolean} - True if valid
 */
function validateWeapons(weapons) {
  if (!Array.isArray(weapons)) {
    throw new Error('Weapons data must be an array');
  }
  
  for (let i = 0; i < weapons.length; i++) {
    const weapon = weapons[i];
    
    if (!weapon.name || typeof weapon.name !== 'string') {
      throw new Error(`Weapon ${i + 1}: name is required and must be a string`);
    }
    
    if (typeof weapon.damage_min !== 'number' || weapon.damage_min < 0) {
      throw new Error(`Weapon ${weapon.name}: damage_min must be a non-negative number`);
    }
    
    if (typeof weapon.damage_max !== 'number' || weapon.damage_max < weapon.damage_min) {
      throw new Error(`Weapon ${weapon.name}: damage_max must be >= damage_min`);
    }
    
    if (typeof weapon.strength_required !== 'number' || weapon.strength_required < 0) {
      throw new Error(`Weapon ${weapon.name}: strength_required must be a non-negative number`);
    }
    
    if (typeof weapon.cost_gold !== 'number' || weapon.cost_gold < 0) {
      throw new Error(`Weapon ${weapon.name}: cost_gold must be a non-negative number`);
    }
  }
  
  return true;
}

/**
 * Validate transformed armor data
 * @param {Array} armor - Array of armor objects
 * @returns {boolean} - True if valid
 */
function validateArmor(armor) {
  if (!Array.isArray(armor)) {
    throw new Error('Armor data must be an array');
  }
  
  const validSlots = ['head', 'body', 'legs', 'hands', 'feet', 'unknown'];
  
  for (let i = 0; i < armor.length; i++) {
    const armorPiece = armor[i];
    
    if (!armorPiece.name || typeof armorPiece.name !== 'string') {
      throw new Error(`Armor ${i + 1}: name is required and must be a string`);
    }
    
    if (!validSlots.includes(armorPiece.slot)) {
      throw new Error(`Armor ${armorPiece.name}: slot must be one of: ${validSlots.join(', ')}`);
    }
    
    if (typeof armorPiece.protection !== 'number' || armorPiece.protection < 0) {
      throw new Error(`Armor ${armorPiece.name}: protection must be a non-negative number`);
    }
    
    if (typeof armorPiece.encumbrance !== 'number' || armorPiece.encumbrance < 0) {
      throw new Error(`Armor ${armorPiece.name}: encumbrance must be a non-negative number`);
    }
    
    if (typeof armorPiece.strength_required !== 'number' || armorPiece.strength_required < 0) {
      throw new Error(`Armor ${armorPiece.name}: strength_required must be a non-negative number`);
    }
    
    if (typeof armorPiece.cost_gold !== 'number' || armorPiece.cost_gold < 0) {
      throw new Error(`Armor ${armorPiece.name}: cost_gold must be a non-negative number`);
    }
  }
  
  return true;
}

export {
  transformWeapons,
  transformArmor,
  validateWeapons,
  validateArmor,
  // Export utility functions for testing
  parseDamageRange,
  parseIntSafe,
  determineArmorSlot
};

// CLI usage example - run when file is executed directly
async function runCLI() {
  console.log('MarcoLand Data Transformer');
  console.log('==========================');
  
  try {
    console.log('\nTransforming weapons...');
    const weapons = transformWeapons();
    validateWeapons(weapons);
    console.log(`✓ ${weapons.length} weapons transformed and validated`);
    
    console.log('\nTransforming armor...');
    const armor = transformArmor();
    validateArmor(armor);
    console.log(`✓ ${armor.length} armor pieces transformed and validated`);
    
    console.log('\nSample weapon:');
    console.log(JSON.stringify(weapons[0], null, 2));
    
    console.log('\nSample armor:');
    console.log(JSON.stringify(armor[0], null, 2));
    
    // Group armor by slot for summary
    const armorBySlot = armor.reduce((acc, piece) => {
      acc[piece.slot] = (acc[piece.slot] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nArmor by slot:');
    Object.entries(armorBySlot).forEach(([slot, count]) => {
      console.log(`  ${slot}: ${count} pieces`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  runCLI();
}