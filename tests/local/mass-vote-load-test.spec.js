/**
 * Massentest: 250 Teilnehmer x 200 Stimmen = 50.000 Stimmen
 *
 * Fokus: DB-Last und Wartezeiten der Nutzer
 * - Misst die Zeit vom Vote-Klick bis zur Bestätigung pro User
 * - Misst DB-Verarbeitungszeit (wann sind alle Stimmen in der DB)
 * - Trackt Latenz-Verteilung (min/max/avg/p95)
 *
 * Setup: Die User werden automatisch in der DB erstellt
 */
const { test, expect } = require('@playwright/test');
const { CONFIG } = require('./config');
const { execSync } = require('child_process');

// ============ KONFIGURATION ============
const TOTAL_USERS = 250;
const VOTES_PER_USER = 200;
const BATCH_SIZE = 25;
const TOTAL_BATCHES = Math.ceil(TOTAL_USERS / BATCH_SIZE);

function dbQuery(sql) {
  try {
    return execSync(
      `echo "${sql.replace(/"/g, '\\"')}" | docker exec -i voting_db mysql -u root -prootpassword application 2>/dev/null`,
      { encoding: 'utf8' }
    ).trim();
  } catch (e) {
    return '';
  }
}

function setupTestUsers() {
  console.log(`\n🔧 Setup: ${TOTAL_USERS} User mit je ${VOTES_PER_USER} Stimmen`);

  const count = parseInt(
    dbQuery(`SELECT COUNT(*) FROM event_user WHERE event_id = ${CONFIG.EVENT_ID} AND username LIKE 'loadtest-user-%'`)
      .split('\n').pop().trim()
  ) || 0;

  if (count < TOTAL_USERS) {
    console.log(`  Erstelle ${TOTAL_USERS - count} fehlende User...`);
    // Batch-Insert für Performance
    const batchSize = 50;
    for (let i = count + 1; i <= TOTAL_USERS; i += batchSize) {
      const values = [];
      for (let j = i; j < i + batchSize && j <= TOTAL_USERS; j++) {
        values.push(
          `(${CONFIG.EVENT_ID}, 'loadtest-user-${j}', 'User ${j}', 0, 1, 1, ${VOTES_PER_USER}, UNIX_TIMESTAMP())`
        );
      }
      dbQuery(
        `INSERT IGNORE INTO event_user (event_id, username, public_name, online, verified, allow_to_vote, vote_amount, create_datetime) VALUES ${values.join(',')}`
      );
    }
    console.log(`  ✓ User erstellt`);
  }

  // Reset alle Test-User
  dbQuery(
    `UPDATE event_user SET password = '', online = 0, verified = 1, allow_to_vote = 1, vote_amount = ${VOTES_PER_USER}, last_activity = NULL WHERE event_id = ${CONFIG.EVENT_ID} AND username LIKE 'loadtest-user-%'`
  );

  // Alte Polls aufräumen
  dbQuery(`DELETE pa FROM poll_answer pa JOIN poll_result pr ON pa.poll_result_id = pr.id JOIN poll p ON pr.poll_id = p.id WHERE p.event_id = ${CONFIG.EVENT_ID} AND p.title LIKE 'Massentest%'`);
  dbQuery(`DELETE puv FROM poll_user_voted puv JOIN poll_result pr ON puv.poll_result_id = pr.id JOIN poll p ON pr.poll_id = p.id WHERE p.event_id = ${CONFIG.EVENT_ID} AND p.title LIKE 'Massentest%'`);
  dbQuery(`DELETE pr FROM poll_result pr JOIN poll p ON pr.poll_id = p.id WHERE p.event_id = ${CONFIG.EVENT_ID} AND p.title LIKE 'Massentest%'`);
  dbQuery(`DELETE pu FROM poll_user pu JOIN poll p ON pu.poll_id = p.id WHERE p.event_id = ${CONFIG.EVENT_ID} AND p.title LIKE 'Massentest%'`);
  dbQuery(`DELETE FROM poll WHERE event_id = ${CONFIG.EVENT_ID} AND title LIKE 'Massentest%'`);

  const finalCount = dbQuery(
    `SELECT COUNT(*) FROM event_user WHERE event_id = ${CONFIG.EVENT_ID} AND username LIKE 'loadtest-user-%'`
  ).split('\n').pop().trim();
  console.log(`  ✓ ${finalCount} User bereit (je ${VOTES_PER_USER} Stimmen)\n`);
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
    const nearby = await input.evaluate(el =>
      el.closest('.col-md-6, .col-lg-6, .card')?.textContent || ''
    ).catch(() => '');
    if (nearby.includes('Organisator') || (nearby.includes('Login') && nearby.includes('Passwort'))) {
      await input.fill(CONFIG.ORGANIZER_USERNAME);
      break;
    }
  }

  const allPasswords = page.locator('input[type="password"]');
  const pwCount = await allPasswords.count();
  if (pwCount > 0) {
    await allPasswords.nth(pwCount - 1).fill(CONFIG.ORGANIZER_PASSWORD);
  }

  await page.locator('button:has-text("Login")').last().click();
  await page.waitForURL(/admin|dashboard/, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  console.log('  ✓ Organizer eingeloggt');
  return page;
}

