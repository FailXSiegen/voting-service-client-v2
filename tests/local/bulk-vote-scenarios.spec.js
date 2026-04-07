/**
 * Bulk-Vote Szenario-Tests mit Zeitmessungen
 *
 * Testet verschiedene Abstimmungsszenarien in einem Durchlauf:
 * 1. Einfache Abstimmung (beide User, alle Stimmen für eine Option)
 * 2. Nur ein User votet
 * 3. Split-Vote
 * 4. Enthaltung
 */
const { test, expect } = require('@playwright/test');
const { CONFIG } = require('./config');
const { execSync } = require('child_process');

function dbQuery(sql) {
  try {
    return execSync(
      `echo "${sql.replace(/"/g, '\\"')}" | docker exec -i db mysql -u root -p1234 application 2>/dev/null`,
      { encoding: 'utf8' }
    ).trim();
  } catch (e) {
    return '';
  }
}

function resetTestState() {
  dbQuery("UPDATE event_user SET password = '', online = 0, last_activity = NULL WHERE event_id = 1055");
}

async function loginUser(browser, username, publicName) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const magicLink = CONFIG.MAGIC_LINK_URL_TEMPLATE
    .replace('#USERNAME#', encodeURIComponent(username))
    .replace('#PUBLIC_NAME#', encodeURIComponent(publicName));

  await page.goto(magicLink, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/login') && r.status() === 201, { timeout: 15000 }),
    page.locator('button.btn-primary').first().click()
  ]);

  await page.waitForTimeout(3000);
  console.log(`  ✓ ${username} eingeloggt`);
  return page;
}

async function loginOrganizer(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(CONFIG.CLIENT_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Rechte Seite: "Als Organisator einloggen"
  // Finde die Felder im Organizer-Login-Bereich (rechte Spalte)
  const orgSection = page.locator('text=Als Organisator einloggen').locator('..');

  // Username-Feld: zweites text-input auf der Seite (erstes ist Event-ID links)
  const allInputs = page.locator('input[type="text"], input:not([type])');
  const inputCount = await allInputs.count();
  // Das Organizer-Username-Feld ist typischerweise das zweite Text-Input
  for (let i = 0; i < inputCount; i++) {
    const input = allInputs.nth(i);
    const placeholder = await input.getAttribute('placeholder').catch(() => '');
    const nearby = await input.evaluate(el => el.closest('.col-md-6, .col-lg-6, .card')?.textContent || '').catch(() => '');
    if (nearby.includes('Organisator') || nearby.includes('Login') && nearby.includes('Passwort')) {
      await input.fill(CONFIG.ORGANIZER_USERNAME);
      break;
    }
  }

  // Password: im Organizer-Bereich
  const allPasswords = page.locator('input[type="password"]');
  const pwCount = await allPasswords.count();
  // Nimm das letzte Password-Feld (Organizer ist rechts/unten)
  if (pwCount > 0) {
    await allPasswords.nth(pwCount - 1).fill(CONFIG.ORGANIZER_PASSWORD);
  }

  // Login-Button im Organizer-Bereich
  const loginBtn = page.locator('button:has-text("Login")').last();
  await loginBtn.click();

  // Warte auf Dashboard
  await page.waitForURL(/admin|dashboard/, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const url = page.url();
  if (url.includes('admin') || url.includes('dashboard')) {
    console.log('  ✓ Organizer eingeloggt');
  } else {
    console.log(`  ⚠ Organizer-Login: URL ist ${url}`);
  }
  return page;
}

async function createAndStartPoll(organizerPage, title, { multipleAnswers = false, customOptions = [] } = {}) {
  await organizerPage.goto(
    `${CONFIG.CLIENT_URL}/admin/event/polls/${CONFIG.EVENT_ID}/poll/new`,
    { waitUntil: 'networkidle', timeout: 30000 }
  );
  await organizerPage.waitForTimeout(3000);

  const titleField = organizerPage.locator('input[placeholder*="abgestimmt"]').first();
  await titleField.waitFor({ state: 'visible', timeout: 10000 });
  await titleField.fill(title);
  await organizerPage.waitForTimeout(1000);

  // Bei individuellen Antwortoptionen: Radio auf "Individuelle Antwortoptionen" umschalten
  if (customOptions.length > 0) {
    const individualRadio = organizerPage.locator('label:has-text("Individuelle Antwortoptionen")').first();
    if (await individualRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
      await individualRadio.click();
      await organizerPage.waitForTimeout(1000);
    }

    // Antwortoptionen als Text eingeben (eine pro Zeile)
    const textarea = organizerPage.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill(customOptions.join('\n'));
      await organizerPage.waitForTimeout(500);
    }
  }

  const startBtn = organizerPage.locator('button:has-text("speichern & sofort starten")');
  for (let i = 0; i < 20; i++) {
    if (!await startBtn.isDisabled().catch(() => true)) break;
    await organizerPage.reload({ waitUntil: 'networkidle' });
    await organizerPage.waitForTimeout(2000);
    const tf = organizerPage.locator('input[placeholder*="abgestimmt"]').first();
    if (await tf.isVisible().catch(() => false)) await tf.fill(title);
    // Bei Reload müssen die Optionen erneut gesetzt werden
    if (customOptions.length > 0) {
      const indRadio = organizerPage.locator('label:has-text("Individuelle Antwortoptionen")').first();
      if (await indRadio.isVisible({ timeout: 2000 }).catch(() => false)) await indRadio.click();
      await organizerPage.waitForTimeout(500);
      const ta = organizerPage.locator('textarea').first();
      if (await ta.isVisible().catch(() => false)) await ta.fill(customOptions.join('\n'));
    }
  }

  await startBtn.click({ timeout: 5000 });
  await organizerPage.waitForTimeout(1000);

  // Bestätigungsdialog
  const confirmBtn = organizerPage.locator('button:has-text("Bestätigen")').first();
  if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await confirmBtn.click();
    console.log('  ✓ Bestätigungsdialog bestätigt');
  }
  await organizerPage.waitForTimeout(3000);

  const result = dbQuery("SELECT p.id FROM poll p WHERE p.event_id = 1055 ORDER BY p.id DESC LIMIT 1");
  const pollId = result.split('\n').pop().trim();
  console.log(`  ✓ Poll "${title}" gestartet (ID: ${pollId})`);
  return pollId;
}

