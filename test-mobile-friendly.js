#!/usr/bin/env node

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

async function runMobileFriendlyTest() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true
  });

  console.log('📱 Mobile-Friendly Audit');
  console.log('═'.repeat(70));
  console.log(`Testing: ${BASE_URL}\n`);

  // Test multiple mobile sizes
  const mobileDevices = [
    { name: 'iPhone SE (375x667)', width: 375, height: 667 },
    { name: 'iPhone 12 (390x844)', width: 390, height: 844 },
    { name: 'Pixel 4 (412x891)', width: 412, height: 891 },
    { name: 'Galaxy S21 (360x800)', width: 360, height: 800 },
    { name: 'iPad (768x1024)', width: 768, height: 1024 }
  ];

  for (const device of mobileDevices) {
    console.log(`\n📱 ${device.name}`);
    console.log('─'.repeat(70));
    await testMobileDevice(browser, device);
  }

  await browser.close();
  console.log('\n✅ Mobile-Friendly Audit Complete\n');
}

async function testMobileDevice(browser, device) {
  const page = await browser.newPage({
    viewport: { width: device.width, height: device.height },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Check viewport meta tag
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : 'NOT FOUND';
    });
    console.log(`✓ Viewport Meta: ${viewportMeta === 'NOT FOUND' ? '❌' : '✓'}`);

    // 2. Check min font size
    const fontSizes = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button, label, input');
      let minSize = 999;
      elements.forEach(el => {
        const fontSize = parseInt(window.getComputedStyle(el).fontSize);
        if (fontSize < minSize && fontSize > 0) minSize = fontSize;
      });
      return minSize === 999 ? null : minSize;
    });
    console.log(`✓ Min Font Size: ${fontSizes}px (${fontSizes >= 12 ? '✓ Good' : '❌ Too small'})`);

    // 3. Check button/touch target sizes
    const touchTargets = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a[role="button"], [onclick]');
      let smallTargets = 0;
      let totalButtons = 0;

      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        totalButtons++;
        // Touch targets should be at least 48x48px
        if (rect.width < 44 || rect.height < 44) {
          smallTargets++;
        }
      });
      return { total: totalButtons, small: smallTargets };
    });
    console.log(`✓ Touch Targets: ${touchTargets.total} buttons (${touchTargets.small} below 44px)`);

    // 4. Check for responsive images
    const images = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      let responsive = 0;
      let total = imgs.length;

      imgs.forEach(img => {
        const style = window.getComputedStyle(img);
        const maxWidth = style.maxWidth;
        const width = style.width;
        // Check if image has responsive properties
        if (maxWidth !== 'none' || (width && width.includes('%'))) {
          responsive++;
        }
      });
      return { total, responsive };
    });
    console.log(`✓ Images: ${images.total} total (${images.responsive} responsive)`);

    // 5. Check text contrast
    const contrast = await page.evaluate(() => {
      const elements = document.querySelectorAll('body *');
      let goodContrast = 0;
      let checkedElements = 0;

      elements.forEach(el => {
        if (el.children.length === 0 && el.textContent.trim().length > 0) {
          const color = window.getComputedStyle(el).color;
          const bgColor = window.getComputedStyle(el).backgroundColor;
          // Very basic check - just verify colors are set
          if (color !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
            goodContrast++;
          }
          checkedElements++;
        }
      });
      return { checked: checkedElements, good: goodContrast };
    });
    console.log(`✓ Text Contrast: ${contrast.good}/${contrast.checked} elements have colors`);

    // 6. Check horizontal overflow
    const overflow = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      return {
        bodyWidth: body.scrollWidth,
        viewportWidth: html.clientWidth,
        hasOverflow: body.scrollWidth > html.clientWidth
      };
    });
    console.log(`✓ Overflow: ${overflow.hasOverflow ? '❌ Horizontal scroll detected' : '✓ No overflow'}`);

    // 7. Check navigation usability
    const nav = await page.evaluate(() => {
      const navbar = document.querySelector('.navbar');
      const buttons = document.querySelectorAll('button');
      return {
        hasNav: !!navbar,
        buttonCount: buttons.length,
        navHeight: navbar ? navbar.getBoundingClientRect().height : 0
      };
    });
    console.log(`✓ Navigation: ${nav.hasNav ? '✓ Present' : '❌ Missing'} (${nav.buttonCount} buttons, ${nav.navHeight}px height)`);

    // 8. Check form inputs
    const inputs = await page.evaluate(() => {
      const inputElements = document.querySelectorAll('input, select, textarea');
      let total = inputElements.length;
      let withLabels = 0;

      inputElements.forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) withLabels++;
      });
      return { total, withLabels };
    });
    console.log(`✓ Form Inputs: ${inputs.total} (${inputs.withLabels} with labels)`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

runMobileFriendlyTest().catch(console.error);
