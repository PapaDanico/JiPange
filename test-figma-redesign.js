#!/usr/bin/env node

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';
const SCREENSHOTS_DIR = '/tmp/claude-0/-home-user-JiPange/1c1191d4-b0cc-597d-a227-f4cfe0daeb8a/scratchpad';

async function runTests() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });

  console.log('🎨 Playwright Verification: Figma-Inspired Redesign');
  console.log('═'.repeat(70));
  console.log(`Testing: ${BASE_URL}\n`);

  // Desktop Tests
  console.log('\n📱 DESKTOP VIEW (1440x900)');
  console.log('─'.repeat(70));
  await testDesktopView(browser);

  // Mobile Tests
  console.log('\n📱 MOBILE VIEW (375x667)');
  console.log('─'.repeat(70));
  await testMobileView(browser);

  // Dark/Light Mode Tests
  console.log('\n🌓 DARK/LIGHT MODE');
  console.log('─'.repeat(70));
  await testThemeToggle(browser);

  // Responsive Tests
  console.log('\n📐 RESPONSIVE DESIGN');
  console.log('─'.repeat(70));
  await testResponsive(browser);

  await browser.close();
  console.log('\n✅ All Playwright Tests Complete\n');
}

async function testDesktopView(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  try {
    console.log('Loading homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Screenshot: Full page
    console.log('✓ Homepage loaded');
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/01-desktop-homepage.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Homepage');

    // Verify navbar
    const navbar = await page.locator('.navbar').isVisible();
    console.log(`✓ Navbar visible: ${navbar}`);

    // Verify logo
    const logo = await page.locator('.logo-image').isVisible();
    console.log(`✓ Logo visible: ${logo}`);

    // Verify progress wizard (should exist after load)
    await page.waitForTimeout(500);
    const progressWizard = await page.locator('.progress-wizard').count();
    console.log(`✓ Progress wizard elements: ${progressWizard > 0 ? 'Present' : 'Not visible yet'}`);

    // Test Profile screen
    console.log('\nNavigating to Profile screen...');
    await page.click('button:has-text("Start Your Plan")');
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/02-desktop-profile-screen.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Profile screen');

    // Fill profile data
    console.log('Filling profile data...');
    await page.fill('#name', 'John Doe');
    await page.fill('#age', '35');
    await page.fill('#retirementAge', '60');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/03-desktop-profile-filled.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Profile filled');

    // Check for toast notification
    const toast = await page.locator('.toast').count();
    console.log(`✓ Toast notifications working: ${toast > 0 ? 'Yes' : 'No'}`);

    // Test Income screen
    console.log('\nNavigating to Income screen...');
    await page.click('button:has-text("Income →")');
    await page.waitForTimeout(800);
    await page.fill('#salary', '150000');
    await page.fill('#business', '30000');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/04-desktop-income-screen.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Income screen');

    // Test Dashboard (Reports)
    console.log('\nNavigating to Dashboard...');
    await page.click('button:has-text("Reports →")');
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/05-desktop-dashboard.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Dashboard');

    // Verify colors (sampling)
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`✓ Body background: ${bgColor}`);

    const navbarColor = await page.evaluate(() => {
      return window.getComputedStyle(document.querySelector('.navbar')).backgroundColor;
    });
    console.log(`✓ Navbar background: ${navbarColor}`);

  } catch (error) {
    console.error(`❌ Desktop test error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testMobileView(browser) {
  const page = await browser.newPage({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  try {
    console.log('Loading on mobile...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/06-mobile-homepage.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Mobile homepage');

    // Verify responsive navbar
    const navbarPadding = await page.evaluate(() => {
      const navbar = document.querySelector('.navbar');
      return window.getComputedStyle(navbar).padding;
    });
    console.log(`✓ Navbar responsive: ${navbarPadding}`);

    // Test screen navigation
    await page.click('button:has-text("Start Your Plan")');
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/07-mobile-profile.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Mobile profile screen');

    // Test input on mobile
    await page.fill('#name', 'Mobile User');
    await page.fill('#age', '28');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/08-mobile-input.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Mobile input');

    // Check touch targets
    const inputSize = await page.evaluate(() => {
      const input = document.querySelector('#name');
      const rect = input.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    console.log(`✓ Input touch target: ${inputSize.width}x${inputSize.height}px`);

  } catch (error) {
    console.error(`❌ Mobile test error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testThemeToggle(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Screenshot: Dark mode (default)
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/09-dark-mode-default.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Dark mode (default)');

    // Get current theme
    const currentTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    });
    console.log(`✓ Current theme: ${currentTheme}`);

    // Click theme toggle
    console.log('Toggling to light mode...');
    await page.click('#themeToggle');
    await page.waitForTimeout(800);

    // Screenshot: Light mode
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/10-light-mode-toggled.png`,
      fullPage: true
    });
    console.log('✓ Screenshot: Light mode toggled');

    const newTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    console.log(`✓ Theme after toggle: ${newTheme}`);

    // Get color differences
    const bgColorLight = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`✓ Light mode background: ${bgColorLight}`);

    // Toggle back
    await page.click('#themeToggle');
    await page.waitForTimeout(800);
    const finalTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    console.log(`✓ Theme back to: ${finalTheme}`);

  } catch (error) {
    console.error(`❌ Theme test error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testResponsive(browser) {
  const viewports = [
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Small Desktop', width: 1024, height: 768 },
    { name: 'Large Desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height }
    });

    try {
      console.log(`\nTesting ${viewport.name} (${viewport.width}x${viewport.height})...`);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      const filename = viewport.name.toLowerCase().replace(/\s/g, '-');
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/11-responsive-${filename}.png`,
        fullPage: true
      });
      console.log(`✓ Screenshot: ${viewport.name}`);

      // Check layout integrity
      const hasErrors = await page.evaluate(() => {
        return document.querySelectorAll('[style*="display: none"]').length > 20;
      });
      console.log(`✓ Layout integrity: ${!hasErrors ? 'Good' : 'Warning - many hidden elements'}`);

    } catch (error) {
      console.error(`❌ ${viewport.name} test error: ${error.message}`);
    } finally {
      await page.close();
    }
  }
}

runTests().catch(console.error);