async function loginUserBatch(browser, startIdx, batchSize) {
  const pages = [];
  const promises = [];

  for (let i = startIdx; i < startIdx + batchSize && i <= TOTAL_USERS; i++) {
    const username = `loadtest-user-${i}`;
    const publicName = `User ${i}`;

    promises.push((async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const magicLink = CONFIG.MAGIC_LINK_URL_TEMPLATE
        .replace('#USERNAME#', encodeURIComponent(username))
        .replace('#PUBLIC_NAME#', encodeURIComponent(publicName));

      await page.goto(magicLink, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      try {
        await Promise.all([
          page.waitForResponse(r => r.url().includes('/login') && r.status() === 201, { timeout: 15000 }),
          page.locator('button.btn-primary').first().click()
        ]);
      } catch (e) {
        // User already logged in
      }

      await page.waitForTimeout(2000);
      pages.push({ page, username, index: i });
    })());
  }

  await Promise.all(promises);
  return pages;
}

async function voteAndMeasure(page, username) {
  // Warte auf Vote-Modal
  const modal = page.locator('.modal.show, .modal-dialog:visible').first();
  try {
    await modal.waitFor({ state: 'visible', timeout: 60000 });
  } catch (e) {
    return { success: false, waitTime: -1, username, error: 'kein Modal' };
  }
  await page.waitForTimeout(200);

  // Erste Option wählen
  const radio = page.locator('input[type="radio"]').first();
  await radio.click({ force: true });

  // ZEITMESSUNG: Vom Klick bis Bestätigung
  const voteStart = performance.now();

  await page.locator('button[type="submit"], button:has-text("Jetzt abstimmen")')
    .first().click({ force: true, timeout: 10000 });

  // Warte bis Modal geschlossen oder Bestätigung
  try {
    await page.locator('.modal.show').waitFor({ state: 'hidden', timeout: 30000 });
  } catch (e) {
    // Modal bleibt offen bei Split-Voting
  }

  const waitTime = Math.round(performance.now() - voteStart);
  return { success: true, waitTime, username };
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * (p / 100)) - 1;
  return sorted[Math.max(0, idx)];
}

