const { chromium } = require('playwright');
const fs = require('fs');

const OUT = '/tmp/spendy-screenshots';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:3000';
const DESKTOP = { width: 1280, height: 800 };
const MOBILE  = { width: 390,  height: 844 };

const yesterday = (() => {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
})();
const tomorrow = (() => {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
})();

async function shot(page, name) {
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  ✓ ${name}`);
}

async function clearStorage(page) {
  await page.evaluate(() => {
    ['expenses','expense-filters','categories'].forEach(k => localStorage.removeItem(k));
  });
}

// Scope category clicks to the modal overlay
async function clickCategoryInModal(page, name) {
  const modal = page.locator('div.fixed.inset-0');
  await modal.locator(`button[type="button"]:has-text("${name}")`).click();
}

// Use the Cancel button to close the modal (Escape also closes it)
async function cancelModal(page) {
  await page.locator('button:has-text("Cancel")').click();
  await page.waitForTimeout(300);
}

// Wait for the modal heading specifically (avoids matching hidden nav spans)
async function waitForModal(page, title = 'Add Expense') {
  await page.waitForSelector(`h2:has-text("${title}")`, { state: 'visible' });
  await page.waitForTimeout(500);
}

// The header "Add Expense" button: bg-violet-600 + shadow-sm (unique to it)
const HEADER_BTN = 'button[class*="shadow-sm"]';

// ─────────────────────────────────────────────────────────────────────────────
async function captureDesktop(browser) {
  const ctx  = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/expenses`, { waitUntil: 'networkidle' });
  await clearStorage(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // d01: Empty state
  await shot(page, 'd01-empty-state');

  // d02: "Add Expense" button hover (shows full label on desktop)
  await page.locator(HEADER_BTN).hover();
  await page.waitForTimeout(200);
  await shot(page, 'd02-add-button-hover');

  // d03: Modal – empty form
  await page.locator(HEADER_BTN).click();
  await waitForModal(page);
  await shot(page, 'd03-modal-empty');

  // d04: Date filled
  await page.fill('input[type="date"]', yesterday);
  await page.locator('input[type="date"]').blur();
  await shot(page, 'd04-date-filled');

  // d05: Amount filled
  await page.fill('input[placeholder="0.00"]', '349.50');
  await page.locator('input[placeholder="0.00"]').blur();
  await shot(page, 'd05-amount-filled');

  // d06: Category selected (Shopping highlighted)
  await clickCategoryInModal(page, 'Shopping');
  await page.waitForTimeout(300);
  await shot(page, 'd06-category-selected');

  // d07: Subcategory dropdown field
  await page.locator('div.fixed.inset-0').locator('select').focus();
  await shot(page, 'd07-subcategory-field');

  // d08: Form fully filled and ready to submit
  await page.fill('textarea', 'New t-shirt from Zara');
  await page.locator('textarea').blur();
  await page.waitForTimeout(200);
  await shot(page, 'd08-form-complete');

  // d09: Validation – all fields blank on submit
  await cancelModal(page);
  await page.locator(HEADER_BTN).click();
  await waitForModal(page);
  await page.fill('input[placeholder="0.00"]', '');
  await page.fill('textarea', '');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  await shot(page, 'd09-validation-errors');

  // d10: Invalid amount (letters)
  await page.fill('input[placeholder="0.00"]', 'abc');
  await page.locator('input[placeholder="0.00"]').blur();
  await page.waitForTimeout(300);
  await shot(page, 'd10-invalid-amount');

  // d11: Future date
  await page.fill('input[type="date"]', tomorrow);
  await page.locator('input[type="date"]').blur();
  await page.waitForTimeout(300);
  await shot(page, 'd11-future-date');

  // d12: Description too short (single char)
  await page.fill('input[type="date"]', yesterday);
  await page.fill('input[placeholder="0.00"]', '100');
  await page.fill('textarea', 'x');
  await page.locator('textarea').blur();
  await page.waitForTimeout(300);
  await shot(page, 'd12-description-short');

  // d13: Successful add – toast appears
  await page.fill('textarea', 'New t-shirt from Zara');
  await clickCategoryInModal(page, 'Shopping');
  await page.waitForTimeout(200);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  await shot(page, 'd13-success-toast');

  // d14: Expense now visible in grouped list
  await page.waitForTimeout(800);
  await shot(page, 'd14-expense-in-list');

  // d15: Hover to reveal edit/delete action buttons
  const card = page.locator('.group').first();
  await card.hover();
  await page.waitForTimeout(300);
  await shot(page, 'd15-hover-actions');

  // d16: Edit modal – form pre-filled with existing values
  await page.locator('button[title="Edit"]').first().click();
  await waitForModal(page, 'Edit Expense');
  await shot(page, 'd16-edit-modal');

  // d17: Delete confirmation dialog
  await cancelModal(page);
  await card.hover();
  await page.waitForTimeout(200);
  await page.locator('button[title="Delete"]').first().click();
  await page.waitForSelector('text=Delete this expense?', { state: 'visible' });
  await page.waitForTimeout(500);
  await shot(page, 'd17-delete-confirmation');

  await ctx.close();
  console.log('  Desktop done.\n');
}

