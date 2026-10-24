// Smoke-Test gegen die Produktion – schreibt nichts, löst keine Mails aus.
// Aufruf: npx playwright test -c tests/smoke
//   SMOKE_URL=https://digitalwahl.org (Default)
//   SMOKE_IP=144.76.43.234   optional: DNS umgehen (z. B. nach Umzug, alter Cache)
//   SMOKE_ORG_USER / SMOKE_ORG_PASS   optional: Organizer-Login + Dashboard + WebSocket
const { test, expect } = require('@playwright/test');

const BASE = process.env.SMOKE_URL || 'https://digitalwahl.org';
const HOST = new URL(BASE).host;
const IP = process.env.SMOKE_IP;

test.use({
  launchOptions: IP
    ? { args: [`--host-resolver-rules=MAP ${HOST} ${IP}, MAP www.${HOST} ${IP}`] }
    : {},
});

// Sammelt JS-Fehler und fehlgeschlagene Requests, die nicht durch den Test selbst verursacht sind
function watch(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  page.on('response', (r) => r.status() >= 500 && errors.push(`${r.status()} ${r.url()}`));
  return errors;
}

test('www leitet auf Apex um', async ({ page }) => {
  await page.goto(`https://www.${HOST}/`);
  expect(new URL(page.url()).host).toBe(HOST);
});

test('Startseite lädt ohne Fehler, Login-Formular da', async ({ page }) => {
  const errors = watch(page);
  const res = await page.goto(BASE);
  expect(res.status()).toBe(200);
  await expect(page.locator('#organizer-login-form')).toBeVisible({ timeout: 15000 });
  expect(errors).toEqual([]);
});

test('GraphQL antwortet, WebSocket-Upgrade klappt', async ({ page }) => {
  await page.goto(BASE);
  const r = await page.evaluate(async () => {
    const gql = await fetch('/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    }).then((x) => x.json());
    // Ohne Token schließt der Server nach dem Handshake – entscheidend ist, dass "open" kommt
    const ws = await new Promise((resolve) => {
      const s = new WebSocket(`wss://${location.host}/graphql`, 'graphql-transport-ws');
      s.onopen = () => {
        resolve('open');
        s.close();
      };
      s.onerror = () => resolve('error');
      setTimeout(() => resolve('timeout'), 10000);
    });
    return { gql, ws };
  });
  expect(r.gql).toEqual({ data: { __typename: 'Query' } });
  expect(r.ws).toBe('open');
});

test('Organizer-Login, Dashboard und WebSocket mit Token', async ({ page }) => {
  test.skip(!process.env.SMOKE_ORG_USER, 'SMOKE_ORG_USER/SMOKE_ORG_PASS nicht gesetzt');
  const errors = watch(page);
  await page.goto(BASE);
  await page.fill('#organizer-login-username', process.env.SMOKE_ORG_USER);
  await page.fill('#organizer-login-password', process.env.SMOKE_ORG_PASS);
  await page.click('#organizer-login-submit');
  await page.waitForURL(/\/admin/, { timeout: 20000 });
  // Zeit für Event-Liste + Subscription-Aufbau; WebSocket-Fehler landen als console.error
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  expect(errors).toEqual([]);
});
