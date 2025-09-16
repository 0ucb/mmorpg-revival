import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import beachRoutes from './routes/beach.js';
import templeRoutes from './routes/temple.js';
import equipmentRoutes from './routes/equipment.js';
import playersRoutes from './routes/players.js';
import blacksmithRoutes from './routes/blacksmith.js';
import armourerRoutes from './routes/armourer.js';
import gemsStoreRoutes from './routes/gems-store.js';
import marketRoutes from './routes/market.js';
import resourcesRoutes from './routes/resources.js';
import { manaRegenerationService } from './services/manaRegeneration.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'MarcoLand Revival API Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            docs: '/api/docs',
            health: '/api/health',
            auth: '/api/auth/*',
            game: {
                beach: '/api/beach',
                temple: '/api/temple', 
                equipment: '/api/equipment',
                blacksmith: '/api/blacksmith',
                armourer: '/api/armourer',
                'gems-store': '/api/gems-store',
                market: '/api/market',
                resources: '/api/resources'
            }
        }
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/beach', beachRoutes);
app.use('/api/temple', templeRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/blacksmith', blacksmithRoutes);
app.use('/api/armourer', armourerRoutes);
app.use('/api/gems-store', gemsStoreRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/resources', resourcesRoutes);

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
            beach: {
                'GET /api/beach/monsters': 'List all monsters available for fighting',
                'POST /api/beach/fight': 'Fight a monster (requires mana)'
            },
            temple: {
                'POST /api/temple/pray': 'Spend mana to gain random stat points (5/50/all mana)',
                'GET /api/temple/efficiency': 'Get current prayer efficiency based on total stats'
            },
            equipment: {
                'GET /api/equipment/shop': 'View available equipment for purchase (query: type=all/weapons/armor)',
                'POST /api/equipment/purchase': 'Buy equipment with gold validation',
                'POST /api/equipment/sell': 'Sell unequipped items back to shop for 50% of original cost',
                'GET /api/equipment/inventory': 'View player\'s equipped items and inventory',
                'POST /api/equipment/slot/:slot': 'Equip/unequip items in specific slots (weapon/head/body/legs/hands/feet)'
            },
            players: {
                'GET /api/players/:username': 'Get player profile',
                'PUT /api/players/:username': 'Update player profile',
                'GET /api/players/:username/inventory': 'Get player inventory',
                'GET /api/players/:username/stats': 'Get player stats',
                'POST /api/players/:username/action': 'Execute player action',
                'GET /api/players/leaderboard': 'Get leaderboard'
            },
            // Equipment system replaces generic items API
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