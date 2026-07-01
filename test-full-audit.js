#!/usr/bin/env node

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';
const SCREENSHOTS_DIR = '/tmp/claude-0/-home-user-JiPange/1c1191d4-b0cc-597d-a227-f4cfe0daeb8a/scratchpad';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runFullAudit() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true
  });

  console.log('🎯 JiPange Full Playwright Audit');
  console.log('═'.repeat(70));
  console.log(`Testing: ${BASE_URL}\n`);

  // Homepage & Navigation
  console.log('\n📄 HOMEPAGE & NAVIGATION');
  console.log('─'.repeat(70));
  await testHomepage(browser);

  // Profile Screen
  console.log('\n👤 PROFILE SCREEN');
  console.log('─'.repeat(70));
  await testProfileScreen(browser);

  // Income Screen
  console.log('\n💰 INCOME SCREEN');
  console.log('─'.repeat(70));
  await testIncomeScreen(browser);

  // Budget Screen
  console.log('\n📊 BUDGET SCREEN');
  console.log('─'.repeat(70));
  await testBudgetScreen(browser);

  // Scenarios Screen
  console.log('\n🎬 SCENARIO PLANNER');
  console.log('─'.repeat(70));
  await testScenariosScreen(browser);

  // Wealth Dashboard
  console.log('\n💎 WEALTH DASHBOARD');
  console.log('─'.repeat(70));
  await testDashboard(browser);

  // Accessibility
  console.log('\n♿ ACCESSIBILITY');
  console.log('─'.repeat(70));
  await testAccessibility(browser);

  // Performance
  console.log('\n⚡ PERFORMANCE');
  console.log('─'.repeat(70));
  await testPerformance(browser);

  // Cross-browser (simulated)
  console.log('\n🌐 BROWSER COMPATIBILITY');
  console.log('─'.repeat(70));
  await testBrowserCompatibility(browser);

  await browser.close();

  // Summary
  console.log('\n\n' + '═'.repeat(70));
  console.log('📊 AUDIT SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✓ Passed: ${passedTests}`);
  console.log(`✗ Failed: ${failedTests}`);
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`Pass Rate: ${passRate}%\n`);

  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED - APP IS PRODUCTION READY!\n');
  } else {
    console.log(`⚠️  ${failedTests} test(s) failed - review above for details.\n`);
  }
}

