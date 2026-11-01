// One click-through per chapter. `say()` without argument shows the chapter's next step as caption.
module.exports = ({ sleep, sql, gql, createPoll, participant, URL_BASE, PASSWORD, eventTitle }) => {
  const USER_A = ['m.mueller', 'Maria Müller (TV Musterstadt)'];
  const USER_B = ['p.schmidt', 'Peter Schmidt (SV Beispielhausen)'];
  const USER_C = ['a.klein', 'Anna Klein (Chor Harmonie)'];
  const logIn = async (r, [username, name], route = '/event/mitgliederversammlung') => {
    await r.go(route);
    await r.page.locator('input').first().fill(username);
    await r.page.locator('input[type=password]').first().fill(PASSWORD);
    const nameField = r.page.locator('input:not([type=password])').nth(1);
    if (await nameField.count()) await nameField.fill(name);
    await r.click(r.button('In Veranstaltung einloggen'));
    await sleep(2500);
  };
  const othersOnline = () => sql('UPDATE event_user SET online=1 WHERE verified=1');
  const choose = (r, text) =>
    r.click(r.page.locator('#pollModal label', { hasText: text }).first());
  const voteButton = (r) => r.page.locator('#pollModal button[type=submit]').first();

  return {
    anmelden: {
      async run(r) {
        await r.go('/event/mitgliederversammlung');
        await r.say();
        await r.say();
        await r.type(r.page.locator('input').first(), USER_A[0]);
        await r.say();
        await r.type(r.page.locator('input[type=password]').first(), 'mein-Kennwort-1');
        await r.say();
        await r.type(r.page.locator('input:not([type=password])').nth(1), USER_A[1]);
        await r.say();
        await r.click(r.button('In Veranstaltung einloggen'));
        await sleep(2500);
      },
    },
    'personalisierte-links': {
      setup: async () =>
        sql('UPDATE event SET allow_magic_link=1, publicname_readonly=1 WHERE id=1'),
      async run(r) {
        await r.go(
          `/event/mitgliederversammlung?username=${USER_A[0]}&publicname=${encodeURIComponent(USER_A[1])}`
        );
        await r.say();
        await r.say();
        await r.say();
        await r.click(r.button('In Veranstaltung einloggen'));
        await sleep(2500);
        await r.say(
          'Beim Zugang per E-Mail öffnen Sie stattdessen den Link aus der E-Mail und aktivieren Ihr Gerät.'
        );
      },
    },
    warteraum: {
      async run(r, { token }) {
        await logIn(r, ['j.wagner', 'Jonas Wagner (Musikverein Tal)']);
        await r.say();
        await r.say();
        await gql(token, 'mutation{updateUserToParticipant(eventUserId:4){id}}');
        await sleep(2500);
        await r.say();
      },
    },
    dashboard: {
      async run(r, { token }) {
        await logIn(r, USER_A);
        await r.move(r.page.locator('.dashboard-stats p').first());
        await r.say();
        await r.say();
        await r.say();
        await r.say();
        await gql(
          token,
          'mutation($input:UpdateEventUserInput!){updateEventUser(input:$input){id}}',
          {
            input: {
              id: 1,
              eventId: 1,
              username: USER_A[0],
              publicName: USER_A[1],
              verified: true,
              allowToVote: true,
              voteAmount: 5,
            },
          }
        );
        await sleep(2500);
        await r.say('Ändert der Organisator Ihre Stimmen, sehen Sie das sofort.');
      },
    },
    abstimmen: {
      async run(r, { token }) {
        sql('UPDATE event_user SET vote_amount=1 WHERE id=3');
        await logIn(r, USER_C);
        await createPoll(token, 'Soll der Jahresabschluss 2025 genehmigt werden?');
        await sleep(2500);
        await r.say();
        await choose(r, 'Ja');
        await r.say();
        await r.click(voteButton(r));
        await sleep(1500);
        await r.say();
        await r.say();
      },
    },
    'mehrere-stimmen': {
      async run(r, { token }) {
        await logIn(r, USER_A);
        othersOnline();
        await createPoll(token, 'Soll der Mitgliedsbeitrag erhöht werden?');
        await sleep(2500);
        await r.say();
        await r.say();
        await r.click(
          r.page
            .locator('label[for="submit-answer-for-each-vote"],#submit-answer-for-each-vote')
            .first()
        );
        await r.say();
        await choose(r, 'Ja');
        await r.say();
        await r.click(voteButton(r));
        await sleep(1500);
        await r.say();
      },
    },
    mehrfachauswahl: {
      async run(r, { token }) {
        sql('UPDATE event_user SET vote_amount=1 WHERE id=3');
        await logIn(r, USER_C);
        await createPoll(token, 'Wahl von zwei Kassenprüfern', true, {
          possibleAnswers: [
            { content: 'Lena Berg' },
            { content: 'Tom Fischer' },
            { content: 'Eva Roth' },
          ],
          maxVotes: 2,
          minVotes: 1,
          allowAbstain: true,
        });
        await sleep(2500);
        await r.say();
        await choose(r, 'Lena Berg');
        await choose(r, 'Eva Roth');
        await r.say();
        await r.say();
        await r.click(voteButton(r));
        await sleep(1500);
      },
    },
    verbindung: {
      async run(r) {
        let blocked = false;
        const sockets = [];
        await r.page.routeWebSocket(/graphql/, (ws) => {
          if (blocked) return ws.close();
          const server = ws.connectToServer();
          ws.onMessage((message) => server.send(message));
          server.onMessage((message) => ws.send(message));
          sockets.push(ws);
        });
        await logIn(r, USER_A);
        blocked = true;
        for (const ws of sockets)
          await ws.close({ code: 1006 + 3000, reason: 'demo' }).catch(() => {});
        await sleep(2500);
        await r.say();
        blocked = false;
        const refresh = r.page
          .locator('div', { hasText: /^\s*Serververbindung unterbrochen/ })
          .last()
          .locator('button', { hasText: 'Aktualisieren' });
        await r.move(refresh);
        await r.say();
        await r.click(refresh);
        await sleep(2500);
        await r.say();
      },
    },
    'briefwahl-teilnehmer': {
      setup: async ({ token }) => {
        const now = Math.floor(Date.now() / 1000);
        sql(
          `INSERT INTO event_user (id,event_id,create_datetime,username,email,password,public_name,allow_to_vote,vote_amount,online,verified) VALUES (20,2,${now},'m.mueller','','','Maria Müller (TV Musterstadt)',1,1,0,1)`
        );
        await gql(
          token,
          'mutation($input:CreateNewPollInput!){createPoll(input:$input,instantStart:false){id}}',
          {
            input: {
              eventId: 2,
              title: 'Wahl des 1. Vorsitzenden',
              type: 'SECRET',
              possibleAnswers: [{ content: 'Ja' }, { content: 'Nein' }],
              minVotes: 0,
              maxVotes: 1,
              allowAbstain: false,
            },
          }
        );
        return {};
      },
      async run(r) {
        await logIn(r, USER_A, '/event/briefwahl-vorstand');
        await r.say();
        sql(`UPDATE event SET scheduled_datetime=${Math.floor(Date.now() / 1000) - 60} WHERE id=2`);
        await r.page.reload({ waitUntil: 'networkidle' });
        await sleep(1500);
        await r.say();
        const play = r.page
          .locator('button:has(.bi-play-fill),button:has(.bi-play),a:has(.bi-play-fill)')
          .first();
        if (await play.count()) await r.click(play);
        await sleep(1000);
        if (await r.page.locator('#pollModal label', { hasText: 'Ja' }).count())
          await choose(r, 'Ja');
        await r.say();
        await r.say();
      },
    },
    konto: {
      async run(r) {
        await r.go('/');
        await r.say();
        await r.click(r.button('Als Organisator registrieren'));
        await sleep(800);
        await r.say();
        const fields = r.page.locator('form input:visible');
        const values = [
          'verband-neu',
          'kontakt@example.test',
          'BeispielKennwort-1',
          'BeispielKennwort-1',
        ];
        for (let i = 0; i < Math.min(2, await fields.count()); i++)
          await r.type(fields.nth(i), values[i]);
        await r.say();
        await r.say();
        await r.say();
      },
    },
    'veranstaltung-erstellen': {
      as: 'verband',
      async run(r) {
        await r.go('/admin/event');
        await r.say();
        await r.click(r.button('Neue Veranstaltung erstellen'));
        await sleep(800);
        await r.say();
        await r.type(r.page.locator('form input:visible').first(), 'Delegiertentag 2027');
        await r.type(r.page.locator('form input:visible').nth(1), 'delegiertentag-2027');
        await r.say();
        await r.say();
        await r.say();
      },
    },
    'regeln-design': {
      as: 'verband',
      async run(r) {
        await r.go('/admin/event/edit/1');
        await r.say();
        await r.click(r.page.locator('.nav-link,button,a', { hasText: /^\s*Regeln\s*$/ }).first());
        await r.say();
        await r.say();
        await r.say();
        await r.click(r.page.locator('.nav-link,button,a', { hasText: /^\s*Design\s*$/ }).first());
        await r.say();
      },
    },
    'teilnehmer-anlegen': {
      as: 'verband',
      async run(r) {
        await r.go('/admin/event/member-room/1');
        await r.say();
        await r.click(r.button('Mehrere Benutzer erstellen'));
        await sleep(800);
        await r.say();
        const area = r.page.locator('textarea').first();
        await r.type(area, 'l.berg;Lena Berg;2');
        await r.page.keyboard.press('Enter');
        await r.page.keyboard.type('t.fischer;Tom Fischer;1', { delay: 28 });
        await r.say();
        await r.say();
        await r.say();
      },
    },
    'links-versenden': {
      as: 'verband',
      async run(r) {
        await r.go('/admin/event/edit/1');
        await r.say();
        await r.go('/admin/event/member-room/1');
        await r.click(r.row('m.mueller', 'Link kopieren'));
        await r.say();
        await r.move(r.button('CSV mit Login-Links exportieren'));
        await r.say();
        await r.say();
      },
    },
    'token-zugang': {
      as: 'verband',
      async run(r) {
        await r.go('/admin/event/member-room/1/event-user/multiple-new');
        await r.say();
        const token = r.page.locator('label', { hasText: /Tokenbasiert/ }).first();
        if (await token.count()) await r.click(token);
        await r.say();
        await r.type(r.page.locator('textarea').first(), 'maria.mueller@example.test;;3');
        await r.say();
      },
    },
    'warteraum-organisator': {
      as: 'verband',
      setup: async () => ({
        pages: [await participant('j.wagner', 'Jonas Wagner (Musikverein Tal)')],
      }),
      async run(r) {
        await r.go('/admin/event/lobby-room/1');
        await r.say();
        await r.say();
        await r.say();
        await r.click(r.row('j.wagner', 'Teilnehmer'));
        await sleep(600);
        await r.confirm().catch(() => {});
        await sleep(1200);
        await r.say();
      },
    },
    'teilnehmer-verwalten': {
      as: 'verband',
      async run(r) {
        await r.go('/admin/event/member-room/1');
        await r.say();
        await r.click(r.row('p.schmidt', 'Bearbeiten'));
        await sleep(800);
        const amount = r.page.locator('input[type=number]').first();
        await r.move(amount);
        await amount.fill('5');
        await r.say();
        await r.click(
          r.page.locator('button:has-text("Benutzer speichern"),button[type=submit]').first()
        );
        await sleep(1200);
        await r.go('/admin/event/member-room/1');
        await r.move(r.row('s.neumann', 'Besucher'));
        await r.say();
        await r.move(r.row('s.neumann', 'In den Warteraum'));
        await r.say();
      },
    },
    'stimmrecht-uebertragen': {
      as: 'verband',
      async run(r) {
        await r.go('/admin/event/member-room/1');
        await r.say();
        await r.click(r.row('p.schmidt', 'übertragen'));
        await sleep(600);
        await r.say();
        await r.type(r.page.locator('#targetUserSearch'), 'Maria');
        await sleep(500);
        await r.click(
          r.page.locator('.dropdown-menu.show .dropdown-item', { hasText: 'Maria' }).first()
        );
        await r.say();
        await r.move(r.page.locator('#voteAmountInput'));
        await r.page.locator('#voteAmountInput').fill('2');
        await sleep(600);
        await r.say();
        await r.click(r.page.locator('.modal.show .modal-footer button.btn-primary'));
        await sleep(1500);
      },
    },
    'abstimmung-erstellen': {
      as: 'verband',
      async run(r) {
        await r.go('/admin/event/polls/1');
        await r.say();
        await r.click(r.button('Neue Abstimmung erstellen'));
        await sleep(800);
        await r.say();
        await r.type(
          r.page.locator('form.mutate-poll input:not([type=radio]):not([type=checkbox])').first(),
          'Wahl von zwei Kassenprüfern'
        );
        await r.say();
        await r.click(r.page.locator('label[for="poll-answer-options-custom"]').first());
        await r.say();
        await r.type(r.page.locator('.card.card-body textarea').first(), 'Lena Berg');
        await r.page.keyboard.press('Enter');
        await r.page.keyboard.type('Tom Fischer', { delay: 28 });
        await r.page.keyboard.press('Tab');
        await r.page.locator('.card.card-body input[type=number]').first().fill('2');
        await r.say();
        await r.say();
      },
    },
    'abstimmung-durchfuehren': {
      as: 'verband',
      setup: async ({ token }) => {
        const pages = [await participant(...USER_A), await participant(...USER_C)];
        await createPoll(token, 'Soll der Jahresabschluss 2025 genehmigt werden?', false);
        return { pages };
      },
      async run(r, { pages }) {
        await r.go('/admin/event/polls/1');
        await r.say();
        await r.click(r.page.locator('button[title*="starten"]').first());
        await r.confirm();
        await sleep(2000);
        await r.say();
        const answer = pages[1].locator('#pollModal label', { hasText: 'Ja' }).first();
        await answer.click({ force: true });
        await pages[1].locator('#pollModal button[type=submit]').first().click();
        await sleep(1500);
        await r.say();
        await r.click(
          r.page.locator('button.btn-danger', { hasText: /schlie|beend|erzwing/i }).first()
        );
        await r.confirm().catch(() => {});
        await sleep(2000);
        await r.say();
      },
    },
    ergebnisse: {
      as: 'verband',
      setup: async ({ token }) => {
        const pages = [await participant(...USER_C)];
        const poll = await createPoll(token, 'Soll der Jahresabschluss 2025 genehmigt werden?');
        await sleep(2000);
        await pages[0]
          .locator('#pollModal label', { hasText: 'Ja' })
          .first()
          .click({ force: true });
        await pages[0].locator('#pollModal button[type=submit]').first().click();
        await sleep(1500);
        const id = sql(`select id from poll_result where poll_id=${poll.data.createPoll.id}`);
        await gql(token, `mutation{stopPoll(id:${id})}`);
        return { pages };
      },
      async run(r) {
        await r.go('/admin/event/poll-results/1');
        await r.say();
        await r.say();
        await r.say();
        await r.say();
      },
    },
    'briefwahl-organisator': {
      as: 'verband',
      async run(r) {
        await r.go('/admin/event/edit/2');
        await r.say();
        await r.go('/admin/event/member-room/2');
        await r.say();
        await r.go('/admin/event/polls/2');
        await r.say();
        await r.say();
        await r.say();
      },
    },
    videokonferenz: {
      as: 'verband',
      async run(r) {
        await r.go('/admin/video-conference');
        await r.say();
        await r.click(r.button('Neu anlegen'));
        await sleep(800);
        await r.say();
        await r.say();
        await r.say();
      },
    },
    'veranstaltung-loeschen': {
      as: 'verband',
      async run(r) {
        await r.go('/admin/event/poll-results/1');
        await r.say();
        await r.go('/admin/event/edit/1');
        await r.say();
        await r.go('/admin/event');
        await r.say();
      },
    },
    'organisatoren-verwalten': {
      as: 'admin',
      async run(r) {
        await r.go('/admin/organizers');
        await r.say();
        await r.say();
        await r.say();
      },
    },
    'veranstaltung-uebertragen': {
      as: 'admin',
      async run(r) {
        await r.go('/admin/organizers');
        await r.say();
        await r.click(
          r.page.locator('tr', { hasText: 'verband@example.test' }).locator('button,a').first()
        );
        await sleep(1200);
        await r.say();
        await r.click(
          r.page
            .locator('.modal.show button[title*="bertrag"],.modal.show button:has-text("bertrag")')
            .first()
        );
        await sleep(800);
        await r.say();
        await r.say();
      },
    },
    'inhalte-einstellungen': {
      as: 'admin',
      async run(r) {
        await r.go('/admin/all-event');
        await r.say();
        await r.go('/admin/static-content-editor');
        await r.say();
        await r.go('/admin/message-editor');
        await r.say();
        await r.go('/admin/static-content-editor');
        await r.say();
        await r.go('/admin/global-settings');
        await r.say();
      },
    },
  };
};