async function waitForModal(page, timeout = 30000) {
  const modal = page.locator('.modal.show, .modal-dialog:visible').first();
  await modal.waitFor({ state: 'visible', timeout });
  await page.waitForTimeout(500);
}

async function voteOption(page, username, optionIndex = 0) {
  await waitForModal(page);
  const radio = page.locator('input[type="radio"]').nth(optionIndex);
  await radio.click({ force: true });
  await page.locator('button[type="submit"], button:has-text("Jetzt abstimmen")').first().click({ force: true, timeout: 5000 });
  console.log(`  ✓ ${username} → Option ${optionIndex + 1}`);
}

async function voteAbstain(page, username) {
  await waitForModal(page);
  const abstain = page.locator('input[type="checkbox"], label:has-text("Enthaltung")').first();
  await abstain.click({ force: true });
  await page.waitForTimeout(500);
  await page.locator('button[type="submit"], button:has-text("Jetzt abstimmen")').first().click({ force: true, timeout: 5000 });
  console.log(`  ✓ ${username} → Enthaltung`);
}

async function stopPoll(organizerPage) {
  await organizerPage.goto(
    `${CONFIG.CLIENT_URL}/admin/event/polls/${CONFIG.EVENT_ID}`,
    { waitUntil: 'networkidle', timeout: 30000 }
  );
  await organizerPage.waitForTimeout(2000);

  const stopBtn = organizerPage.locator('button:has-text("Beenden"), button:has-text("Stoppen")').first();
  if (await stopBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await stopBtn.click();
    await organizerPage.waitForTimeout(1000);
    const confirmBtn = organizerPage.locator('.modal button.btn-primary, button:has-text("Bestätigen")').first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await organizerPage.waitForTimeout(2000);
  }
  console.log('  ✓ Poll gestoppt');
}

