/**
 * Szenario 7: Multiple-Answer Bulk Vote
 * Eigenständiger Test — kann einzeln gestartet werden.
 */
const { test, expect } = require('@playwright/test');
const { CONFIG } = require('./config');
const { execSync } = require('child_process');

function dbQuery(sql) {
  try {
    return execSync(
      `echo "${sql.replace(/"/g, '\\"')}" | docker exec -i voting_db mysql -u root -prootpassword application 2>/dev/null`,
      { encoding: 'utf8' }
    ).trim();
  } catch (e) { return ''; }
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

  const allInputs = page.locator('input[type="text"], input:not([type])');
  const inputCount = await allInputs.count();
  for (let i = 0; i < inputCount; i++) {
    const input = allInputs.nth(i);
    const nearby = await input.evaluate(el => el.closest('.col-md-6, .col-lg-6, .card')?.textContent || '').catch(() => '');
    if (nearby.includes('Organisator') || nearby.includes('Login') && nearby.includes('Passwort')) {
      await input.fill(CONFIG.ORGANIZER_USERNAME);
      break;
    }
  }
  const allPasswords = page.locator('input[type="password"]');
  const pwCount = await allPasswords.count();
  if (pwCount > 0) await allPasswords.nth(pwCount - 1).fill(CONFIG.ORGANIZER_PASSWORD);

  await page.locator('button:has-text("Login")').last().click();
  await page.waitForURL(/admin|dashboard/, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  console.log('  ✓ Organizer eingeloggt');
  return page;
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
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) await confirmBtn.click();
    await organizerPage.waitForTimeout(2000);
  }
  console.log('  ✓ Poll gestoppt');
}


