const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const missions = require('../data/missions.json');

async function scrapeMissionPages() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    for (const mission of missions) {
        try {
            console.log(`Scraping: ${mission.name}`);
            const page = await browser.newPage();
            
            // Set viewport for consistent capture
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Navigate to the mission page
            await page.goto(mission.url, { waitUntil: 'networkidle2' });
            
            // Wait for main content to load
            await page.waitForSelector('main', { timeout: 10000 }).catch(() => {});
            
            // Extract the profile image URL before removing elements
            const imageUrl = await page.evaluate(() => {
                const img = document.querySelector('.mission-profile-image');
                return img ? img.src : null;
            });

            // Save image URL to mission data
            if (imageUrl) {
                mission.image = imageUrl;
                console.log(`  Found image: ${imageUrl}`);
            }

            // Remove navigation, footer, and process links
            await page.evaluate(() => {
                // Remove unwanted elements
                const elementsToRemove = ['header', 'nav', 'footer', '.navigation', '.menu'];
                elementsToRemove.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => el.remove());
                });
                
                // Find all links
                const links = document.querySelectorAll('a');
                links.forEach(link => {
                    // Check if link text contains "back" (case insensitive)
                    const linkText = link.textContent.toLowerCase().trim();
                    if (linkText === 'back' || linkText === 'go back' || linkText === '← back' || linkText === '< back' || linkText.includes('back to')) {
                        // Remove the entire link element
                        link.remove();
                    } else {
                        // For all other links, convert to plain text
                        const textNode = document.createTextNode(link.textContent);
                        link.parentNode.replaceChild(textNode, link);
                    }
                });
                
                // Also remove any buttons that might say "back"
                const buttons = document.querySelectorAll('button');
                buttons.forEach(button => {
                    const buttonText = button.textContent.toLowerCase().trim();
                    if (buttonText.includes('back')) {
                        button.remove();
                    }
                });
            });
            
            // Get the page content
            const content = await page.content();
            
            // Create filename from mission name
            const filename = mission.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.html';
            const filepath = path.join(__dirname, '../pages', filename);
            
            // Add mission id to the data
            mission.localFile = filename;
            
            // Save the scraped content
            await fs.ensureDir(path.join(__dirname, '../pages'));
            await fs.writeFile(filepath, content);
            
            console.log(`✓ Saved: ${filename}`);
            await page.close();
            
        } catch (error) {
            console.error(`✗ Error scraping ${mission.name}:`, error.message);
        }
    }
    
    await browser.close();
    
    // Update missions.json with local file references
    await fs.writeJson(path.join(__dirname, '../data/missions.json'), missions, { spaces: 2 });
    console.log('\nScraping complete! Updated missions.json with local file references.');
}

scrapeMissionPages();