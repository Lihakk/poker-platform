process.chdir(require('node:path').resolve(__dirname, '..'));
const { chromium } = require('../frontend/node_modules/playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
 const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
 const page = await browser.newPage({ viewport: { width: 1240, height: 800 } });
 await page.goto(pathToFileURL(path.resolve('docs/deployment-diagram.svg')).href);
 await page.locator('svg').screenshot({ path: path.resolve('docs/screenshots/deployment-diagram.png') });
 await page.goto(pathToFileURL(path.resolve('docs/wireframes.html')).href);
 for (const id of ['landing','dashboard','editor']) await page.locator('#wireframe-'+id).screenshot({ path: path.resolve('docs/screenshots/wireframe-'+id+'.png') });
 await browser.close();
 console.log('Updated diagram and three wireframe screenshots.');
})().catch(error => { console.error(error); process.exit(1); });
