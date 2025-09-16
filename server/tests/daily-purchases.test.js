import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { supabaseAdmin } from '../config/supabase.js';

describe('Daily Purchase Functions', () => {
  let testPlayerId;
  
  beforeEach(async () => {
    // Create test player
    const { data: player, error } = await supabaseAdmin
      .from('players')
      .insert({
        username: `test_daily_${Date.now()}`,
        gold: 5000,
        gems: 0,
        metals: 0,
        quartz: 0
      })
      .select()
      .single();
    
    if (error) throw error;
    testPlayerId = player.id;
    
    // Clean any existing daily purchase records
    await supabaseAdmin
      .from('player_daily_purchases')
      .delete()
      .eq('player_id', testPlayerId);
  });

  afterEach(async () => {
    if (testPlayerId) {
      await supabaseAdmin
        .from('players')
        .delete()
        .eq('id', testPlayerId);
    }
  });

  describe('check_daily_limit function', () => {
    test('should return true when no purchases made today', async () => {
      const { data, error } = await supabaseAdmin.rpc('check_daily_limit', {
        p_player_id: testPlayerId,
        p_purchase_type: 'gems',
        p_quantity: 10,
        p_daily_limit: 30
      });

      expect(error).toBeNull();
      expect(data).toBe(true);
    });

    test('should return true when purchase is within limit', async () => {
      // Record some purchases first
      await supabaseAdmin
        .from('player_daily_purchases')
        .insert({
          player_id: testPlayerId,
          purchase_type: 'gems',
          quantity: 15
        });

      const { data, error } = await supabaseAdmin.rpc('check_daily_limit', {
        p_player_id: testPlayerId,
        p_purchase_type: 'gems',
        p_quantity: 10, // 15 + 10 = 25, under limit of 30
        p_daily_limit: 30
      });

      expect(error).toBeNull();
      expect(data).toBe(true);
    });

    test('should return false when purchase would exceed limit', async () => {
      // Record purchases at limit
      await supabaseAdmin
        .from('player_daily_purchases')
        .insert({
          player_id: testPlayerId,
          purchase_type: 'gems',
          quantity: 25
        });

      const { data, error } = await supabaseAdmin.rpc('check_daily_limit', {
        p_player_id: testPlayerId,
        p_purchase_type: 'gems',
        p_quantity: 10, // 25 + 10 = 35, over limit of 30
        p_daily_limit: 30
      });

      expect(error).toBeNull();
      expect(data).toBe(false);
    });

    test('should handle different purchase types separately', async () => {
      // Max out gems for today
      await supabaseAdmin
        .from('player_daily_purchases')
        .insert({
          player_id: testPlayerId,
          purchase_type: 'gems',
          quantity: 30
        });

      // Should still allow mana purchase (different type)
      const { data, error } = await supabaseAdmin.rpc('check_daily_limit', {
        p_player_id: testPlayerId,
        p_purchase_type: 'mana',
        p_quantity: 1,
        p_daily_limit: 1
      });

      expect(error).toBeNull();
      expect(data).toBe(true);
    });
  });

  describe('process_daily_purchase function', () => {
    test('should complete successful purchase within limits', async () => {
      const { data, error } = await supabaseAdmin.rpc('process_daily_purchase', {
        p_player_id: testPlayerId,
        p_purchase_type: 'gems',
        p_quantity: 10,
        p_cost_per_unit: 90,
        p_daily_limit: 30
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      expect(data.remaining_gold).toBe(4100); // 5000 - (10 * 90)
      expect(data.items_purchased).toBe(10);
      expect(data.total_cost).toBe(900);
    });

    test('should fail when exceeding daily limit', async () => {
      const { data, error } = await supabaseAdmin.rpc('process_daily_purchase', {
        p_player_id: testPlayerId,
        p_purchase_type: 'gems',
        p_quantity: 35, // Over limit of 30
        p_cost_per_unit: 90,
        p_daily_limit: 30
      });

      expect(error).toBeNull();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Daily purchase limit exceeded');
    });

    test('should fail when insufficient gold', async () => {
      const { data, error } = await supabaseAdmin.rpc('process_daily_purchase', {
        p_player_id: testPlayerId,
        p_purchase_type: 'gems',
        p_quantity: 30,
        p_cost_per_unit: 200, // 30 * 200 = 6000, more than 5000 gold
        p_daily_limit: 30
      });

      expect(error).toBeNull();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Insufficient gold');
    });

    test('should update daily purchase tracking', async () => {
      await supabaseAdmin.rpc('process_daily_purchase', {
        p_player_id: testPlayerId,
        p_purchase_type: 'gems',
        p_quantity: 15,
        p_cost_per_unit: 90,
        p_daily_limit: 30
      });

      // Check if tracking record was created
      const { data: purchases } = await supabaseAdmin
        .from('player_daily_purchases')
        .select('*')
        .eq('player_id', testPlayerId)
        .eq('purchase_type', 'gems')
        .eq('purchase_date', new Date().toISOString().split('T')[0]);

      expect(purchases).toHaveLength(1);
      expect(purchases[0].quantity).toBe(15);
      expect(purchases[0].gold_spent).toBe(1350);
    });

    test('should accumulate multiple purchases correctly', async () => {
      // First purchase
      await supabaseAdmin.rpc('process_daily_purchase', {
        p_player_id: testPlayerId,
        p_purchase_type: 'gems',
        p_quantity: 10,
        p_cost_per_unit: 90,
        p_daily_limit: 30
      });

      // Second purchase
      await supabaseAdmin.rpc('process_daily_purchase', {
        p_player_id: testPlayerId,
        p_purchase_type: 'gems',
        p_quantity: 15,
        p_cost_per_unit: 90,
        p_daily_limit: 30
      });

      // Check accumulated tracking
      const { data: purchase } = await supabaseAdmin
        .from('player_daily_purchases')
        .select('*')
        .eq('player_id', testPlayerId)
        .eq('purchase_type', 'gems')
        .eq('purchase_date', new Date().toISOString().split('T')[0])
        .single();

      expect(purchase.quantity).toBe(25); // 10 + 15
      expect(purchase.gold_spent).toBe(2250); // (10 + 15) * 90
    });

    test('should update player gold correctly', async () => {
      await supabaseAdmin.rpc('process_daily_purchase', {
        p_player_id: testPlayerId,
        p_purchase_type: 'gems',
        p_quantity: 20,
        p_cost_per_unit: 90,
        p_daily_limit: 30
      });

      const { data: player } = await supabaseAdmin
        .from('players')
        .select('gold')
        .eq('id', testPlayerId)
        .single();

      expect(player.gold).toBe(3200); // 5000 - (20 * 90)
    });
  });

  describe('purchase_gems function', () => {
    test('should purchase gems and update player inventory', async () => {
      const { data, error } = await supabaseAdmin.rpc('purchase_gems', {
        p_player_id: testPlayerId,
        p_quantity: 10
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);

      // Check player gems were updated
      const { data: player } = await supabaseAdmin
        .from('players')
        .select('gems, gold')
        .eq('id', testPlayerId)
        .single();

      expect(player.gems).toBe(10);
      expect(player.gold).toBe(4100); // 5000 - (10 * 90)
    });

    test('should enforce 30 gems daily limit', async () => {
      const { data, error } = await supabaseAdmin.rpc('purchase_gems', {
        p_player_id: testPlayerId,
        p_quantity: 35
      });

      expect(error).toBeNull();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Daily purchase limit exceeded');
    });

    test('should charge 90 gold per gem', async () => {
      await supabaseAdmin.rpc('purchase_gems', {
        p_player_id: testPlayerId,
        p_quantity: 5
      });

      const { data: player } = await supabaseAdmin
        .from('players')
        .select('gold')
        .eq('id', testPlayerId)
        .single();

      expect(player.gold).toBe(4550); // 5000 - (5 * 90)
    });
  });
});