import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import { manaRegenerationService } from './services/manaRegeneration.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        version: '1.0.0',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Register new player',
                'POST /api/auth/login': 'Login player',
                'POST /api/auth/logout': 'Logout player',
                'GET /api/auth/session': 'Get current session'
            },
            players: {
                'GET /api/players/:username': 'Get player profile',
                'PUT /api/players/:username': 'Update player profile',
                'GET /api/players/:username/inventory': 'Get player inventory',
                'GET /api/players/:username/stats': 'Get player stats',
                'POST /api/players/:username/action': 'Execute player action',
                'GET /api/players/leaderboard': 'Get leaderboard'
            },
            items: {
                'GET /api/items': 'List all items',
                'GET /api/items/:id': 'Get item details',
                'POST /api/items/use': 'Use an item',
                'POST /api/items/equip': 'Equip an item',
                'POST /api/items/unequip': 'Unequip an item'
            },
            combat: {
                'POST /api/combat/attack': 'Attack target',
                'GET /api/combat/logs/:playerId': 'Get combat logs',
                'POST /api/combat/flee': 'Flee from combat'
            },
            quests: {
                'GET /api/quests': 'List available quests',
                'GET /api/quests/:playerId': 'Get player quests',
                'POST /api/quests/accept': 'Accept quest',
                'POST /api/quests/complete': 'Complete quest',
                'POST /api/quests/abandon': 'Abandon quest'
            },
            market: {
                'GET /api/market/listings': 'Get market listings',
                'POST /api/market/list': 'Create listing',
                'POST /api/market/buy': 'Buy from market',
                'DELETE /api/market/listing/:id': 'Cancel listing'
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

const server = app.listen(PORT, () => {
    console.log(`MMORPG API Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`API Documentation: http://localhost:${PORT}/api/docs`);
    
    manaRegenerationService.start().catch(console.error);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    manaRegenerationService.stop();
    server.close(() => {
        console.log('HTTP server closed');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    manaRegenerationService.stop();
    server.close(() => {
        console.log('HTTP server closed');
    });
});