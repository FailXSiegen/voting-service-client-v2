# GitLab CI/CD Variables für Voting Tool

Folgende Variablen müssen in GitLab unter **Settings → CI/CD → Variables** konfiguriert werden:

## Datenbank
- `VOTING_DB_USER` - Datenbank Benutzer
- `VOTING_DB_PASSWORD` - Datenbank Passwort (geschützt)
- `VOTING_DB_NAME` - Datenbank Name
- `VOTING_DB_ROOT_PASSWORD` - Root Passwort für MariaDB (geschützt)

## Sicherheit
- `VOTING_JWT_SECRET` - JWT Secret für Token-Generierung (geschützt)
- `VOTING_COOKIE_SIGN_SECRET` - Cookie Signatur Secret (geschützt)

## E-Mail (SMTP)
- `VOTING_EMAIL_HOST` - SMTP Server (z.B. `smtp.gmail.com`, `mail.failx.de`)
- `VOTING_EMAIL_PORT` - SMTP Port (z.B. `587` für TLS, `465` für SSL)
- `VOTING_EMAIL_USER` - SMTP Benutzername
- `VOTING_EMAIL_PASSWORD` - SMTP Passwort (geschützt)

## Wichtige Hinweise
- Alle Passwort-Variablen sollten als "Protected" und "Masked" markiert werden
- Die E-Mail-Variablen werden automatisch auf das `MAIL_` Prefix gemappt
- Standard-Absender ist `info@failx.de`