import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WikiScraper {
    constructor() {
        this.baseURL = 'https://web.archive.org';
        this.outputDir = path.join(__dirname, '../scraped-data/wiki');
        this.visitedURLs = new Set();
        this.wikiPages = new Set();
        
        // Best timestamps for different parts
        this.timestamps = {
            wiki: '20080828093017',  // Latest wiki snapshot
            game: '20080408054022',   // Good game snapshot
            fallback: '20060615011346' // Earlier snapshot
        };
    }

    async init() {
        await fs.ensureDir(this.outputDir);
        await fs.ensureDir(path.join(this.outputDir, 'pages'));
        await fs.ensureDir(path.join(this.outputDir, 'extracted'));
    }

    async fetchPage(url, retries = 2) {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`Fetching: ${url}`);
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 15000
                });
                return response.data;
            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error.message);
                if (i === retries - 1) return null;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return null;
    }

    async scrapeWikiIndex() {
        console.log('\n=== Scraping Wiki Index ===');
        
        // Try multiple wiki entry points
        const wikiUrls = [
            `${this.baseURL}/web/${this.timestamps.wiki}/http://www.tiipsi.com/dokuwiki/`,
            `${this.baseURL}/web/${this.timestamps.wiki}/http://www.tiipsi.com/dokuwiki/doku.php`,
            `${this.baseURL}/web/${this.timestamps.game}/http://www.tiipsi.com/dokuwiki/doku.php`
        ];
        
        for (const url of wikiUrls) {
            const html = await this.fetchPage(url);
            if (!html) continue;
            
            const $ = cheerio.load(html);
            
            // Extract all wiki page links
            $('a').each((i, elem) => {
                const href = $(elem).attr('href');
                const text = $(elem).text().trim();
                
                if (href && href.includes('doku.php')) {
                    // Clean and store the URL
                    const cleanUrl = href.replace(/PHPSESSID=[a-z0-9]+&?/gi, '');
                    
                    // Extract page ID if present
                    const idMatch = cleanUrl.match(/id=([^&]+)/);
                    if (idMatch) {
                        this.wikiPages.add({
                            id: idMatch[1],
                            url: cleanUrl,
                            title: text
                        });
                    }
                }
            });
            
            // Save the index page
            await fs.writeFile(
                path.join(this.outputDir, 'index.html'),
                html
            );
            
            // Extract visible text content
            const content = $('.dokuwiki').html() || $('#wikicontent').html() || $('body').html();
            if (content) {
                await fs.writeFile(
                    path.join(this.outputDir, 'index_content.html'),
                    content
                );
            }
            
            break; // If we got a page, stop trying others
        }
        
        console.log(`Found ${this.wikiPages.size} wiki pages`);
    }

    async scrapeWikiPage(pageInfo) {
        // Try to construct the wayback URL
        const pageUrl = `${this.baseURL}/web/${this.timestamps.wiki}/http://www.tiipsi.com/dokuwiki/doku.php?id=${pageInfo.id}`;
        
        const html = await this.fetchPage(pageUrl);
        if (!html) {
            // Try fallback timestamp
            const fallbackUrl = `${this.baseURL}/web/${this.timestamps.fallback}/http://www.tiipsi.com/dokuwiki/doku.php?id=${pageInfo.id}`;
            const fallbackHtml = await this.fetchPage(fallbackUrl);
            if (!fallbackHtml) return null;
            return this.processWikiPage(fallbackHtml, pageInfo);
        }
        
        return this.processWikiPage(html, pageInfo);
    }

    processWikiPage(html, pageInfo) {
        const $ = cheerio.load(html);
        
        // Save raw HTML
        const filename = pageInfo.id.replace(/[^a-z0-9_-]/gi, '_');
        fs.writeFileSync(
            path.join(this.outputDir, 'pages', `${filename}.html`),
            html
        );
        
        // Extract and save content
        const wikiContent = {
            id: pageInfo.id,
            title: pageInfo.title,
            content: '',
            tables: [],
            lists: [],
            code: [],
            links: []
        };
        
        // Get main content
        const contentArea = $('.dokuwiki').first() || $('#wikicontent').first() || $('.page').first();
        if (contentArea.length) {
            wikiContent.content = contentArea.text().trim();
            
            // Extract tables (might contain game data)
            contentArea.find('table').each((i, table) => {
                const tableData = [];
                $(table).find('tr').each((j, row) => {
                    const rowData = [];
                    $(row).find('td, th').each((k, cell) => {
                        rowData.push($(cell).text().trim());
                    });
                    tableData.push(rowData);
                });
                wikiContent.tables.push(tableData);
            });
            
            // Extract lists
            contentArea.find('ul, ol').each((i, list) => {
                const listItems = [];
                $(list).find('li').each((j, item) => {
                    listItems.push($(item).text().trim());
                });
                wikiContent.lists.push(listItems);
            });
            
            // Extract code blocks
            contentArea.find('pre, code').each((i, code) => {
                wikiContent.code.push($(code).text().trim());
            });
            
            // Extract internal links
            contentArea.find('a').each((i, link) => {
                const href = $(link).attr('href');
                if (href && href.includes('doku.php')) {
                    wikiContent.links.push({
                        text: $(link).text().trim(),
                        href: href
                    });
                }
            });
        }
        
        // Save extracted content
        fs.writeJsonSync(
            path.join(this.outputDir, 'extracted', `${filename}.json`),
            wikiContent,
            { spaces: 2 }
        );
        
        return wikiContent;
    }

    async scrapeAllWikiPages() {
        console.log('\n=== Scraping All Wiki Pages ===');
        
        const wikiPagesArray = Array.from(this.wikiPages);
        const gameInfo = {
            pages: [],
            gameData: {},
            items: [],
            monsters: [],
            quests: [],
            skills: [],
            locations: []
        };
        
        for (let i = 0; i < wikiPagesArray.length; i++) {
            const page = wikiPagesArray[i];
            console.log(`Scraping ${i + 1}/${wikiPagesArray.length}: ${page.id}`);
            
            const content = await this.scrapeWikiPage(page);
            if (content) {
                gameInfo.pages.push(page.id);
                
                // Try to categorize content based on page ID or content
                const pageId = page.id.toLowerCase();
                const contentText = content.content.toLowerCase();
                
                if (pageId.includes('item') || contentText.includes('weapon') || contentText.includes('armor')) {
                    gameInfo.items.push(content);
                } else if (pageId.includes('monster') || contentText.includes('creature') || contentText.includes('enemy')) {
                    gameInfo.monsters.push(content);
                } else if (pageId.includes('quest') || contentText.includes('mission')) {
                    gameInfo.quests.push(content);
                } else if (pageId.includes('skill') || contentText.includes('ability')) {
                    gameInfo.skills.push(content);
                } else if (pageId.includes('location') || pageId.includes('map') || contentText.includes('area')) {
                    gameInfo.locations.push(content);
                }
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Save summary
        await fs.writeJson(
            path.join(this.outputDir, 'game_info_summary.json'),
            gameInfo,
            { spaces: 2 }
        );
        
        console.log('\nGame Information Summary:');
        console.log(`- Total pages: ${gameInfo.pages.length}`);
        console.log(`- Items: ${gameInfo.items.length}`);
        console.log(`- Monsters: ${gameInfo.monsters.length}`);
        console.log(`- Quests: ${gameInfo.quests.length}`);
        console.log(`- Skills: ${gameInfo.skills.length}`);
        console.log(`- Locations: ${gameInfo.locations.length}`);
    }

    async run() {
        await this.init();
        
        console.log('Starting MarcoLand Wiki Scraper...');
        console.log('This will extract all game documentation from the wiki\n');
        
        // First get the wiki index
        await this.scrapeWikiIndex();
        
        // Then scrape all found pages
        if (this.wikiPages.size > 0) {
            await this.scrapeAllWikiPages();
        } else {
            console.log('No wiki pages found to scrape');
        }
        
        console.log('\n=== Wiki Scraping Complete! ===');
        console.log(`Check ${this.outputDir} for extracted content`);
    }
}

// Run the wiki scraper
const scraper = new WikiScraper();
scraper.run().catch(console.error);