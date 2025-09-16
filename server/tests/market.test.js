import request from 'supertest';
import app from '../index.js';
import { supabaseAdmin } from '../config/supabase.js';

describe('Market System', () => {
    let authCookie1, authCookie2;
    let player1Id, player2Id;
    let testListing;

    beforeAll(async () => {
        // Create two test players
        const timestamp = Date.now();
        
        // Player 1 - seller
        const signUp1 = await request(app)
            .post('/api/auth/signup')
            .send({
                username: `seller_${timestamp}`,
                password: 'testpass123'
            });
        authCookie1 = signUp1.headers['set-cookie'];
        player1Id = signUp1.body.player.id;

        // Player 2 - buyer
        const signUp2 = await request(app)
            .post('/api/auth/signup')
            .send({
                username: `buyer_${timestamp}`,
                password: 'testpass123'
            });
        authCookie2 = signUp2.headers['set-cookie'];
        player2Id = signUp2.body.player.id;

        // Give both players resources for testing
        await supabaseAdmin
            .from('players')
            .update({ gold: 10000, gems: 1000, metals: 500 })
            .eq('id', player1Id);

        await supabaseAdmin
            .from('players')
            .update({ gold: 10000, gems: 100, metals: 50 })
            .eq('id', player2Id);
    });

    afterAll(async () => {
        // Clean up test data
        if (testListing?.id) {
            await supabaseAdmin
                .from('market')
                .delete()
                .eq('id', testListing.id);
        }
        
        // Delete test players
        await supabaseAdmin
            .from('players')
            .delete()
            .in('id', [player1Id, player2Id]);
    });

    describe('GET /api/market', () => {
        it('should return empty listings initially', async () => {
            const response = await request(app)
                .get('/api/market')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should filter by item type', async () => {
            const response = await request(app)
                .get('/api/market?type=gems')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('POST /api/market - Create Listing', () => {
        it('should prevent creating listing without auth', async () => {
            await request(app)
                .post('/api/market')
                .send({
                    item_type: 'gems',
                    quantity: 100,
                    unit_price: 50
                })
                .expect(401);
        });

        it('should create a valid gems listing', async () => {
            const response = await request(app)
                .post('/api/market')
                .set('Cookie', authCookie1)
                .send({
                    item_type: 'gems',
                    quantity: 100,
                    unit_price: 50
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.listing).toBeDefined();
            testListing = response.body.listing;

            // Verify gems were deducted
            const { data: player } = await supabaseAdmin
                .from('players')
                .select('gems')
                .eq('id', player1Id)
                .single();
            expect(player.gems).toBe(900);
        });

        it('should prevent listing more items than owned', async () => {
            const response = await request(app)
                .post('/api/market')
                .set('Cookie', authCookie1)
                .send({
                    item_type: 'gems',
                    quantity: 10000,
                    unit_price: 50
                })
                .expect(400);

            expect(response.body.error).toContain('Insufficient');
        });

        it('should enforce price limits', async () => {
            await request(app)
                .post('/api/market')
                .set('Cookie', authCookie1)
                .send({
                    item_type: 'gems',
                    quantity: 10,
                    unit_price: 0
                })
                .expect(400);

            await request(app)
                .post('/api/market')
                .set('Cookie', authCookie1)
                .send({
                    item_type: 'gems',
                    quantity: 10,
                    unit_price: 1000001
                })
                .expect(400);
        });

        it('should enforce rate limiting', async () => {
            // Create 10 listings quickly
            const promises = [];
            for (let i = 0; i < 12; i++) {
                promises.push(
                    request(app)
                        .post('/api/market')
                        .set('Cookie', authCookie1)
                        .send({
                            item_type: 'gems',
                            quantity: 1,
                            unit_price: 50
                        })
                );
            }

            const results = await Promise.all(promises);
            const rateLimited = results.some(r => r.status === 429);
            expect(rateLimited).toBe(true);
        });
    });

    describe('POST /api/market/:id/buy - Purchase Listing', () => {
        it('should prevent buying without auth', async () => {
            await request(app)
                .post(`/api/market/${testListing.id}/buy`)
                .send({ quantity: 50 })
                .expect(401);
        });

        it('should prevent buying own listing', async () => {
            const response = await request(app)
                .post(`/api/market/${testListing.id}/buy`)
                .set('Cookie', authCookie1)
                .send({ quantity: 50 })
                .expect(400);

            expect(response.body.error).toContain('own listing');
        });

        it('should support partial purchases', async () => {
            const response = await request(app)
                .post(`/api/market/${testListing.id}/buy`)
                .set('Cookie', authCookie2)
                .send({ quantity: 30 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.purchased).toBe(30);
            expect(response.body.total_cost).toBe(1500);
            expect(response.body.complete).toBe(false);

            // Verify buyer received gems and paid gold
            const { data: buyer } = await supabaseAdmin
                .from('players')
                .select('gold, gems')
                .eq('id', player2Id)
                .single();
            expect(buyer.gold).toBe(8500);
            expect(buyer.gems).toBe(130);

            // Verify seller received gold
            const { data: seller } = await supabaseAdmin
                .from('players')
                .select('gold')
                .eq('id', player1Id)
                .single();
            expect(seller.gold).toBe(11500);
        });

        it('should handle insufficient gold', async () => {
            // Update buyer to have less gold
            await supabaseAdmin
                .from('players')
                .update({ gold: 100 })
                .eq('id', player2Id);

            const response = await request(app)
                .post(`/api/market/${testListing.id}/buy`)
                .set('Cookie', authCookie2)
                .send({ quantity: 50 })
                .expect(400);

            expect(response.body.error).toContain('Insufficient gold');
        });

        it('should complete full purchase', async () => {
            // Restore buyer's gold
            await supabaseAdmin
                .from('players')
                .update({ gold: 10000 })
                .eq('id', player2Id);

            const response = await request(app)
                .post(`/api/market/${testListing.id}/buy`)
                .set('Cookie', authCookie2)
                .send({ quantity: 70 })
                .expect(200);

            expect(response.body.complete).toBe(true);

            // Verify listing is marked as sold
            const { data: listing } = await supabaseAdmin
                .from('market')
                .select('buyer_id, sold_at')
                .eq('id', testListing.id)
                .single();
            
            expect(listing.buyer_id).toBe(player2Id);
            expect(listing.sold_at).toBeTruthy();
        });

        it('should prevent buying sold listings', async () => {
            await request(app)
                .post(`/api/market/${testListing.id}/buy`)
                .set('Cookie', authCookie2)
                .send({ quantity: 10 })
                .expect(404);
        });
    });

    describe('DELETE /api/market/:id - Cancel Listing', () => {
        let cancelListingId;

        beforeAll(async () => {
            // Create a new listing to cancel
            const { data } = await supabaseAdmin
                .from('market')
                .insert({
                    seller_id: player1Id,
                    item_type: 'metals',
                    quantity: 50,
                    unit_price: 100
                })
                .select()
                .single();
            cancelListingId = data.id;

            // Deduct metals from seller
            await supabaseAdmin
                .from('players')
                .update({ metals: 450 })
                .eq('id', player1Id);
        });

        it('should prevent cancelling without auth', async () => {
            await request(app)
                .delete(`/api/market/${cancelListingId}`)
                .expect(401);
        });

        it('should prevent cancelling other players listings', async () => {
            await request(app)
                .delete(`/api/market/${cancelListingId}`)
                .set('Cookie', authCookie2)
                .expect(404);
        });

        it('should cancel own listing and return items', async () => {
            const response = await request(app)
                .delete(`/api/market/${cancelListingId}`)
                .set('Cookie', authCookie1)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.returned).toBe(50);
            expect(response.body.item_type).toBe('metals');

            // Verify metals were returned
            const { data: player } = await supabaseAdmin
                .from('players')
                .select('metals')
                .eq('id', player1Id)
                .single();
            expect(player.metals).toBe(500);
        });

        it('should prevent cancelling already sold listings', async () => {
            await request(app)
                .delete(`/api/market/${testListing.id}`)
                .set('Cookie', authCookie1)
                .expect(404);
        });
    });

    describe('GET /api/market/my-listings', () => {
        it('should return empty array for player with no listings', async () => {
            const response = await request(app)
                .get('/api/market/my-listings')
                .set('Cookie', authCookie2)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return sellers listings with status', async () => {
            const response = await request(app)
                .get('/api/market/my-listings')
                .set('Cookie', authCookie1)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            
            const soldListing = response.body.find(l => l.id === testListing.id);
            expect(soldListing).toBeDefined();
            expect(soldListing.status).toBe('sold');
            expect(soldListing.buyer_name).toBeTruthy();
        });
    });

    describe('Concurrent Purchase Handling', () => {
        it('should handle concurrent purchases correctly', async () => {
            // Create a listing with limited quantity
            const { data: listing } = await supabaseAdmin
                .from('market')
                .insert({
                    seller_id: player1Id,
                    item_type: 'gems',
                    quantity: 10,
                    unit_price: 100
                })
                .select()
                .single();

            // Give both players enough gold
            await supabaseAdmin
                .from('players')
                .update({ gold: 5000 })
                .in('id', [player1Id, player2Id]);

            // Create second buyer
            const timestamp = Date.now();
            const signUp3 = await request(app)
                .post('/api/auth/signup')
                .send({
                    username: `buyer2_${timestamp}`,
                    password: 'testpass123'
                });
            const authCookie3 = signUp3.headers['set-cookie'];
            const player3Id = signUp3.body.player.id;

            await supabaseAdmin
                .from('players')
                .update({ gold: 5000 })
                .eq('id', player3Id);

            // Attempt concurrent purchases
            const [response1, response2] = await Promise.all([
                request(app)
                    .post(`/api/market/${listing.id}/buy`)
                    .set('Cookie', authCookie2)
                    .send({ quantity: 10 }),
                request(app)
                    .post(`/api/market/${listing.id}/buy`)
                    .set('Cookie', authCookie3)
                    .send({ quantity: 10 })
            ]);

            // One should succeed, one should fail
            const success = response1.status === 200 ? response1 : response2;
            const failure = response1.status !== 200 ? response1 : response2;

            expect(success.status).toBe(200);
            expect(failure.status).toBe(404);

            // Clean up
            await supabaseAdmin
                .from('players')
                .delete()
                .eq('id', player3Id);
        });
    });
});