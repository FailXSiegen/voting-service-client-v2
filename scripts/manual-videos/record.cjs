// Records the manual videos against the LOCAL dev stack only (seeds and wipes its database!).
// Needs: API with ENABLE_JWT=1 on :4000, client on :5173, docker container votingtool-dev-db, ffmpeg.
//   node scripts/manual-videos/record.cjs [chapterId ...]
// Captions come straight from chapters.mjs, so video and text cannot drift apart.
const { execSync, execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const { chromium } = require(path.join(root, 'node_modules/playwright'));
const argon2 = require(path.join(root, '../voting-service-api/node_modules/argon2'));
const dbPassword = /^DATABASE_PASSWORD="?([^"\n]*)"?$/m.exec(
  fs.readFileSync(path.join(root, '../voting-service-api/.env'), 'utf8')
)[1];
const URL_BASE = 'http://localhost:5173';
const API = 'http://localhost:4000';
const OUT = path.join(root, 'public/hilfe');
const PASSWORD = crypto.randomBytes(12).toString('hex');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sql = (query) =>
  execSync(`docker exec -i votingtool-dev-db mysql -N -uroot -p'${dbPassword}' application`, {
    input: query,
  })
    .toString()
    .trim();

const USERS = [
  [1, 'm.mueller', 'Maria Müller (TV Musterstadt)', 3, 1],
  [2, 'p.schmidt', 'Peter Schmidt (SV Beispielhausen)', 3, 1],
  [3, 'a.klein', 'Anna Klein (Chor Harmonie)', 1, 1],
  [4, 'j.wagner', 'Jonas Wagner (Musikverein Tal)', 1, 0],
  [5, 's.neumann', 'Sara Neumann (Kulturkreis Nord)', 1, 1],
];
async function seed() {
  const hash = await argon2.hash(PASSWORD);
  const now = Math.floor(Date.now() / 1000);
  const orgs = [
    [1, 'verband', 'Verband Musterland', 0],
    [2, 'support', 'Support Team', 0],
    [4, 'admin', 'Plattform-Admin', 1],
  ];
  sql(`SET FOREIGN_KEY_CHECKS=0; TRUNCATE poll_answer; TRUNCATE poll_user_voted; TRUNCATE poll_user; TRUNCATE poll_result; TRUNCATE poll_possible_answer; TRUNCATE poll; TRUNCATE jwt_refresh_token; TRUNCATE vote_adjustment_log; DELETE FROM event_user; DELETE FROM event; DELETE FROM organizer; SET FOREIGN_KEY_CHECKS=1;
INSERT INTO organizer (id,create_datetime,username,email,password,public_name,public_organisation,confirmed_email,super_admin,verified,hash) VALUES ${orgs.map(([i, u, n, s]) => `(${i},${now},'${u}','${u}@example.test','${hash}','${n}','Musterland e.V.',1,${s},1,'')`).join(',')};
INSERT INTO event (id,organizer_id,create_datetime,modified_datetime,scheduled_datetime,title,description,lobby_open,active,slug,allow_magic_link,styles,logo,end_datetime,delete_datetime,multivote_type,async) VALUES
 (1,1,${now},${now},${now + 3600},'Mitgliederversammlung 2026','Ordentliche Versammlung des Verbandes',1,1,'mitgliederversammlung',0,'{}','',0,0,1,0),
 (2,1,${now},${now},${now + 7200},'Briefwahl Vorstand','Wahl des Vorstands per Briefwahl',0,1,'briefwahl-vorstand',0,'{}','',${now + 90000},0,1,1);
INSERT INTO event_user (id,event_id,create_datetime,username,email,password,public_name,allow_to_vote,vote_amount,online,verified) VALUES ${USERS.map(([i, u, n, v, o]) => `(${i},1,${now},'${u}','','','${n}',1,${v},0,${o})`).join(',')};`);
}

let browser;
const OVERLAY = () => {
  const start = () => {
    if (document.getElementById('__cap')) return;
    const style = document.createElement('style');
    style.textContent =
      '#__cap{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);max-width:1040px;background:rgba(17,24,39,.93);color:#fff;padding:12px 22px;border-radius:10px;font:600 20px/1.35 system-ui,sans-serif;z-index:2147483647;text-align:center;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.35)}#__cap:empty{display:none}#__cur{position:fixed;width:22px;height:22px;border-radius:50%;background:rgba(220,38,38,.55);border:2px solid #fff;box-shadow:0 0 0 2px rgba(220,38,38,.6);z-index:2147483646;pointer-events:none;transform:translate(-50%,-50%);left:-40px;top:-40px;transition:transform .12s}';
    document.documentElement.appendChild(style);
    const cap = document.createElement('div');
    cap.id = '__cap';
    cap.textContent = sessionStorage.getItem('__capText') || '';
    const cur = document.createElement('div');
    cur.id = '__cur';
    document.documentElement.append(cap, cur);
    addEventListener('mousemove', (e) => {
      cur.style.left = e.clientX + 'px';
      cur.style.top = e.clientY + 'px';
    });
    addEventListener('mousedown', () => (cur.style.transform = 'translate(-50%,-50%) scale(.6)'));
    addEventListener('mouseup', () => (cur.style.transform = 'translate(-50%,-50%)'));
  };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', start) : start();
};