// ============ TEST ============
test.describe(`Massentest: ${TOTAL_USERS} User x ${VOTES_PER_USER} Stimmen`, () => {
  test.setTimeout(900000); // 15 Minuten

  test(`Geheime Abstimmung mit ${TOTAL_USERS * VOTES_PER_USER} Stimmen`, async ({ browser }) => {
    setupTestUsers();

    // ---- PHASE 1: Organizer Login ----
    console.log('📋 PHASE 1: Organizer Login');
    const organizerPage = await loginOrganizer(browser);

    // ---- PHASE 2: User Login in Batches ----
    console.log(`\n📋 PHASE 2: ${TOTAL_USERS} User einloggen (${TOTAL_BATCHES} Batches à ${BATCH_SIZE})`);
    const allUserPages = [];
    const loginStart = performance.now();

    for (let batch = 0; batch < TOTAL_BATCHES; batch++) {
      const startIdx = batch * BATCH_SIZE + 1;
      const batchStart = performance.now();
      const batchPages = await loginUserBatch(browser, startIdx, BATCH_SIZE);
      allUserPages.push(...batchPages);
      const batchTime = Math.round(performance.now() - batchStart);
      console.log(`  Batch ${batch + 1}/${TOTAL_BATCHES}: ${batchPages.length} User (${batchTime}ms)`);
    }

    const loginTime = Math.round(performance.now() - loginStart);
    console.log(`  ✓ ${allUserPages.length} User eingeloggt in ${Math.round(loginTime / 1000)}s\n`);

    const onlineCount = dbQuery(
      `SELECT COUNT(*) FROM event_user WHERE event_id = ${CONFIG.EVENT_ID} AND online = 1`
    ).split('\n').pop().trim();
    console.log(`  Online-User in DB: ${onlineCount}`);

    // ---- PHASE 3: Poll starten ----
    console.log('\n📋 PHASE 3: Abstimmung starten');
    const pollId = await createAndStartPoll(organizerPage);

    // ---- PHASE 4: Alle User voten - Wartezeiten messen ----
    console.log(`\n📋 PHASE 4: ${allUserPages.length} User stimmen ab`);
    const voteStart = performance.now();
    const waitTimes = [];
    let successCount = 0;
    let failCount = 0;

    for (let batch = 0; batch < TOTAL_BATCHES; batch++) {
      const batchUsers = allUserPages.slice(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE);
      const batchStart = performance.now();

      const results = await Promise.allSettled(
        batchUsers.map(({ page, username }) => voteAndMeasure(page, username))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
          waitTimes.push(result.value.waitTime);
        } else {
          failCount++;
          const error = result.status === 'fulfilled' ? result.value.error : result.reason?.message;
          console.log(`  ⚠ Fehler: ${error}`);
        }
      }

      const batchTime = Math.round(performance.now() - batchStart);
      const batchSuccess = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      console.log(`  Batch ${batch + 1}/${TOTAL_BATCHES}: ${batchSuccess}/${batchUsers.length} OK (${batchTime}ms)`);
    }

    const voteTime = Math.round(performance.now() - voteStart);

    // ---- PHASE 5: DB-Verarbeitungszeit messen ----
    console.log('\n📋 PHASE 5: DB-Verarbeitungszeit prüfen');
    const dbCheckStart = performance.now();
    let dbVotes = 0;
    const expectedVotes = successCount * VOTES_PER_USER;

    // Poll bis zu 30s auf vollständige Verarbeitung
    for (let i = 0; i < 30; i++) {
      dbVotes = parseInt(
        dbQuery(
          `SELECT COUNT(*) FROM poll_answer pa JOIN poll_result pr ON pa.poll_result_id = pr.id WHERE pr.poll_id = ${pollId}`
        ).split('\n').pop().trim()
      ) || 0;

      if (dbVotes >= expectedVotes) break;
      console.log(`  DB: ${dbVotes}/${expectedVotes} Stimmen verarbeitet...`);
      await organizerPage.waitForTimeout(1000);
    }

    const dbProcessingTime = Math.round(performance.now() - dbCheckStart);
    const totalVoters = dbQuery(
      `SELECT COUNT(DISTINCT puv.event_user_id) FROM poll_user_voted puv JOIN poll_result pr ON puv.poll_result_id = pr.id WHERE pr.poll_id = ${pollId}`
    ).split('\n').pop().trim();

    const votesByAnswer = dbQuery(
      `SELECT pa.answer_content, COUNT(*) as cnt FROM poll_answer pa JOIN poll_result pr ON pa.poll_result_id = pr.id WHERE pr.poll_id = ${pollId} GROUP BY pa.answer_content ORDER BY cnt DESC`
    );

    // ---- REPORT ----
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MASSENTEST ERGEBNIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Teilnehmer:           ${TOTAL_USERS} (${onlineCount} online)`);
    console.log(`  Stimmen/User:         ${VOTES_PER_USER}`);
    console.log(`  Erwartet:             ${TOTAL_USERS * VOTES_PER_USER} Stimmen`);
    console.log(`  In DB:                ${dbVotes} Stimmen`);
    console.log(`  Voters:               ${totalVoters}`);
    console.log(`  Erfolg:               ${successCount}/${TOTAL_USERS} User`);
    console.log(`  Fehlgeschlagen:       ${failCount} User`);
    console.log('');
    console.log('  ⏱  ZEITEN:');
    console.log(`     Login gesamt:      ${Math.round(loginTime / 1000)}s`);
    console.log(`     Voting gesamt:     ${Math.round(voteTime / 1000)}s`);
    console.log(`     DB-Verarbeitung:   ${Math.round(dbProcessingTime / 1000)}s (bis alle Stimmen in DB)`);
    console.log('');
    if (waitTimes.length > 0) {
      console.log('  ⏱  WARTEZEIT PRO USER (Klick → Bestätigung):');
      console.log(`     Minimum:          ${Math.min(...waitTimes)}ms`);
      console.log(`     Maximum:          ${Math.max(...waitTimes)}ms`);
      console.log(`     Durchschnitt:     ${Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)}ms`);
      console.log(`     Median:           ${percentile(waitTimes, 50)}ms`);
      console.log(`     P95:              ${percentile(waitTimes, 95)}ms`);
      console.log(`     P99:              ${percentile(waitTimes, 99)}ms`);
    }
    console.log('');
    console.log(`     Throughput:        ${Math.round((dbVotes / voteTime) * 1000)} Stimmen/Sekunde`);
    console.log('');
    console.log('  Ergebnis:');
    if (votesByAnswer) {
      votesByAnswer.split('\n').slice(1).forEach(line => console.log(`     ${line}`));
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Assertions
    expect(successCount).toBeGreaterThan(0);
    expect(parseInt(dbVotes)).toBeGreaterThan(0);

    // Cleanup
    for (const { page } of allUserPages) {
      await page.close().catch(() => {});
    }
  });
});

async function createAndStartPoll(organizerPage) {
  const title = `Massentest ${TOTAL_USERS}x${VOTES_PER_USER} - ${new Date().toLocaleTimeString()}`;

  await organizerPage.goto(
    `${CONFIG.CLIENT_URL}/admin/event/polls/${CONFIG.EVENT_ID}/poll/new`,
    { waitUntil: 'networkidle', timeout: 30000 }
  );
  await organizerPage.waitForTimeout(3000);

  const titleField = organizerPage.locator('input[placeholder*="abgestimmt"]').first();
  await titleField.waitFor({ state: 'visible', timeout: 10000 });
  await titleField.fill(title);
  await organizerPage.waitForTimeout(1000);

  const startBtn = organizerPage.locator('button:has-text("speichern & sofort starten")');
  for (let retry = 0; retry < 20; retry++) {
    if (!(await startBtn.isDisabled().catch(() => true))) break;
    await organizerPage.waitForTimeout(2000);
  }

  await startBtn.click({ timeout: 10000 });
  await organizerPage.waitForTimeout(1000);

  const confirmBtn = organizerPage.locator('button:has-text("Bestätigen")').first();
  if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await confirmBtn.click();
  }
  await organizerPage.waitForTimeout(3000);

  const pollId = dbQuery(
    `SELECT id FROM poll WHERE event_id = ${CONFIG.EVENT_ID} ORDER BY id DESC LIMIT 1`
  ).split('\n').pop().trim();
  console.log(`  ✓ Poll "${title}" gestartet (ID: ${pollId})`);
  return pollId;
}
