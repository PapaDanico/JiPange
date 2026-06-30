import { chromium } from '@playwright/test';

async function testProduction() {
  console.log('🧪 Testing Production Site: https://jipangefinance.netlify.app');
  console.log('═'.repeat(70));

  const browser = await chromium.launch({
    headless: true
  });

  try {
    // Create page with mobile viewport
    const page = await browser.newPage({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36'
    });

    // Navigate to main URL
    console.log('\n📱 Loading: https://jipangefinance.netlify.app');
    const response = await page.goto('https://jipangefinance.netlify.app', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    console.log(`   Status: ${response?.status()}`);
    console.log(`   Final URL: ${page.url()}`);

    // Check for redirects
    if (page.url() !== 'https://jipangefinance.netlify.app/') {
      console.log(`   ⚠️  REDIRECTED to: ${page.url()}`);
    }

    // Wait a moment for rendering
    await page.waitForTimeout(2000);

    // Check page title
    const title = await page.title();
    console.log(`   Title: "${title}"`);

    // Check if this is the old phase4 or new refactored version
    const bodyHTML = await page.content();

    if (bodyHTML.includes('jipange-phase4.html')) {
      console.log('\n   ❌ ERROR: Still serving phase4.html!');
      console.log('   The deployment did not update to dist/jipange.html');
    }

    if (bodyHTML.includes('screen-1') || bodyHTML.includes('screen-2')) {
      console.log('   ✅ Contains screen elements');
    }

    // Look for main nav elements
    const navTabs = await page.locator('.nav-tab').count();
    console.log(`   Nav tabs found: ${navTabs}`);

    // Try to find profile input
    console.log('\n🔍 Checking form elements');
    const nameInput = await page.locator('#name').first();
    const isNameVisible = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (isNameVisible) {
      console.log('   ✅ Profile name input is visible');
    } else {
      console.log('   ❌ Profile name input NOT visible');
    }

    // Check for calculation displays
    const grossDisplay = await page.locator('#grossMonthly').first();
    const isGrossVisible = await grossDisplay.isVisible({ timeout: 5000 }).catch(() => false);

    if (isGrossVisible) {
      console.log('   ✅ Calculation display found');
    } else {
      console.log('   ❌ Calculation display NOT found');
    }

    // Collect console messages
    const logs = [];
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    // Take screenshot
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({
      path: '/tmp/claude-0/-home-user-JiPange/1c1191d4-b0cc-597d-a227-f4cfe0daeb8a/scratchpad/production-mobile.png',
      fullPage: true
    });
    console.log('   ✅ Screenshot saved');

    if (errors.length > 0) {
      console.log('\n⚠️  Console errors:');
      errors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
    } else {
      console.log('\n✅ No console errors');
    }

    await page.close();

  } catch (error) {
    console.log(`\n❌ Test error: ${error.message}`);
    console.log(error.stack);
  } finally {
    await browser.close();
  }
}

testProduction().catch(console.error);