const CONTEXT = { viewport: { width: 1280, height: 720 }, locale: 'de-DE' };
const loginOrganizer = async (username) => {
  const context = await browser.newContext(CONTEXT);
  const page = await context.newPage();
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await page.fill('#organizer-login-username', username);
  await page.fill('#organizer-login-password', PASSWORD);
  await page.locator('button:has-text("Login")').click();
  await page.waitForURL(/admin/);
  await sleep(800);
  const state = await context.storageState();
  await context.close();
  return state;
};
const participant = async (username, publicName) => {
  const context = await browser.newContext(CONTEXT);
  const page = await context.newPage();
  await page.goto(
    `${URL_BASE}/event/mitgliederversammlung?username=${username}&publicname=${encodeURIComponent(publicName)}`,
    { waitUntil: 'networkidle' }
  );
  await page.locator('input[type=password]').first().fill(PASSWORD);
  await page.locator('button.btn-primary').first().click();
  await sleep(3000);
  return page;
};
const organizerToken = (state) =>
  state.origins[0].localStorage.find((item) => item.name === 'apollo-token').value;
const gql = async (token, query, variables) => {
  const response = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
};
const createPoll = (token, title, start = true, extra = {}) =>
  gql(
    token,
    'mutation($input:CreateNewPollInput!,$s:Boolean!){createPoll(input:$input,instantStart:$s){id}}',
    {
      input: {
        eventId: 1,
        title,
        type: 'SECRET',
        possibleAnswers: [{ content: 'Ja' }, { content: 'Nein' }],
        minVotes: 0,
        maxVotes: 1,
        allowAbstain: false,
        ...extra,
      },
      s: start,
    }
  );

class Recorder {
  constructor(chapter, page) {
    this.chapter = chapter;
    this.page = page;
    this.index = 0;
  }
  async say(text) {
    const step = text ?? this.chapter.steps[this.index++];
    await this.page.evaluate((value) => {
      sessionStorage.setItem('__capText', value);
      const cap = document.getElementById('__cap');
      if (cap) cap.textContent = value;
    }, step);
    await sleep(Math.max(2200, step.length * 55));
  }
  async go(route) {
    await this.page.goto(URL_BASE + route, { waitUntil: 'networkidle' });
    await sleep(1200);
  }
  async move(locator) {
    await locator.waitFor({ state: 'visible', timeout: 8000 });
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 });
    await sleep(250);
  }
  async click(locator) {
    await this.move(locator);
    await locator.click();
    await sleep(600);
  }
  async type(locator, text) {
    await this.move(locator);
    await locator.click();
    await this.page.keyboard.type(text, { delay: 28 });
    await sleep(300);
  }
  button(text) {
    return this.page.locator(`button:has-text("${text}"),a:has-text("${text}")`).first();
  }
  row(name, label) {
    return this.page
      .locator('tr', { hasText: name })
      .first()
      .locator(
        `button[title*="${label}"],a[title*="${label}"],button:has-text("${label}"),a:has-text("${label}")`
      )
      .first();
  }
  async confirm() {
    await this.click(this.page.locator('button:has-text("Bestätigen")').first());
  }
}

const eventTitle = 'Mitgliederversammlung 2026';
const JOBS = require('./jobs.cjs')({
  sleep,
  sql,
  gql,
  createPoll,
  participant,
  URL_BASE,
  PASSWORD,
  eventTitle,
});

async function record(chapter, job, states) {
  await seed();
  const setup = job.setup ? await job.setup({ states, token: organizerToken(states.verband) }) : {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'manual-'));
  const context = await browser.newContext({
    ...CONTEXT,
    recordVideo: { dir, size: CONTEXT.viewport },
    ...(job.as ? { storageState: states[job.as] } : {}),
  });
  await context.addInitScript(OVERLAY);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const recorder = new Recorder(chapter, page);
  page.on('close', () => {});
  try {
    await job.run(recorder, { ...setup, token: organizerToken(states.verband), states });
  } catch (error) {
    await page
      .screenshot({ path: path.join(os.tmpdir(), `manual-fail-${chapter.id}.png`) })
      .catch(() => {});
    await context.close();
    throw error;
  }
  await sleep(1200);
  const webm = await page.video().path();
  await context.close();
  for (const extra of setup.pages || []) await extra.context().close();
  const mp4 = path.join(OUT, `${chapter.id}.mp4`);
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    webm,
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '30',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    mp4,
  ]);
  const duration = parseFloat(
    execFileSync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      mp4,
    ]).toString()
  );
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-ss',
    String(duration * 0.8),
    '-i',
    mp4,
    '-frames:v',
    '1',
    '-q:v',
    '5',
    path.join(OUT, `${chapter.id}.jpg`),
  ]);
  fs.rmSync(dir, { recursive: true });
  return { duration: Math.round(duration), kb: Math.round(fs.statSync(mp4).size / 1024) };
}

(async () => {
  const { CHAPTERS } = await import(
    path.join(root, 'src/core/views/staticPages/manual/chapters.mjs')
  );
  const only = process.argv.slice(2);
  browser = await chromium.launch();
  await seed();
  const states = {};
  for (const name of ['verband', 'support', 'admin']) states[name] = await loginOrganizer(name);
  const durations = {};
  let failed = 0;
  for (const chapter of CHAPTERS) {
    if (only.length && !only.includes(chapter.id)) continue;
    if (!JOBS[chapter.id]) {
      console.log('NOJOB', chapter.id);
      failed++;
      continue;
    }
    try {
      const result = await record(chapter, JOBS[chapter.id], states);
      durations[chapter.id] = result.duration;
      console.log('OK  ', chapter.id, `${result.duration}s ${result.kb}KB`);
    } catch (error) {
      failed++;
      console.log('FAIL', chapter.id, error.message.slice(0, 900));
    }
  }
  const metaPath = path.join(OUT, 'durations.json');
  const previous = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath)) : {};
  fs.writeFileSync(metaPath, JSON.stringify({ ...previous, ...durations }, null, 1));
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
