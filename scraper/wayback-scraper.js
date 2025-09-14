import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WaybackScraper {
    constructor() {
        this.baseURL = 'https://web.archive.org';
        this.targetSite = 'tiipsi.com';
        this.outputDir = path.join(__dirname, '../scraped-data');
        this.visitedURLs = new Set();
    }

    async init() {
        await fs.ensureDir(this.outputDir);
        await fs.ensureDir(path.join(this.outputDir, 'html'));
        await fs.ensureDir(path.join(this.outputDir, 'assets'));
        await fs.ensureDir(path.join(this.outputDir, 'game-logic'));
    }

    async fetchPage(url) {
        try {
            console.log(`Fetching: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error.message);
            return null;
        }
    }

    async exploreTimeline() {
        // Get available snapshots for the site
        const cdxUrl = `${this.baseURL}/cdx/search/cdx?url=${this.targetSite}/*&output=json&collapse=urlkey`;
        
        try {
            const response = await axios.get(cdxUrl);
            const snapshots = response.data.slice(1); // First item is headers
            
            console.log(`Found ${snapshots.length} unique pages`);
            
            // Save snapshot list
            await fs.writeJson(
                path.join(this.outputDir, 'snapshots.json'),
                snapshots.map(s => ({
                    timestamp: s[1],
                    url: s[2],
                    status: s[4],
                    digest: s[5]
                })),
                { spaces: 2 }
            );
            
            return snapshots;
        } catch (error) {
            console.error('Error fetching timeline:', error.message);
            return [];
        }
    }

    async scrapeGamePage(timestamp = '20080330194024') {
        const waybackUrl = `${this.baseURL}/web/${timestamp}/http://www.tiipsi.com/`;
        
        const html = await this.fetchPage(waybackUrl);
        if (!html) return;
        
        const $ = cheerio.load(html);
        
        // Extract game-specific elements
        const gameData = {
            title: $('title').text(),
            timestamp: timestamp,
            url: waybackUrl,
            navigation: [],
            forms: [],
            scripts: [],
            stylesheets: [],
            images: [],
            gameElements: {}
        };
        
        // Find navigation/menu items
        $('a').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            if (href && text) {
                gameData.navigation.push({ href, text });
            }
        });
        
        // Find forms (login, registration, game actions)
        $('form').each((i, elem) => {
            const form = {
                action: $(elem).attr('action'),
                method: $(elem).attr('method'),
                inputs: []
            };
            
            $(elem).find('input, select, textarea').each((j, input) => {
                form.inputs.push({
                    type: $(input).attr('type'),
                    name: $(input).attr('name'),
                    id: $(input).attr('id'),
                    value: $(input).attr('value')
                });
            });
            
            gameData.forms.push(form);
        });
        
        // Find JavaScript files
        $('script[src]').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src) gameData.scripts.push(src);
        });
        
        // Find inline JavaScript (game logic)
        $('script:not([src])').each((i, elem) => {
            const code = $(elem).html();
            if (code && code.length > 50) { // Skip tiny scripts
                gameData.gameElements[`inline_script_${i}`] = code;
            }
        });
        
        // Find CSS files
        $('link[rel="stylesheet"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href) gameData.stylesheets.push(href);
        });
        
        // Find images
        $('img').each((i, elem) => {
            const src = $(elem).attr('src');
            const alt = $(elem).attr('alt');
            if (src) gameData.images.push({ src, alt });
        });
        
        // Save the raw HTML
        await fs.writeFile(
            path.join(this.outputDir, 'html', `page_${timestamp}.html`),
            html
        );
        
        // Save extracted data
        await fs.writeJson(
            path.join(this.outputDir, `game_data_${timestamp}.json`),
            gameData,
            { spaces: 2 }
        );
        
        console.log(`Scraped main page from ${timestamp}`);
        console.log(`- Found ${gameData.navigation.length} navigation links`);
        console.log(`- Found ${gameData.forms.length} forms`);
        console.log(`- Found ${gameData.scripts.length} script files`);
        console.log(`- Found ${gameData.images.length} images`);
        
        return gameData;
    }

    async downloadAsset(assetUrl, timestamp) {
        // Convert relative URLs to Wayback URLs
        let fullUrl = assetUrl;
        
        if (!assetUrl.startsWith('http')) {
            if (assetUrl.startsWith('//')) {
                fullUrl = `http:${assetUrl}`;
            } else if (assetUrl.startsWith('/')) {
                fullUrl = `http://www.tiipsi.com${assetUrl}`;
            } else {
                fullUrl = `http://www.tiipsi.com/${assetUrl}`;
            }
        }
        
        // Convert to Wayback URL
        const waybackAssetUrl = `${this.baseURL}/web/${timestamp}/${fullUrl}`;
        
        try {
            const response = await axios.get(waybackAssetUrl, {
                responseType: 'arraybuffer'
            });
            
            const filename = path.basename(fullUrl.split('?')[0]) || 'index';
            const filepath = path.join(this.outputDir, 'assets', filename);
            
            await fs.writeFile(filepath, response.data);
            console.log(`Downloaded: ${filename}`);
            
            return filepath;
        } catch (error) {
            console.error(`Failed to download ${assetUrl}:`, error.message);
            return null;
        }
    }

    async run() {
        await this.init();
        
        console.log('Starting Tiipsi.com scraper...\n');
        
        // First, explore what's available
        console.log('Exploring available snapshots...');
        const snapshots = await this.exploreTimeline();
        
        // Scrape the main page from a good snapshot
        console.log('\nScraping main game page...');
        const gameData = await this.scrapeGamePage('20080330194024');
        
        if (gameData) {
            // Download some key assets
            console.log('\nDownloading game assets...');
            
            for (const script of gameData.scripts.slice(0, 5)) {
                await this.downloadAsset(script, '20080330194024');
            }
            
            for (const css of gameData.stylesheets.slice(0, 5)) {
                await this.downloadAsset(css, '20080330194024');
            }
            
            for (const img of gameData.images.slice(0, 10)) {
                await this.downloadAsset(img.src, '20080330194024');
            }
        }
        
        console.log('\nScraping complete! Check the scraped-data folder.');
    }
}

// Run the scraper
const scraper = new WaybackScraper();
scraper.run().catch(console.error);