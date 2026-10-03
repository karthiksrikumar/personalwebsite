import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('.cache/screenshots', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const errors = [], failures = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.url().startsWith('http://127.0.0.1:5173') && response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
async function checkImages() { await page.locator('img').evaluateAll(async images => { images.forEach(image => image.loading = 'eager'); await Promise.all(images.map(image => image.decode().catch(() => {}))); }); const bad = await page.locator('img').evaluateAll(images => images.filter(i => !i.naturalWidth).map(i => i.src)); expect(bad).toEqual([]); }
for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  await page.setViewportSize(viewport);
  for (const route of ['projects', 'research', 'equity']) {
    await page.goto(`http://127.0.0.1:5173/#/${route}`, { waitUntil: 'networkidle' });
    await checkImages();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.cache/screenshots/${route}-${viewport.width}.png`, fullPage: true });
    if (route === 'projects') {
      for (let i = 0; i < 6; i++) { await page.locator('[data-project]').nth(i).click(); await expect(page.locator('dialog')).toBeVisible(); await checkImages(); await page.keyboard.press('Escape'); await expect(page.locator('dialog')).not.toBeVisible(); }
    }
    if (route === 'research') {
      await page.locator('[data-year="2026"]').click(); await expect(page.locator('.paper-row')).toHaveCount(1);
      await page.locator('[data-year="2025"]').click(); await expect(page.locator('.paper-row')).toHaveCount(4);
      await page.locator('[data-year="all"]').click(); await expect(page.locator('.paper-row')).toHaveCount(5);
      await page.locator('[data-cite]').first().click(); await expect(page.locator('dialog pre')).toContainText('Arnav Sharma and Ahmed Wez and Karthik Srikumar'); await page.keyboard.press('Escape');
    }
    if (route === 'equity') { await page.locator('[data-photo]').first().click(); await expect(page.locator('.full-photo')).toBeVisible(); await page.keyboard.press('Escape'); }
  }
}
await page.goto('http://127.0.0.1:5173/');
await page.locator('.portrait-stage[data-loaded="true"]').waitFor({ timeout: 60000 });
await expect(page.locator('[data-pause]')).toHaveAttribute('aria-pressed', 'true');
await page.goto('http://127.0.0.1:5173/#/gala');
await page.locator('.gallery-stage[data-loaded="7"]').waitFor({ timeout: 120000 });
await page.screenshot({ path: '.cache/screenshots/gala-mobile.png', fullPage: true });
for (let i = 0; i < 7; i++) { await page.locator(`[data-sculpture="${i}"]`).click(); await expect(page.locator('.gala-detail-number')).toHaveText(`${String(i + 1).padStart(2, '0')} / 07`); }
await page.locator('[data-overview]').click();
expect(errors).toEqual([]); expect(failures).toEqual([]);
await writeFile('.cache/site-check.json', JSON.stringify({ errors, failures, result: 'passed', viewports: ['1440x1000', '390x844'], checks: ['all routes', 'all images', 'all project dialogs', 'paper year filters', 'BibTeX', 'photo lightbox', 'reduced motion', 'all 7 sculptures', 'mobile overflow'] }, null, 2));
console.log('PASS: desktop/mobile routes, asset loading, project dialogs, research filters, citations, photography, reduced motion, and all sculpture controls.');
await browser.close();
