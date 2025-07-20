# voting-service-client v2

Der neue Webclient für die API von `digitalwahl.org - Einfach die Wahl haben`.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run Headed Component Tests with [Cypress Component Testing](https://on.cypress.io/component)

```sh
npm run test:unit:dev # or `npm run test:unit` for headless testing
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
npm run test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
npm run build
npm run test:e2e
```

## Lasttests

### Testdaten einrichten

Vor dem Ausführen der Lasttests müssen die Testdaten importiert werden:

```bash
cd ../voting-service-api && npm run setup-testdata
```

### Playwright installieren (einmalig)

```bash
npm install -D @playwright/test
npx playwright install
```

### Einfachen Lasttest ausführen (3 Benutzer)

```bash
npm run test:load:simple
```

### Vollständigen Lasttest ausführen (150 Benutzer)

```bash
npm run test:load
```

### Testdaten Login-Informationen

**Organisator:**
- Email: loadtest@example.org
- Passwort: TestPassword123!
- Event: loadtest-event

**Teilnehmer:**
- Benutzernamen: testuser1 bis testuser150
- Passwort für alle: test123

### Anpassung der Lasttests

Die Lasttests können in der Datei `tests/load-test.js` angepasst werden:

- Die Anzahl der Benutzer kann über die Konstante `CONFIG.USERS` geändert werden
- Die Batchgröße kann über `CONFIG.BATCH_SIZE` angepasst werden
- Server-URLs können bei Bedarf geändert werden

## Contributions

404 Image made by [Web illustrations by Storyset](https://storyset.com/web).
