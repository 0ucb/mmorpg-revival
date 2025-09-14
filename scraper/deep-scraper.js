import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeepWaybackScraper {
    constructor() {
        this.baseURL = 'https://web.archive.org';
        this.targetSite = 'tiipsi.com';
        this.outputDir = path.join(__dirname, '../scraped-data');
        this.visitedURLs = new Set();
        this.toVisit = [];
        this.timestamp = '20080330194024'; // Good snapshot
    }

    async init() {
        await fs.ensureDir(this.outputDir);
        await fs.ensureDir(path.join(this.outputDir, 'html'));
        await fs.ensureDir(path.join(this.outputDir, 'wiki'));
        await fs.ensureDir(path.join(this.outputDir, 'demo'));
        await fs.ensureDir(path.join(this.outputDir, 'assets'));
        await fs.ensureDir(path.join(this.outputDir, 'game-logic'));
    }

    async fetchPage(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`Fetching: ${url}`);
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 10000
                });
                return response.data;
            } catch (error) {
                console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
                if (i === retries - 1) return null;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        return null;
    }

    convertToWaybackUrl(url, baseUrl = 'http://www.tiipsi.com/') {
        // Clean up URL
        url = url.replace(/PHPSESSID=[a-z0-9]+/gi, '');
        
        if (url.startsWith('http')) {
            return `${this.baseURL}/web/${this.timestamp}/${url}`;
        } else if (url.startsWith('//')) {
            return `${this.baseURL}/web/${this.timestamp}/http:${url}`;
        } else if (url.startsWith('/')) {
            return `${this.baseURL}/web/${this.timestamp}/${new URL(url, baseUrl).href}`;
        } else {
            return `${this.baseURL}/web/${this.timestamp}/${new URL(url, baseUrl).href}`;
        }
    }

    async scrapeWiki() {
        console.log('\n=== Scraping Wiki Pages ===');
        const wikiBase = 'http://www.tiipsi.com/dokuwiki/';
        const wikiUrl = this.convertToWaybackUrl('dokuwiki/doku.php', 'http://www.tiipsi.com/');
        
        const html = await this.fetchPage(wikiUrl);
        if (!html) return;
        
        const $ = cheerio.load(html);
        const wikiPages = new Set();
        
        // Find all wiki links
        $('a').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && (href.includes('doku.php') || href.includes('dokuwiki'))) {
                const cleanUrl = href.replace(/PHPSESSID=[a-z0-9]+&?/gi, '');
                wikiPages.add(cleanUrl);
            }
        });
        
        // Save main wiki page
        await fs.writeFile(
            path.join(this.outputDir, 'wiki', 'main.html'),
            html
        );
        
        console.log(`Found ${wikiPages.size} wiki pages to scrape`);
        
        // Scrape each wiki page
        for (const page of wikiPages) {
            const pageUrl = this.convertToWaybackUrl(page);
            const pageHtml = await this.fetchPage(pageUrl);
            
            if (pageHtml) {
                const pageName = page.replace(/[^a-z0-9]/gi, '_');
                await fs.writeFile(
                    path.join(this.outputDir, 'wiki', `${pageName}.html`),
                    pageHtml
                );
                
                // Extract game information from wiki
                const $page = cheerio.load(pageHtml);
                const content = $page('.dokuwiki').text() || $page('#wikicontent').text() || $page('body').text();
                
                if (content.length > 100) {
                    await fs.writeFile(
                        path.join(this.outputDir, 'wiki', `${pageName}.txt`),
                        content
                    );
                }
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async scrapeDemo() {
        console.log('\n=== Scraping Demo/Tour Pages ===');
        const demoUrl = this.convertToWaybackUrl('Demo/startdemo.html', 'http://www.tiipsi.com/');
        
        const html = await this.fetchPage(demoUrl);
        if (!html) return;
        
        const $ = cheerio.load(html);
        
        // Save main demo page
        await fs.writeFile(
            path.join(this.outputDir, 'demo', 'startdemo.html'),
            html
        );
        
        // Find all demo-related links and images
        const demoAssets = {
            scripts: [],
            images: [],
            links: [],
            gameContent: {}
        };
        
        // Extract scripts
        $('script').each((i, elem) => {
            const src = $(elem).attr('src');
            const content = $(elem).html();
            
            if (src) {
                demoAssets.scripts.push(src);
            } else if (content && content.length > 50) {
                demoAssets.gameContent[`script_${i}`] = content;
            }
        });
        
        // Extract images (game sprites, maps, etc.)
        $('img').each((i, elem) => {
            const src = $(elem).attr('src');
            const alt = $(elem).attr('alt') || '';
            if (src) {
                demoAssets.images.push({ src, alt, type: 'demo' });
            }
        });
        
        // Find demo navigation
        $('a').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            if (href && (href.includes('demo') || href.includes('Demo'))) {
                demoAssets.links.push({ href, text });
            }
        });
        
        await fs.writeJson(
            path.join(this.outputDir, 'demo', 'demo_assets.json'),
            demoAssets,
            { spaces: 2 }
        );
        
        // Try to find and scrape additional demo pages
        for (const link of demoAssets.links) {
            const pageUrl = this.convertToWaybackUrl(link.href, 'http://www.tiipsi.com/Demo/');
            const pageHtml = await this.fetchPage(pageUrl);
            
            if (pageHtml) {
                const filename = link.href.replace(/[^a-z0-9]/gi, '_');
                await fs.writeFile(
                    path.join(this.outputDir, 'demo', `${filename}.html`),
                    pageHtml
                );
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async scrapeGamePages() {
        console.log('\n=== Scraping Core Game Pages ===');
        
        // Important game pages to scrape
        const gamePages = [
            'subscribe.php',
            'login.php',
            'password.php',
            'what.html',
            'history.html',
            'tos.html',
            'privacy.html',
            'game.php',
            'map.php',
            'inventory.php',
            'stats.php',
            'battle.php',
            'shop.php',
            'guild.php'
        ];
        
        for (const page of gamePages) {
            const pageUrl = this.convertToWaybackUrl(page);
            const html = await this.fetchPage(pageUrl);
            
            if (html) {
                await fs.writeFile(
                    path.join(this.outputDir, 'html', page.replace(/[^a-z0-9]/gi, '_') + '.html'),
                    html
                );
                
                // Extract game logic from PHP pages
                const $ = cheerio.load(html);
                const gameData = {
                    page: page,
                    forms: [],
                    gameLogic: [],
                    apis: []
                };
                
                // Find forms (game actions)
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
                            value: $(input).attr('value')
                        });
                    });
                    
                    gameData.forms.push(form);
                });
                
                // Find AJAX/API calls
                $('script').each((i, elem) => {
                    const code = $(elem).html();
                    if (code && (code.includes('ajax') || code.includes('XMLHttpRequest'))) {
                        gameData.apis.push(code);
                    }
                });
                
                if (gameData.forms.length > 0 || gameData.apis.length > 0) {
                    await fs.writeJson(
                        path.join(this.outputDir, 'game-logic', `${page.replace(/[^a-z0-9]/gi, '_')}_data.json`),
                        gameData,
                        { spaces: 2 }
                    );
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async findAllSnapshots() {
        console.log('\n=== Finding All Available Snapshots ===');
        
        // Get all snapshots for wiki pages specifically
        const wikiCdxUrl = `${this.baseURL}/cdx/search/cdx?url=${this.targetSite}/dokuwiki/*&output=json&collapse=digest`;
        
        try {
            const response = await axios.get(wikiCdxUrl);
            const snapshots = response.data.slice(1);
            
            console.log(`Found ${snapshots.length} unique wiki pages`);
            
            const wikiUrls = snapshots.map(s => ({
                timestamp: s[1],
                url: s[2],
                status: s[4]
            })).filter(s => s.status === '200');
            
            await fs.writeJson(
                path.join(this.outputDir, 'wiki_snapshots.json'),
                wikiUrls,
                { spaces: 2 }
            );
            
            return wikiUrls;
        } catch (error) {
            console.error('Error fetching wiki snapshots:', error.message);
            return [];
        }
    }

    async run() {
        await this.init();
        
        console.log('Starting Deep MarcoLand Scraper...');
        console.log('Target: tiipsi.com');
        console.log(`Timestamp: ${this.timestamp}\n`);
        
        // Find all available snapshots first
        await this.findAllSnapshots();
        
        // Scrape main game pages
        await this.scrapeGamePages();
        
        // Scrape the wiki
        await this.scrapeWiki();
        
        // Scrape the demo/tour
        await this.scrapeDemo();
        
        console.log('\n=== Scraping Complete! ===');
        console.log('Check the scraped-data folder for:');
        console.log('- /wiki - Wiki documentation');
        console.log('- /demo - Demo/tour pages');
        console.log('- /html - Game pages');
        console.log('- /game-logic - Extracted game mechanics');
    }
}

// Run the deep scraper
const scraper = new DeepWaybackScraper();
scraper.run().catch(console.error);