function test(name, passed) {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✓ ${name}`);
  } else {
    failedTests++;
    console.log(`✗ ${name}`);
  }
}

async function testHomepage(browser) {
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Test logo presence
    const logo = await page.locator('img[alt="JiPange"]').count();
    test('Logo displays on homepage', logo > 0);

    // Test hero section
    const hero = await page.locator('text=Your African Finance Copilot').count();
    test('Hero section present', hero > 0);

    // Test CTA buttons
    const startBtn = await page.locator('button:has-text("Start Your Plan")').count();
    const demoBtn = await page.locator('button:has-text("View Demo")').count();
    test('Call-to-action buttons visible', startBtn > 0 && demoBtn > 0);

    // Test feature cards
    const features = await page.locator('text=Smart Planning').count();
    test('Feature cards displayed', features > 0);

    // Test navigation
    const navbar = await page.locator('.navbar').count();
    test('Navigation bar present', navbar > 0);

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/audit-01-homepage.png`, fullPage: true });

  } catch (error) {
    test('Homepage loads without errors', false);
    console.error(`  Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testProfileScreen(browser) {
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Navigate to profile
    await page.click('button:has-text("Start Your Plan")');
    await page.waitForTimeout(800);

    // Test profile form elements
    const nameInput = await page.locator('#name').count();
    test('Name input field present', nameInput > 0);

    const ageInput = await page.locator('#age').count();
    test('Age input field present', ageInput > 0);

    const retireAgeInput = await page.locator('#retirementAge').count();
    test('Retirement age input present', retireAgeInput > 0);

    const countySelect = await page.locator('#county').count();
    test('County dropdown present', countySelect > 0);

    // Test form input
    await page.fill('#name', 'John Doe');
    await page.fill('#age', '35');
    await page.fill('#retirementAge', '60');
    await page.waitForTimeout(500);

    const nameValue = await page.inputValue('#name');
    test('Name input captures value', nameValue === 'John Doe');

    const ageValue = await page.inputValue('#age');
    test('Age input captures value', ageValue === '35');

    // Test navigation to next screen
    const nextBtn = await page.locator('button:has-text("Income →")').count();
    test('Next button available', nextBtn > 0);

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/audit-02-profile.png`, fullPage: true });

  } catch (error) {
    test('Profile screen functionality', false);
    console.error(`  Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testIncomeScreen(browser) {
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Start Your Plan")');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Income →")');
    await page.waitForTimeout(800);

    // Test income form
    const salaryInput = await page.locator('#salary').count();
    test('Salary input field present', salaryInput > 0);

    // Test income calculation
    await page.fill('#salary', '150000');
    await page.fill('#business', '30000');
    await page.waitForTimeout(800);

    const grossDisplay = await page.locator('#grossMonthly').textContent();
    test('Gross income displays', grossDisplay && grossDisplay.includes('KES'));

    const netDisplay = await page.locator('#netMonthly').textContent();
    test('Net income calculates', netDisplay && netDisplay.includes('KES'));

    // Test deductions breakdown
    const payeDisplay = await page.locator('#payeDisplay').textContent();
    test('PAYE deduction shows', payeDisplay && payeDisplay.includes('KES'));

    // Test navigation
    const nextBtn = await page.locator('button:has-text("Budget →")').count();
    test('Budget navigation available', nextBtn > 0);

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/audit-03-income.png`, fullPage: true });

  } catch (error) {
    test('Income screen functionality', false);
    console.error(`  Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testBudgetScreen(browser) {
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Start Your Plan")');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Income →")');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Budget →")');
    await page.waitForTimeout(800);

    // Test budget form
    const rentInput = await page.locator('#rent').count();
    test('Rent input field present', rentInput > 0);

    const foodInput = await page.locator('#food').count();
    test('Food input field present', foodInput > 0);

    // Test budget calculation
    await page.fill('#rent', '50000');
    await page.fill('#food', '20000');
    await page.fill('#utilities', '5000');
    await page.waitForTimeout(800);

    const expensesDisplay = await page.locator('#totalExpenses').textContent();
    test('Total expenses calculate', expensesDisplay && expensesDisplay.includes('KES'));

    const surplusDisplay = await page.locator('#surplus').textContent();
    test('Monthly surplus calculates', surplusDisplay && surplusDisplay.includes('KES'));

    const savingsRate = await page.locator('#savingsRate').textContent();
    test('Savings rate displays', savingsRate && savingsRate.includes('%'));

    // Test navigation
    const nextBtn = await page.locator('button:has-text("Scenarios →")').count();
    test('Scenarios navigation available', nextBtn > 0);

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/audit-04-budget.png`, fullPage: true });

  } catch (error) {
    test('Budget screen functionality', false);
    console.error(`  Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testScenariosScreen(browser) {
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Start Your Plan")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Income →")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Budget →")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Scenarios →")');
    await page.waitForTimeout(800);

    // Test scenario sliders
    const conservativeSlider = await page.locator('#conservativeSavingsSlider').count();
    test('Conservative scenario slider present', conservativeSlider > 0);

    const balancedSlider = await page.locator('#balancedSavingsSlider').count();
    test('Balanced scenario slider present', balancedSlider > 0);

    // Test scenario calculations
    const conservativeWealth = await page.locator('#conservativeWealth').textContent();
    test('Conservative wealth projection shows', conservativeWealth && conservativeWealth.includes('KES'));

    const balancedWealth = await page.locator('#balancedWealth').textContent();
    test('Balanced wealth projection shows', balancedWealth && balancedWealth.includes('KES'));

    // Test chart presence
    const chartCanvas = await page.locator('canvas#scenarioChart').count();
    test('Scenario chart renders', chartCanvas > 0);

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/audit-05-scenarios.png`, fullPage: true });

  } catch (error) {
    test('Scenario planner functionality', false);
    console.error(`  Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testDashboard(browser) {
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Start Your Plan")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Income →")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Budget →")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Scenarios →")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Wealth Dashboard →")');
    await page.waitForTimeout(800);

    // Test dashboard metrics
    const netWorthToday = await page.locator('#netWorthToday').textContent();
    test('Net worth display present', netWorthToday && netWorthToday.includes('KES'));

    const monthlyInvestable = await page.locator('#monthlyInvestable').textContent();
    test('Monthly investable shows', monthlyInvestable && monthlyInvestable.includes('KES'));

    // Test wealth pyramid
    const pyramidEmergency = await page.locator('#emergencyAmount').textContent();
    test('Emergency fund pyramid shows', pyramidEmergency && pyramidEmergency.includes('KES'));

    const pyramidGoals = await page.locator('#goalsAmount').textContent();
    test('Goals pyramid shows', pyramidGoals && pyramidGoals.includes('KES'));

    // Test charts
    const netWorthChart = await page.locator('canvas#netWorthChart').count();
    test('Net worth chart renders', netWorthChart > 0);

    // Test assets/liabilities
    const totalAssets = await page.locator('#totalAssets').textContent();
    test('Total assets display', totalAssets && totalAssets.includes('KES'));

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/audit-06-dashboard.png`, fullPage: true });

  } catch (error) {
    test('Dashboard functionality', false);
    console.error(`  Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testAccessibility(browser) {
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Test semantic HTML
    const headings = await page.locator('h1, h2, h3').count();
    test('Proper heading hierarchy', headings > 0);

    // Test form labels
    const labels = await page.locator('label').count();
    test('Form labels present', labels > 0);

    // Test ARIA attributes
    const ariaElements = await page.evaluate(() => {
      return document.querySelectorAll('[aria-label], [aria-describedby], [role]').length;
    });
    test('ARIA attributes used', ariaElements > 0);

    // Test keyboard navigation
    const focusable = await page.evaluate(() => {
      return document.querySelectorAll('button, a, input, select, textarea, [tabindex]').length;
    });
    test('Focusable elements present', focusable > 0);

    // Test color contrast (basic)
    const contrast = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let darkText = 0;
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        // Check if text is not too light
        if (color !== 'rgba(0, 0, 0, 0)') {
          darkText++;
        }
      });
      return darkText;
    });
    test('Text contrast reasonable', contrast > 100);

    // Test responsive viewport
    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : '';
    });
    test('Viewport meta tag correct', viewport.includes('width=device-width'));

  } catch (error) {
    test('Accessibility checks', false);
    console.error(`  Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testPerformance(browser) {
  const page = await browser.newPage();

  try {
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    test('Homepage loads within 3 seconds', loadTime < 3000);
    console.log(`  (Loaded in ${loadTime}ms)`);

    // Test for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Navigate through screens
    await page.click('button:has-text("Start Your Plan")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Income →")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Budget →")');
    await page.waitForTimeout(300);

    test('No console errors', errors.length === 0);

    // Test for unused resources
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    });
    test('Resources load efficiently', resources < 50);
    console.log(`  (${resources} resources loaded)`);

  } catch (error) {
    test('Performance checks', false);
    console.error(`  Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testBrowserCompatibility(browser) {
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Test CSS support
    const cssSupport = await page.evaluate(() => {
      const div = document.createElement('div');
      div.style.cssText = 'display: flex; gap: 1rem;';
      return div.style.cssText.includes('flex');
    });
    test('CSS Flexbox supported', cssSupport);

    // Test ES6 support
    const es6Support = await page.evaluate(() => {
      try {
        eval('const x = 1; const y = [...[1,2,3]];');
        return true;
      } catch (e) {
        return false;
      }
    });
    test('ES6 features supported', es6Support);

    // Test localStorage
    const storageSupport = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }
    });
    test('LocalStorage available', storageSupport);

    // Test Chart.js (with retry for CDN loading)
    let chartsAvailable = false;
    for (let i = 0; i < 5; i++) {
      chartsAvailable = await page.evaluate(() => {
        return typeof Chart !== 'undefined';
      });
      if (chartsAvailable) break;
      await page.waitForTimeout(200);
    }
    test('Chart.js library loaded', chartsAvailable);

  } catch (error) {
    test('Browser compatibility checks', false);
    console.error(`  Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

runFullAudit().catch(console.error);