function getVoteResults(pollId) {
  const votes = dbQuery(`SELECT answer_content, COUNT(*) as cnt FROM poll_answer pa INNER JOIN poll_result pr ON pa.poll_result_id = pr.id WHERE pr.poll_id = ${pollId} GROUP BY answer_content ORDER BY cnt DESC`);
  const cycles = dbQuery(`SELECT eu.username, puv.vote_cycle FROM poll_user_voted puv INNER JOIN event_user eu ON eu.id = puv.event_user_id INNER JOIN poll_result pr ON puv.poll_result_id = pr.id WHERE pr.poll_id = ${pollId}`);
  return { votes, cycles };
}

function printResults(pollId, scenario) {
  const r = getVoteResults(pollId);
  console.log(`  📊 ${scenario}:`);
  if (r.votes) r.votes.split('\n').slice(1).forEach(line => console.log(`     ${line}`));
  if (r.cycles) r.cycles.split('\n').slice(1).forEach(line => console.log(`     👤 ${line}`));
}


test('Bulk-Vote Szenarien', async ({ browser }) => {
  test.setTimeout(600000);

  const timings = {};

  // ============ SETUP ============
  console.log('\n📋 SETUP: Login');
  resetTestState();

  let t0 = performance.now();
  const organizerPage = await loginOrganizer(browser);
  const user1Page = await loginUser(browser, 'user1-windows', 'Windows User');
  const user2Page = await loginUser(browser, 'user2-apple', 'Apple User');
  timings.login = Math.round(performance.now() - t0);
  console.log(`  ⏱  ${timings.login}ms\n`);

  const onlineCheck = dbQuery("SELECT COUNT(*) as cnt FROM event_user WHERE event_id = 1055 AND online = 1");
  expect(parseInt(onlineCheck.split('\n').pop().trim())).toBe(2);

  // ============ SZENARIO 1: Alle Stimmen für eine Option ============
  console.log('━━━ SZENARIO 1: Beide User, alle Stimmen für Ja ━━━');
  t0 = performance.now();
  const poll1 = await createAndStartPoll(organizerPage, 'Szenario 1: Alle für Ja');

  await Promise.all([
    voteOption(user1Page, 'user1', 0),
    voteOption(user2Page, 'user2', 0)
  ]);
  await user1Page.waitForTimeout(3000);

  timings.scenario1 = Math.round(performance.now() - t0);
  printResults(poll1, 'Szenario 1');
  console.log(`  ⏱  ${timings.scenario1}ms\n`);

  await stopPoll(organizerPage);

  // ============ SZENARIO 2: Nur User 1 votet ============
  console.log('━━━ SZENARIO 2: Nur User 1 votet (Nein) ━━━');
  t0 = performance.now();
  const poll2 = await createAndStartPoll(organizerPage, 'Szenario 2: Nur einer');

  await voteOption(user1Page, 'user1', 1); // Nein
  await user1Page.waitForTimeout(3000);

  timings.scenario2 = Math.round(performance.now() - t0);
  printResults(poll2, 'Szenario 2');
  console.log(`  ⏱  ${timings.scenario2}ms\n`);

  await stopPoll(organizerPage);

  // ============ SZENARIO 3: Split-Vote ============
  console.log('━━━ SZENARIO 3: User 1 Split-Vote (Ja, dann Nein) ━━━');
  t0 = performance.now();
  const poll3 = await createAndStartPoll(organizerPage, 'Szenario 3: Split');

  // Erste Teilabstimmung: Ja
  await voteOption(user1Page, 'user1 (Teil 1: Ja)', 0);
  await user1Page.waitForTimeout(3000);

  // Prüfe Zwischenstand
  const mid = getVoteResults(poll3);
  const midCycle = mid.cycles.split('\n').find(r => r.includes('user1'));
  if (midCycle) {
    const used = parseInt(midCycle.split('\t').pop());
    console.log(`  📊 Zwischenstand: ${used}/100 Stimmen verbraucht`);
  }

  // Zweite Teilabstimmung: Nein (Modal sollte wieder erscheinen wenn Stimmen übrig)
  try {
    await voteOption(user1Page, 'user1 (Teil 2: Nein)', 1);
    await user1Page.waitForTimeout(3000);
  } catch (e) {
    console.log(`  ⚠ Zweite Teilabstimmung nicht möglich: ${e.message.substring(0, 80)}`);
  }

  timings.scenario3 = Math.round(performance.now() - t0);
  printResults(poll3, 'Szenario 3 Endergebnis');
  console.log(`  ⏱  ${timings.scenario3}ms\n`);

  await stopPoll(organizerPage);

  // ============ SZENARIO 4: Enthaltung ============
  console.log('━━━ SZENARIO 4: User 1 Enthaltung ━━━');
  t0 = performance.now();
  const poll4 = await createAndStartPoll(organizerPage, 'Szenario 4: Enthaltung');

  try {
    await voteAbstain(user1Page, 'user1');
    await user1Page.waitForTimeout(3000);
  } catch (e) {
    console.log(`  ⚠ Enthaltung fehlgeschlagen: ${e.message.substring(0, 80)}`);
  }

  timings.scenario4 = Math.round(performance.now() - t0);
  printResults(poll4, 'Szenario 4');
  console.log(`  ⏱  ${timings.scenario4}ms\n`);

  await stopPoll(organizerPage);

  // ============ SZENARIO 5: Reload während Voting ============
  console.log('━━━ SZENARIO 5: Vote, Reload, weitervoten ━━━');
  t0 = performance.now();
  const poll5 = await createAndStartPoll(organizerPage, 'Szenario 5: Reload');

  // Erste Abstimmung
  await voteOption(user1Page, 'user1 (vor Reload)', 0);
  await user1Page.waitForTimeout(2000);

  // Zwischenstand prüfen
  let mid5 = getVoteResults(poll5);
  const usedBefore = mid5.cycles.split('\n').find(r => r.includes('user1'));
  console.log(`  📊 Vor Reload: ${usedBefore ? usedBefore.split('\t').pop() : '?'}/100 Stimmen`);

  // Seite reloaden
  console.log('  🔄 Seite wird reloaded...');
  await user1Page.reload({ waitUntil: 'networkidle' });
  await user1Page.waitForTimeout(5000);

  // Versuche weiter zu voten nach Reload
  try {
    await voteOption(user1Page, 'user1 (nach Reload)', 1);
    await user1Page.waitForTimeout(2000);
  } catch (e) {
    console.log(`  ⚠ Nach Reload: ${e.message.substring(0, 80)}`);
  }

  timings.scenario5 = Math.round(performance.now() - t0);
  printResults(poll5, 'Szenario 5 Endergebnis');
  console.log(`  ⏱  ${timings.scenario5}ms\n`);

  await stopPoll(organizerPage);

  // ============ SZENARIO 6: Over-Voting Versuch ============
  console.log('━━━ SZENARIO 6: Versuch mehr Stimmen als erlaubt ━━━');
  t0 = performance.now();

  // User1 hat 100 Stimmen — setze temporär auf 2 für diesen Test
  dbQuery("UPDATE event_user SET vote_amount = 2 WHERE id = 34297");
  console.log('  vote_amount für user1 auf 2 gesetzt');

  const poll6 = await createAndStartPoll(organizerPage, 'Szenario 6: Over-Vote');

  // Erste Abstimmung (sollte funktionieren)
  await voteOption(user1Page, 'user1 (Stimme 1)', 0);
  await user1Page.waitForTimeout(2000);

  let mid6 = getVoteResults(poll6);
  const usedAfterFirst = mid6.cycles.split('\n').find(r => r.includes('user1'));
  console.log(`  📊 Nach 1. Vote: ${usedAfterFirst ? usedAfterFirst.split('\t').pop() : '?'}/2 Stimmen`);

  // Zweite Abstimmung (sollte auch funktionieren — letzte Stimme)
  try {
    await voteOption(user1Page, 'user1 (Stimme 2)', 1);
    await user1Page.waitForTimeout(2000);
  } catch (e) {
    console.log(`  📊 2. Vote: ${e.message.substring(0, 80)}`);
  }

  mid6 = getVoteResults(poll6);
  const usedAfterSecond = mid6.cycles.split('\n').find(r => r.includes('user1'));
  console.log(`  📊 Nach 2. Vote: ${usedAfterSecond ? usedAfterSecond.split('\t').pop() : '?'}/2 Stimmen`);

  // Dritte Abstimmung (sollte NICHT funktionieren — Limit erreicht)
  try {
    await voteOption(user1Page, 'user1 (Stimme 3 - SOLLTE SCHEITERN)', 0);
    console.log('  ❌ FEHLER: Dritte Stimme wurde angenommen obwohl Limit 2!');
  } catch (e) {
    console.log('  ✓ Dritte Stimme korrekt abgelehnt (kein Modal mehr)');
  }

  timings.scenario6 = Math.round(performance.now() - t0);
  printResults(poll6, 'Szenario 6 Endergebnis');

  // Prüfe DB: maximal 2 Stimmen
  const totalVotes6 = dbQuery(`SELECT COUNT(*) as cnt FROM poll_answer pa INNER JOIN poll_result pr ON pa.poll_result_id = pr.id WHERE pr.poll_id = ${poll6}`);
  const voteCount = parseInt(totalVotes6.split('\n').pop().trim());
  console.log(`  📊 Tatsächliche Stimmen in DB: ${voteCount} (max erlaubt: 2)`);
  if (voteCount <= 2) {
    console.log('  ✓ Over-Voting korrekt verhindert!');
  } else {
    console.log('  ❌ OVER-VOTING! Mehr Stimmen als erlaubt in der DB!');
  }

  console.log(`  ⏱  ${timings.scenario6}ms\n`);

  // vote_amount zurücksetzen
  dbQuery("UPDATE event_user SET vote_amount = 100 WHERE id = 34297");

  await stopPoll(organizerPage);

  // ============ SZENARIO 7: Multiple-Answer Bulk ============
  console.log('━━━ SZENARIO 7: Multiple-Answer (Checkboxen, alle Stimmen) ━━━');
  t0 = performance.now();

  const poll7 = await createAndStartPoll(organizerPage, 'Szenario 7: Multi-Answer', {
    customOptions: ['Option A', 'Option B', 'Option C']
  });

  // Warte auf Modal
  await waitForModal(user1Page);

  // Checkboxen anklicken (Option A und C)
  const checkboxes = user1Page.locator('input[type="checkbox"]');
  const cbCount = await checkboxes.count();
  console.log(`  ${cbCount} Checkboxen gefunden`);

  if (cbCount >= 2) {
    await checkboxes.nth(0).click({ force: true }); // Option A
    await user1Page.waitForTimeout(300);
    await checkboxes.nth(2 < cbCount ? 2 : 1).click({ force: true }); // Option C oder B
    await user1Page.waitForTimeout(300);

    // Submit
    await user1Page.locator('button[type="submit"], button:has-text("Jetzt abstimmen")').first().click({ force: true, timeout: 5000 });
    console.log('  ✓ user1 → Multiple-Answer abgestimmt');
  } else {
    console.log('  ⚠ Zu wenige Checkboxen, überspringe');
  }

  await user1Page.waitForTimeout(3000);

  timings.scenario7 = Math.round(performance.now() - t0);
  printResults(poll7, 'Szenario 7');
  console.log(`  ⏱  ${timings.scenario7}ms\n`);

  await stopPoll(organizerPage);

  // ============ ZUSAMMENFASSUNG ============
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ZEITMESSUNGEN:');
  console.log(`  Login:      ${timings.login}ms`);
  console.log(`  Szenario 1: ${timings.scenario1}ms (beide User, alle Stimmen)`);
  console.log(`  Szenario 2: ${timings.scenario2}ms (nur ein User)`);
  console.log(`  Szenario 3: ${timings.scenario3}ms (Split-Vote)`);
  console.log(`  Szenario 4: ${timings.scenario4}ms (Enthaltung)`);
  console.log(`  Szenario 5: ${timings.scenario5}ms (Reload während Voting)`);
  console.log(`  Szenario 6: ${timings.scenario6}ms (Over-Voting Versuch)`);
  console.log(`  Szenario 7: ${timings.scenario7}ms (Multiple-Answer Bulk)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Cleanup
  await organizerPage.close().catch(() => {});
  await user1Page.close().catch(() => {});
  await user2Page.close().catch(() => {});
});
