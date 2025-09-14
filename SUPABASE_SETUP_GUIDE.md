# Supabase Setup Guide for MarcoLand Revival

This guide walks through setting up Supabase for the MarcoLand Revival MMORPG project, including database setup, authentication configuration, and API keys.

## Prerequisites

- A Supabase account (free tier works fine)
- Access to the project repository
- Basic understanding of SQL and database concepts

## Step 1: Create Supabase Project

### 1.1 Sign Up for Supabase
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### 1.2 Create New Project
1. Click "New Project" in your dashboard
2. Choose your organization (or create one)
3. Fill out project details:
   - **Name**: `marcoland-revival` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free (sufficient for development)
4. Click "Create new project"
5. Wait 2-3 minutes for project initialization

## Step 2: Get API Keys and URLs

### 2.1 Find Project Settings
1. In your Supabase dashboard, click on your project
2. Go to **Settings** → **API** in the left sidebar

### 2.2 Copy Required Values
You'll need these three values:

```
Project URL: https://your-project-ref.supabase.co
anon/public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important**: 
- The `anon` key is safe to use in frontend code
- The `service_role` key bypasses Row Level Security - keep it secret!
- Never commit service_role key to version control

## Step 3: Configure Environment Variables

### 3.1 Update .env File
Replace the placeholder values in your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-service-key

# Server Configuration
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3.2 Verify Environment Loading
Test that your environment variables load correctly:

```bash
cd your-project-directory
node -e "require('dotenv').config(); console.log('URL:', process.env.SUPABASE_URL)"
```

Should output your Supabase URL, not "placeholder".

## Step 4: Set Up Database Schema

### 4.1 Access SQL Editor
1. In Supabase dashboard, go to **SQL Editor** in the left sidebar
2. You'll see a query interface where you can run SQL commands

### 4.2 Run Database Scripts in Order
Execute these files in the SQL Editor **in this exact order**:

#### Step 1: Core Schema
```sql
-- Copy and paste contents of /database/schema.sql
-- This creates the basic table structure
```

#### Step 2: API Functions  
```sql
-- Copy and paste contents of /database/api-functions.sql
-- This creates stored procedures and functions
```

#### Step 3: System Tables
```sql
-- Copy and paste contents of /database/system-tables.sql  
-- This adds logging and configuration tables
```

#### Step 4: Row Level Security
```sql
-- Copy and paste contents of /database/rls-policies.sql
-- This sets up security policies
```

### 4.3 Verify Schema Setup
After running all scripts, check the **Table Editor** to confirm these tables exist:
- `players`
- `player_stats`
- `creatures`
- `items`
- `inventory`
- `quests`
- `player_quests`
- `system_logs`
- `game_config`
- `pvp_logs`

## Step 5: Configure Authentication

### 5.1 Enable Auth Providers
1. Go to **Authentication** → **Providers** in Supabase dashboard
2. **Email** should already be enabled
3. For social login, configure these providers:

#### Google OAuth (Optional)
1. Click on **Google** provider
2. Enable the provider
3. Add your Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
4. Set redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`

#### Discord OAuth (Optional)  
1. Click on **Discord** provider
2. Enable the provider
3. Add your Discord application credentials
4. Set redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`

#### GitHub OAuth (Optional)
1. Click on **GitHub** provider  
2. Enable the provider
3. Add your GitHub OAuth app credentials
4. Set redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`

### 5.2 Configure Auth Settings
1. Go to **Authentication** → **Settings**
2. **Site URL**: `http://localhost:3000` (for development)
3. **Redirect URLs**: Add `http://localhost:3000/auth/callback`

## Step 6: Seed Database with Game Data

### 6.1 Run Monster Seeder
```bash
cd your-project-directory
node database/seeders/monsters.js
```

You should see output like:
```
🌱 Seeding monsters...
✅ Successfully seeded 30 monsters
Monsters range from level 1 to 201
```

### 6.2 Verify Monster Data
1. In Supabase dashboard, go to **Table Editor**
2. Click on the `creatures` table
3. You should see 30 monsters with names like "Goblin", "Dragon King", "Nazgul"

## Step 7: Test the Setup

### 7.1 Start the Server
```bash
npm run dev
```

Should output:
```
MMORPG API Server running on port 3000
Environment: development  
API Documentation: http://localhost:3000/api/docs
[timestamp] Starting mana regeneration...
```

### 7.2 Test API Endpoints

#### Health Check
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{"status":"ok","timestamp":"...","environment":"development"}
```

#### API Documentation
Visit: http://localhost:3000/api/docs

Should show all endpoints including the new beach combat endpoints.

### 7.3 Test Authentication Flow
1. Open: http://localhost:3000/test-auth.html
2. Try registering a new account
3. Verify you can login/logout
4. Check that session persists

## Step 8: Test Combat System

### 8.1 Register Test Account
1. Use the test interface to create an account
2. Note the authentication token from the session response

### 8.2 Test Monster Listing
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:3000/api/beach/monsters
```

Should return list of 30 monsters with stats.

### 8.3 Test Combat
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json" \
     -d '{"monsterId":"GOBLIN_ID_HERE","manaToSpend":1}' \
     http://localhost:3000/api/beach/fight
```

Should return combat results with detailed combat log.

## Troubleshooting

### Common Issues

#### "Missing Supabase environment variables"
- Double-check your `.env` file has the correct values
- Ensure no extra spaces or quotes around the values
- Restart the server after changing `.env`

#### "Failed to fetch monsters" 
- Verify the monster seeder ran successfully
- Check the creatures table has data in Supabase dashboard
- Ensure RLS policies allow service_role access

#### Authentication not working
- Check that auth providers are properly configured
- Verify redirect URLs match your local development setup
- Ensure Site URL is set to `http://localhost:3000`

#### Database connection issues
- Verify your Supabase project URL is correct
- Check that your service_role key has the right permissions
- Try running a simple query in the Supabase SQL editor

### Getting Help

#### Supabase Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

#### Project-Specific Issues
- Check the server logs for detailed error messages
- Verify all database scripts ran without errors
- Test individual API endpoints to isolate issues

## Security Best Practices

### Production Deployment
- Use environment variables for all sensitive data
- Never commit `.env` files to version control
- Regularly rotate API keys
- Set up proper CORS policies
- Use HTTPS in production
- Configure proper redirect URLs for your domain

### Database Security
- Row Level Security policies are enabled by default
- Service role key bypasses RLS - use carefully
- Regularly review access logs
- Set up database backups

## Next Steps

Once Supabase is set up and working:

1. **Test the complete combat system** with real authentication
2. **Set up automated backups** for your database  
3. **Configure monitoring** for API usage and errors
4. **Plan for production deployment** with proper security
5. **Consider upgrading** to Supabase Pro if you need more resources

The MarcoLand Revival project should now be fully functional with authentic combat mechanics, user authentication, and data persistence!