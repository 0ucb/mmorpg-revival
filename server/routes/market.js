import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { marketLimiter } from '../middleware/rateLimiting.js';
import { validateMarketListing, validatePurchaseQuantity } from '../../shared/validation/market.js';
import { sendError, sendSuccess } from '../utils/errorHandler.js';
import { sanitizeInput } from '../utils/sanitizer.js';

const router = express.Router();


// GET /api/market - Get all active listings
router.get('/', async (req, res) => {
    try {
        const type = sanitizeInput(req.query.type);
        
        let query = supabaseAdmin
            .from('market')
            .select(`
                *,
                seller:players!seller_id(username)
            `)
            .is('buyer_id', null)
            .order('unit_price', { ascending: true })
            .order('created_at', { ascending: false });
        
        if (type && ['gems', 'metals'].includes(type)) {
            query = query.eq('item_type', type);
        }
        
        const { data: listings, error } = await query;
        
        if (error) {
            console.error('Error fetching market listings:', error);
            return sendError(res, 500, 'Failed to fetch market listings');
        }
        
        // Flatten seller data for easier frontend consumption
        const formattedListings = listings.map(listing => ({
            ...listing,
            seller_name: listing.seller?.username || 'Unknown'
        }));
        
        res.json(formattedListings);
    } catch (error) {
        console.error('Error fetching market:', error);
        return sendError(res, 500, 'Internal server error');
    }
});

// POST /api/market - Create a new listing
router.post('/', requireAuth, marketLimiter, async (req, res) => {
    try {
        const item_type = sanitizeInput(req.body.item_type);
        const quantity = sanitizeInput(req.body.quantity);
        const unit_price = sanitizeInput(req.body.unit_price);
        const sellerId = req.player.id;
        
        // Use shared validation
        const validation = validateMarketListing(quantity, unit_price, item_type);
        if (!validation.valid) {
            return sendError(res, 400, validation.errors[0]);
        }
        
        // Use safe retry wrapper for atomic transaction
        const { data, error } = await supabaseAdmin.rpc('safe_market_listing', {
            p_seller_id: sellerId,
            p_item_type: item_type,
            p_quantity: quantity,
            p_unit_price: unit_price
        });
        
        if (error) {
            if (error.message.includes('Insufficient')) {
                return sendError(res, 400, `Insufficient ${item_type}`);
            }
            console.error('Error creating listing:', error);
            return sendError(res, 500, 'Failed to create listing');
        }
        
        return sendSuccess(res, { listing: data });
        
    } catch (error) {
        console.error('Error creating market listing:', error);
        return sendError(res, 500, 'Internal server error');
    }
});

// POST /api/market/:id/buy - Buy from a listing (supports partial purchases)
router.post('/:id/buy', requireAuth, async (req, res) => {
    try {
        const listingId = parseInt(req.params.id);
        const buyerId = req.player.id;
        const requestedQuantity = req.body.quantity;
        
        // Use shared validation  
        const validation = validatePurchaseQuantity(requestedQuantity, Number.MAX_SAFE_INTEGER);
        if (!validation.valid) {
            return sendError(res, 400, validation.errors[0]);
        }
        
        // Use safe retry wrapper for atomic transaction
        const { data, error } = await supabaseAdmin.rpc('safe_market_purchase', {
            p_listing_id: listingId,
            p_buyer_id: buyerId,
            p_quantity: requestedQuantity
        });
        
        if (error) {
            if (error.message.includes('not available')) {
                return sendError(res, 404, 'Listing not available');
            }
            if (error.message.includes('own listing')) {
                return sendError(res, 400, 'Cannot buy your own listing');
            }
            if (error.message.includes('Insufficient gold')) {
                return sendError(res, 400, 'Insufficient gold');
            }
            console.error('Error purchasing from market:', error);
            return sendError(res, 500, 'Failed to complete purchase');
        }
        
        return sendSuccess(res, {
            purchased: data.purchased,
            total_cost: data.total_cost,
            complete: data.complete
        });
        
    } catch (error) {
        console.error('Error buying from market:', error);
        return sendError(res, 500, 'Internal server error');
    }
});

// DELETE /api/market/:id - Cancel own listing (return items)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const listingId = parseInt(req.params.id);
        const userId = req.player.id;
        
        // Use safe retry wrapper for atomic transaction
        const { data, error } = await supabaseAdmin.rpc('safe_cancel_listing', {
            p_listing_id: listingId,
            p_user_id: userId
        });
        
        if (error) {
            if (error.message.includes('not found')) {
                return sendError(res, 404, 'Listing not found or already sold');
            }
            console.error('Error cancelling listing:', error);
            return sendError(res, 500, 'Failed to cancel listing');
        }
        
        return sendSuccess(res, {
            returned: data.returned,
            item_type: data.item_type
        });
        
    } catch (error) {
        console.error('Error cancelling listing:', error);
        return sendError(res, 500, 'Internal server error');
    }
});

// GET /api/market/my-listings - Get own listings (active and sold)
router.get('/my-listings', requireAuth, async (req, res) => {
    try {
        const userId = req.player.id;
        
        const { data: listings, error } = await supabaseAdmin
            .from('market')
            .select(`
                *,
                buyer:players!buyer_id(username)
            `)
            .eq('seller_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error('Error fetching own listings:', error);
            return sendError(res, 500, 'Failed to fetch listings');
        }
        
        // Format listings with status
        const formattedListings = listings.map(listing => ({
            ...listing,
            status: listing.buyer_id === listing.seller_id ? 'cancelled' :
                    listing.buyer_id ? 'sold' : 'active',
            buyer_name: listing.buyer?.username || null
        }));
        
        res.json(formattedListings);
    } catch (error) {
        console.error('Error fetching own listings:', error);
        return sendError(res, 500, 'Internal server error');
    }
});

export default router;