// ─────────────────────────────────────────────────────────────────────────────
async function captureMobile(browser) {
  const ctx = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/expenses`, { waitUntil: 'networkidle' });
  await clearStorage(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // m01: Empty state (shows "Add First Expense" button prominently)
  await shot(page, 'm01-empty-state');

  // m02: Header on mobile – Export, Import, and "+" icon (no text label)
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, 'm02-mobile-header');

  // m03: Modal – empty (opened from the header + button)
  // force:true bypasses the Next.js dev-tools overlay on mobile
  await page.locator(HEADER_BTN).click({ force: true });
  await waitForModal(page);
  await shot(page, 'm03-modal-empty');

  // m04: Form fully filled on mobile
  await page.fill('input[type="date"]', yesterday);
  await page.fill('input[placeholder="0.00"]', '349.50');
  await clickCategoryInModal(page, 'Shopping');
  await page.waitForTimeout(300);
  await page.fill('textarea', 'New t-shirt from Zara');
  await page.locator('textarea').blur();
  await page.waitForTimeout(200);
  await shot(page, 'm04-form-filled');

  // m05: Validation errors on mobile
  await cancelModal(page);
  await page.locator(HEADER_BTN).click({ force: true });
  await waitForModal(page);
  await page.fill('input[placeholder="0.00"]', '');
  await page.fill('textarea', '');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  await shot(page, 'm05-validation-errors');

  // m06: Successful add + toast on mobile
  await page.fill('input[type="date"]', yesterday);
  await page.fill('input[placeholder="0.00"]', '349.50');
  await clickCategoryInModal(page, 'Shopping');
  await page.waitForTimeout(200);
  await page.fill('textarea', 'New t-shirt from Zara');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  await shot(page, 'm06-success-toast');

  // m07: Expense list on mobile – edit/delete always visible (no hover required)
  await page.waitForTimeout(800);
  await shot(page, 'm07-expense-in-list');

  // m08: Edit modal on mobile
  await page.locator('button[title="Edit"]').first().click();
  await waitForModal(page, 'Edit Expense');
  await shot(page, 'm08-edit-modal');

  // m09: Delete confirmation on mobile
  await cancelModal(page);
  await page.locator('button[title="Delete"]').first().click();
  await page.waitForSelector('text=Delete this expense?', { state: 'visible' });
  await page.waitForTimeout(500);
  await shot(page, 'm09-delete-confirmation');

  await ctx.close();
  console.log('  Mobile done.\n');
}

// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  console.log('=== Desktop ===');
  await captureDesktop(browser);
  console.log('=== Mobile ===');
  await captureMobile(browser);
  await browser.close();
  const files = fs.readdirSync(OUT).sort();
  console.log(`\nAll done — ${files.length} screenshots in ${OUT}`);
  console.log(files.join('\n'));
})();
