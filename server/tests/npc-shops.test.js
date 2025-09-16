import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

// Import the routes we'll be testing (these don't exist yet - TDD approach)
import blacksmithRoutes from '../routes/blacksmith.js';
import armourerRoutes from '../routes/armourer.js';
import gemsStoreRoutes from '../routes/gems-store.js';
import marketRoutes from '../routes/market.js';
import resourcesRoutes from '../routes/resources.js';

const app = express();
app.use(express.json());

// Mock auth middleware for testing
const mockAuth = (req, res, next) => {
  req.player = { id: 'test-player-id' };
  next();
};

// Setup routes with mock auth
app.use('/api/blacksmith', mockAuth, blacksmithRoutes);
app.use('/api/armourer', mockAuth, armourerRoutes);
app.use('/api/gems-store', mockAuth, gemsStoreRoutes);
app.use('/api/market', mockAuth, marketRoutes);
app.use('/api/resources', mockAuth, resourcesRoutes);

describe('NPC Shop System', () => {
  let testPlayerId;
  
  beforeEach(async () => {
    // Create test player with metals, gems, and quartz
    const { data: player, error } = await supabaseAdmin
      .from('players')
      .insert({
        username: `test_player_${Date.now()}`,
        gold: 10000,
        metals: 50,
        gems: 25,
        quartz: 5
      })
      .select()
      .single();
    
    if (error) throw error;
    testPlayerId = player.id;
    
    // Create player stats
    await supabaseAdmin
      .from('player_stats')
      .insert({
        player_id: testPlayerId,
        strength: 100,
        speed: 50,
        intelligence: 50
      });
  });

  afterEach(async () => {
    // Cleanup test data
    if (testPlayerId) {
      await supabaseAdmin
        .from('players')
        .delete()
        .eq('id', testPlayerId);
    }
  });

  describe('Player Resource Tracking', () => {
    test('should track metals, gems, and quartz in player data', async () => {
      const { data: player } = await supabaseAdmin
        .from('players')
        .select('metals, gems, quartz, gold')
        .eq('id', testPlayerId)
        .single();

      expect(player.metals).toBe(50);
      expect(player.gems).toBe(25);
      expect(player.quartz).toBe(5);
      expect(player.gold).toBe(10000);
    });
  });

  describe('Blacksmith API (Weapons Only)', () => {
    test('GET /api/blacksmith should return weapons only', async () => {
      const response = await request(app)
        .get('/api/blacksmith')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.weapons).toBeDefined();
      expect(Array.isArray(response.body.weapons)).toBe(true);
      
      // Should not include armor
      expect(response.body.armor).toBeUndefined();
    });

    test('POST /api/blacksmith/purchase should buy weapons only', async () => {
      // First get a weapon to purchase
      const weaponsResponse = await request(app)
        .get('/api/blacksmith');
      
      const weapon = weaponsResponse.body.weapons[0];
      
      const response = await request(app)
        .post('/api/blacksmith/purchase')
        .send({
          equipment_id: weapon.id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.remaining_gold).toBeLessThan(10000);
    });

    test('POST /api/blacksmith/purchase should reject armor purchases', async () => {
      // Try to buy armor from blacksmith (should fail)
      const { data: armor } = await supabaseAdmin
        .from('armor')
        .select('id')
        .limit(1)
        .single();

      const response = await request(app)
        .post('/api/blacksmith/purchase')
        .send({
          equipment_id: armor.id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('weapon');
    });
  });

  describe('Armourer API (Armor Only)', () => {
    test('GET /api/armourer should return armor only', async () => {
      const response = await request(app)
        .get('/api/armourer')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.armor).toBeDefined();
      expect(Array.isArray(response.body.armor)).toBe(true);
      
      // Should not include weapons
      expect(response.body.weapons).toBeUndefined();
    });

    test('POST /api/armourer/purchase should buy armor only', async () => {
      const armorResponse = await request(app)
        .get('/api/armourer');
      
      const armor = armorResponse.body.armor[0];
      
      const response = await request(app)
        .post('/api/armourer/purchase')
        .send({
          equipment_id: armor.id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.remaining_gold).toBeLessThan(10000);
    });

    test('POST /api/armourer/purchase should reject weapon purchases', async () => {
      const { data: weapon } = await supabaseAdmin
        .from('weapons')
        .select('id')
        .limit(1)
        .single();

      const response = await request(app)
        .post('/api/armourer/purchase')
        .send({
          equipment_id: weapon.id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('armor');
    });
  });

  describe('Gems Store API (Daily Limits)', () => {
    test('GET /api/gems-store should show daily purchase status', async () => {
      const response = await request(app)
        .get('/api/gems-store')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.gems_purchased_today).toBeDefined();
      expect(response.body.gems_remaining).toBeDefined();
      expect(response.body.price_per_gem).toBe(90);
      expect(response.body.daily_limit).toBe(30);
    });

    test('POST /api/gems-store/purchase should buy gems at 90g each', async () => {
      const response = await request(app)
        .post('/api/gems-store/purchase')
        .send({
          quantity: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.gems_purchased).toBe(5);
      expect(response.body.total_cost).toBe(450); // 5 * 90
      expect(response.body.remaining_gold).toBe(9550); // 10000 - 450
    });

    test('POST /api/gems-store/purchase should enforce daily limit of 30', async () => {
      // Try to buy 35 gems (over limit)
      const response = await request(app)
        .post('/api/gems-store/purchase')
        .send({
          quantity: 35
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('daily limit');
    });

    test('should track daily purchase limits across multiple purchases', async () => {
      // Buy 20 gems
      await request(app)
        .post('/api/gems-store/purchase')
        .send({ quantity: 20 })
        .expect(200);

      // Try to buy 15 more (total would be 35, over limit)
      const response = await request(app)
        .post('/api/gems-store/purchase')
        .send({ quantity: 15 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('daily limit');
    });

    test('should update player gems inventory after purchase', async () => {
      await request(app)
        .post('/api/gems-store/purchase')
        .send({ quantity: 10 });

      const { data: player } = await supabaseAdmin
        .from('players')
        .select('gems, gold')
        .eq('id', testPlayerId)
        .single();

      expect(player.gems).toBe(35); // 25 + 10
      expect(player.gold).toBe(9100); // 10000 - 900
    });
  });

  describe('Market API (Placeholder)', () => {
    test('GET /api/market should return placeholder message', async () => {
      const response = await request(app)
        .get('/api/market')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('coming soon');
      expect(response.body.listings).toEqual([]);
    });
  });

  describe('Resources API (Voting & Mana Tree)', () => {
    test('GET /api/resources/vote should show voting status', async () => {
      const response = await request(app)
        .get('/api/resources/vote')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.voted_today).toBeDefined();
      expect(response.body.can_vote).toBeDefined();
    });

    test('POST /api/resources/vote should award 500-1000 gold', async () => {
      const response = await request(app)
        .post('/api/resources/vote')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.gold_awarded).toBeGreaterThanOrEqual(500);
      expect(response.body.gold_awarded).toBeLessThanOrEqual(1000);
    });

    test('GET /api/resources/mana-tree should show mana purchase status', async () => {
      const response = await request(app)
        .get('/api/resources/mana-tree')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.mana_purchased_today).toBeDefined();
      expect(response.body.gems_required).toBe(100);
    });

    test('POST /api/resources/mana-tree/purchase should cost 100 gems', async () => {
      // Need to have enough gems first
      await supabaseAdmin
        .from('players')
        .update({ gems: 150 })
        .eq('id', testPlayerId);

      const response = await request(app)
        .post('/api/resources/mana-tree/purchase')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.gems_spent).toBe(100);
      expect(response.body.max_mana_increased).toBe(1);
    });
  });
});