test('Szenario 7: Multiple-Answer Bulk Vote', async ({ browser }) => {
  test.setTimeout(180000);

  // Reset
  dbQuery("UPDATE event_user SET password = '', online = 0, last_activity = NULL, vote_amount = 100 WHERE event_id = 1055");

  console.log('\n📋 Login...');
  const t0Login = performance.now();
  const organizerPage = await loginOrganizer(browser);
  const user1Page = await loginUser(browser, 'user1-windows', 'Windows User');
  console.log(`  ⏱  Login: ${Math.round(performance.now() - t0Login)}ms\n`);

  // Verify online
  const onlineCheck = dbQuery("SELECT COUNT(*) as cnt FROM event_user WHERE event_id = 1055 AND online = 1");
  expect(parseInt(onlineCheck.split('\n').pop().trim())).toBeGreaterThanOrEqual(1);

  // ============ Poll mit individuellen Optionen erstellen ============
  console.log('━━━ SZENARIO 7: Multiple-Answer (Checkboxen) ━━━');
  const t0 = performance.now();

  // Navigiere zum Poll-Formular
  await organizerPage.goto(
    `${CONFIG.CLIENT_URL}/admin/event/polls/${CONFIG.EVENT_ID}/poll/new`,
    { waitUntil: 'networkidle', timeout: 30000 }
  );
  await organizerPage.waitForTimeout(3000);

  // Titel eingeben
  const titleField = organizerPage.locator('input[placeholder*="abgestimmt"]').first();
  await titleField.waitFor({ state: 'visible', timeout: 10000 });
  await titleField.fill('Szenario 7: Multi-Answer Test');

  // Screenshot vor Umschalten
  await organizerPage.screenshot({ path: 'test-results/s7-before-switch.png' });

  // Auf "Individuelle Antwortoptionen" umschalten
  const radioLabels = organizerPage.locator('label');
  const labelCount = await radioLabels.count();
  console.log(`  ${labelCount} Labels gefunden`);

  for (let i = 0; i < labelCount; i++) {
    const text = await radioLabels.nth(i).textContent().catch(() => '');
    if (text.includes('Individuelle')) {
      console.log(`  Klicke Label ${i}: "${text.trim()}"`);
      await radioLabels.nth(i).click();
      await organizerPage.waitForTimeout(1000);
      break;
    }
  }

  // Screenshot nach Umschalten
  await organizerPage.screenshot({ path: 'test-results/s7-after-switch.png' });

  // Textarea mit Optionen füllen
  const textareas = organizerPage.locator('textarea');
  const taCount = await textareas.count();
  console.log(`  ${taCount} Textareas gefunden`);

  if (taCount > 0) {
    const ta = textareas.first();
    await ta.click();
    // Tastatureingabe statt fill() — triggert Vue's native Event-Handler
    await ta.pressSequentially('Rot', { delay: 30 });
    await organizerPage.keyboard.press('Enter');
    await ta.pressSequentially('Blau', { delay: 30 });
    await organizerPage.keyboard.press('Enter');
    await ta.pressSequentially('Gruen', { delay: 30 });
    // Tab raus um blur/change zu triggern
    await organizerPage.keyboard.press('Tab');
    console.log('  ✓ Optionen eingegeben: Rot, Blau, Gruen');
    await organizerPage.waitForTimeout(500);

    // Maximal auszuwählen auf 0 setzen (= alle auswählbar = Checkboxen)
    const maxVotesInput = organizerPage.locator('input[type="number"]').first();
    if (await maxVotesInput.isVisible().catch(() => false)) {
      await maxVotesInput.click();
      await maxVotesInput.fill('0');
      await organizerPage.keyboard.press('Tab');
      console.log('  ✓ maxVotes auf 0 gesetzt (alle auswählbar)');
    }
    await organizerPage.waitForTimeout(500);
  } else {
    console.log('  ❌ Keine Textarea gefunden!');
  }

  // Screenshot nach Optionen
  await organizerPage.screenshot({ path: 'test-results/s7-after-options.png' });

  // Warte auf Button enabled (KEIN Reload — das würde das Custom-Formular zurücksetzen)
  const startBtn = organizerPage.locator('button:has-text("speichern & sofort starten")');
  for (let i = 0; i < 30; i++) {
    if (!await startBtn.isDisabled().catch(() => true)) break;
    console.log(`  Button disabled, warte... (${i + 1})`);
    await organizerPage.waitForTimeout(2000);
  }

  // Scroll zum Button und klicke
  await startBtn.scrollIntoViewIfNeeded();
  await organizerPage.waitForTimeout(500);
  await organizerPage.screenshot({ path: 'test-results/s7-before-click.png' });

  const isDisabled = await startBtn.isDisabled().catch(() => true);
  console.log(`  Button disabled: ${isDisabled}`);

  if (isDisabled) {
    console.log('  ❌ Button ist immer noch disabled!');
    // Fallback: "Abstimmung speichern" (ohne sofort starten) versuchen
    const saveOnly = organizerPage.locator('button:has-text("Abstimmung speichern")').first();
    if (await saveOnly.isVisible().catch(() => false)) {
      await saveOnly.click();
      console.log('  ⚠ Fallback: Nur gespeichert (nicht gestartet)');
    }
  } else {
    await startBtn.click({ timeout: 5000 });
  }
  await organizerPage.waitForTimeout(1000);

  // Bestätigungsdialog
  const confirmBtn = organizerPage.locator('button:has-text("Bestätigen")').first();
  if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await confirmBtn.click();
    console.log('  ✓ Bestätigungsdialog bestätigt');
  }
  await organizerPage.waitForTimeout(3000);

  await organizerPage.screenshot({ path: 'test-results/s7-after-click.png' });

  // Poll-ID holen
  const result = dbQuery("SELECT p.id FROM poll p WHERE p.event_id = 1055 ORDER BY p.id DESC LIMIT 1");
  const pollId = result.split('\n').pop().trim();
  console.log(`  ✓ Poll gestartet (ID: ${pollId})`);

  // Prüfe Poll-Optionen
  const options = dbQuery(`SELECT content FROM poll_possible_answer WHERE poll_id = ${pollId}`);
  console.log(`  📋 Poll-Optionen: ${options.split('\\n').slice(1).join(', ')}`);

  // ============ User stimmt ab ============

  // Warte auf Modal mit Checkboxen
  const modal = user1Page.locator('.modal.show, .modal-dialog').first();
  await modal.waitFor({ state: 'visible', timeout: 30000 });
  await user1Page.waitForTimeout(1000);

  // Screenshot vom Modal
  await user1Page.screenshot({ path: 'test-results/s7-user-modal.png' });

  // Antwort-Labels finden und anklicken (Rot, Blau, Gruen)
  const answerLabels = user1Page.locator('.modal .form-check label');
  const answerLabelCount = await answerLabels.count();
  console.log(`  ${answerLabelCount} Antwort-Labels im Modal`);

  // Alle Labels auflisten
  for (let i = 0; i < answerLabelCount; i++) {
    const text = await answerLabels.nth(i).textContent().catch(() => '');
    console.log(`    [${i}] "${text.trim()}"`);
  }

  // Klicke "Rot" und "Gruen" an
  let clicked = 0;
  for (let i = 0; i < answerLabelCount; i++) {
    const text = (await answerLabels.nth(i).textContent().catch(() => '')).trim();
    if (text === 'Rot' || text === 'Gruen') {
      await answerLabels.nth(i).click({ force: true });
      await user1Page.waitForTimeout(300);
      console.log(`  ✓ "${text}" angeklickt`);
      clicked++;
    }
  }

  if (clicked >= 2) {
    // Screenshot nach Auswahl
    await user1Page.screenshot({ path: 'test-results/s7-user-selected.png' });

    // Submit
    const submitBtn = user1Page.locator('button:has-text("Jetzt abstimmen"), button[type="submit"]').first();
    await submitBtn.click({ force: true, timeout: 5000 });
    console.log('  ✓ Abstimmung abgeschickt');
  } else {
    console.log(`  ⚠ Nur ${clicked} Antworten gefunden/angeklickt`);
    await user1Page.screenshot({ path: 'test-results/s7-click-failed.png' });
  }

  await user1Page.waitForTimeout(3000);

  // Ergebnis
  const votes = dbQuery(`SELECT answer_content, COUNT(*) as cnt FROM poll_answer pa INNER JOIN poll_result pr ON pa.poll_result_id = pr.id WHERE pr.poll_id = ${pollId} GROUP BY answer_content ORDER BY cnt DESC`);
  const cycles = dbQuery(`SELECT eu.username, puv.vote_cycle FROM poll_user_voted puv INNER JOIN event_user eu ON eu.id = puv.event_user_id INNER JOIN poll_result pr ON puv.poll_result_id = pr.id WHERE pr.poll_id = ${pollId}`);

  console.log(`  📊 Ergebnis:`);
  if (votes) votes.split('\n').slice(1).forEach(l => console.log(`     ${l}`));
  if (cycles) cycles.split('\n').slice(1).forEach(l => console.log(`     👤 ${l}`));

  const totalTime = Math.round(performance.now() - t0);
  console.log(`  ⏱  ${totalTime}ms\n`);

  await stopPoll(organizerPage);

  await organizerPage.close().catch(() => {});
  await user1Page.close().catch(() => {});
});
