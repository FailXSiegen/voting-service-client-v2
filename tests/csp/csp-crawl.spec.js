// CSP-Check (SEC-28): besucht öffentliche Seiten, alle per Link erreichbaren Organizer-Seiten
// und die Teilnehmer-Ansicht und sammelt jede CSP-Meldung (auch "[Report Only]").
// Klickt nur Links, keine Buttons – ändert nichts. Gedacht für die Testinstanz voting.failx.de.
// Aufruf: CSP_ORG_USER=… CSP_ORG_PASS=… CSP_EVENT=lasttest-2025 CSP_USER=testuser1 CSP_USER_PASS=… \
//         npx playwright test -c tests/smoke tests/csp
const { test, expect } = require('@playwright/test');

const BASE = process.env.CSP_URL || 'https://voting.failx.de';
const MAX_PAGES = Number(process.env.CSP_MAX_PAGES || 60);
// ponytail: Logout/Löschen per Muster ausgeschlossen; weitere destruktive Links hier ergänzen.
const SKIP = /logout|abmelden|delete|loeschen|löschen|reset|mailto:|tel:|\.pdf$|\.csv$/i;

const violations = [];
function watch(page, label) {
  page.on('console', (m) => {
    const t = m.text();
    if (/Content Security Policy|Content-Security-Policy|\[Report Only\]/i.test(t)) {
      violations.push(`${label} ${page.url()} :: ${t.slice(0, 300)}`);
    }
  });
}

async function crawl(page, label, start, sameScope) {
  const seen = new Set();
  const queue = [start];
  while (queue.length && seen.size < MAX_PAGES) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    await page.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000); // WebSocket hält das Netz offen -> kein networkidle
    const links = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
    for (const u of links.map((l) => l.split('#')[0])) {
      if (u.startsWith(BASE) && !SKIP.test(u) && sameScope(u) && !seen.has(u)) queue.push(u);
    }
  }
  console.log(`${label}: ${seen.size} Seiten besucht`);
  return seen;
}

test.setTimeout(15 * 60 * 1000);

test('öffentliche Seiten', async ({ page }) => {
  watch(page, '[public]');
  await crawl(page, 'public', BASE + '/', (u) => !/\/admin/.test(u));
});

test('Organizer-Bereich', async ({ page }) => {
  test.skip(!process.env.CSP_ORG_USER, 'CSP_ORG_USER/CSP_ORG_PASS fehlen');
  watch(page, '[organizer]');
  await page.goto(BASE);
  await page.fill('#organizer-login-username', process.env.CSP_ORG_USER);
  await page.fill('#organizer-login-password', process.env.CSP_ORG_PASS);
  await page.click('#organizer-login-submit');
  await page.waitForURL(/\/admin/, { timeout: 20000 });
  await crawl(page, 'organizer', page.url(), (u) => /\/admin/.test(u));
});

test('Teilnehmer-Ansicht', async ({ page }) => {
  test.skip(!process.env.CSP_EVENT || !process.env.CSP_USER, 'CSP_EVENT/CSP_USER fehlen');
  watch(page, '[teilnehmer]');
  await page.goto(`${BASE}/event/${process.env.CSP_EVENT}`, { waitUntil: 'load' });
  // EventUserLogin.vue: Benutzername, Passwort, Anzeigename, dann Absenden
  const form = page.locator('form').filter({ has: page.locator('input[type="password"]') });
  const texts = form.locator('input:not([type="password"])');
  await texts.nth(0).fill(process.env.CSP_USER);
  await form.locator('input[type="password"]').fill(process.env.CSP_USER_PASS || '');
  if ((await texts.count()) > 1 && (await texts.nth(1).isEditable())) {
    await texts.nth(1).fill('CSP Test');
  }
  await form.locator('button.btn-primary').click();
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'test-results/csp-teilnehmer.png' });
});

test.afterAll(() => {
  const uniq = [...new Set(violations)];
  console.log(`\n=== CSP-Meldungen: ${uniq.length}`);
  uniq.forEach((v) => console.log(v));
  expect(uniq).toEqual([]);
});
