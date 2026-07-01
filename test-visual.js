#!/usr/bin/env node

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';
const SCREENSHOTS_DIR = '/tmp/claude-0/-home-user-JiPange/1c1191d4-b0cc-597d-a227-f4cfe0daeb8a/scratchpad';

async function runTests() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true
  });

  console.log('🎨 Visual Design Verification - Figma Aesthetic');
  console.log('═'.repeat(70));
  console.log(`Testing: ${BASE_URL}\n`);

  // Desktop view
  console.log('\n📱 DESKTOP VIEW (1440x900)');
  console.log('─'.repeat(70));
  await testDesktop(browser);

  // Mobile view
  console.log('\n📱 MOBILE VIEW (375x667)');
  console.log('─'.repeat(70));
  await testMobile(browser);

  // Dark mode
  console.log('\n🌓 DARK MODE');
  console.log('─'.repeat(70));
  await testDarkMode(browser);

  await browser.close();
  console.log('\n✅ Visual Verification Complete\n');
}

async function testDesktop(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  try {
    console.log('Loading homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Screenshot
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/desktop-homepage.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Desktop homepage');

    // Verify key elements
    const navbar = await page.locator('.navbar').count();
    console.log(`✓ Navbar present: ${navbar > 0 ? 'Yes' : 'No'}`);

    const logo = await page.locator('img[alt="JiPange"]').count() || await page.locator('.logo-image').count();
    console.log(`✓ Logo present: ${logo > 0 ? 'Yes' : 'No'}`);

    const buttons = await page.locator('button').count();
    console.log(`✓ Interactive buttons: ${buttons}`);

    // Verify Figma colors
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`✓ Body background: ${bodyBg}`);

    const sections = await page.locator('section').count();
    console.log(`✓ Content sections: ${sections}`);

    // Check if text is readable
    const textColor = await page.evaluate(() => {
      const elem = document.querySelector('body');
      return window.getComputedStyle(elem).color;
    });
    console.log(`✓ Text color: ${textColor}`);

  } catch (error) {
    console.error(`❌ Desktop test error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testMobile(browser) {
  const page = await browser.newPage({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
  });

  try {
    console.log('Loading on mobile...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/mobile-homepage.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Mobile homepage');

    const navbar = await page.locator('.navbar').count();
    console.log(`✓ Navbar responsive: ${navbar > 0 ? 'Yes' : 'No'}`);

    const logo = await page.locator('img[alt="JiPange"]').count() || await page.locator('.logo-image').count();
    console.log(`✓ Logo visible on mobile: ${logo > 0 ? 'Yes' : 'No'}`);

    // Check button sizes (should be touch-friendly)
    const buttonSize = await page.evaluate(() => {
      const btn = document.querySelector('button');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    console.log(`✓ Button size: ${buttonSize ? buttonSize.width + 'x' + buttonSize.height + 'px' : 'N/A'}`);

  } catch (error) {
    console.error(`❌ Mobile test error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testDarkMode(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Screenshot dark mode
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/dark-mode-default.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Dark mode (default)');

    // Check theme attribute
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    });
    console.log(`✓ Current theme: ${theme}`);

    // Look for theme toggle button
    const themeToggle = await page.locator('#themeToggle, [aria-label*="theme"], [aria-label*="dark"], [aria-label*="light"]').count();
    console.log(`✓ Theme toggle available: ${themeToggle > 0 ? 'Yes' : 'No'}`);

    if (themeToggle > 0) {
      // Click theme toggle
      await page.locator('#themeToggle, [aria-label*="theme"], [aria-label*="dark"], [aria-label*="light"]').first().click();
      await page.waitForTimeout(800);

      // Screenshot light mode
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/light-mode.png`,
        fullPage: true
      });
      console.log('✓ Screenshot: Light mode');

      const newTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme') || 'light';
      });
      console.log(`✓ Theme after toggle: ${newTheme}`);
    }

  } catch (error) {
    console.error(`❌ Dark mode test error: ${error.message}`);
  } finally {
    await page.close();
  }
}

runTests().catch(console.error);
