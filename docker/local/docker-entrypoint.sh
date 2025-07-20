#!/bin/sh
set -e

# Warte auf die Datenbank
echo "Warte auf Datenbank..."
until nc -z -v -w30 $DATABASE_HOST 3306; do
  echo "Warte auf Datenbank... ($DATABASE_HOST:3306)"
  sleep 2
done
echo "Datenbank ist bereit!"

# Führe Migration aus
echo "Führe Datenbankmigrationen aus..."
npm run db:migrate
echo "Migrationen erfolgreich ausgeführt!"

# Starte den eigentlichen Prozess (entweder API oder Consumer)
echo "Starte Hauptprozess..."
exec "$@"