#!/bin/bash

# Skript zum Abrufen und Überprüfen der vote_cycle Werte aus der DB
# Muss im API-Verzeichnis ausgeführt werden

# Farben für die Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Vote Cycle und Browser Instance Check ===${NC}"
echo "Datum/Zeit: $(date)"
echo ""

# Wechsle ins API-Verzeichnis
cd ../voting-service-api

# Verbindungsdaten aus der Konfiguration abrufen
DB_HOST=$(grep -A5 "production" database.json | grep -m1 "host" | sed -E 's/.*: "([^"]+)".*/\1/')
DB_USER=$(grep -A5 "production" database.json | grep -m1 "username" | sed -E 's/.*: "([^"]+)".*/\1/')
DB_NAME=$(grep -A5 "production" database.json | grep -m1 "database" | sed -E 's/.*: "([^"]+)".*/\1/')
DB_PORT=$(grep -A5 "production" database.json | grep -m1 "port" | sed -E 's/.*: "([^"]+)".*/\1/')

if [[ -z "$DB_HOST" || -z "$DB_USER" || -z "$DB_NAME" ]]; then
  echo -e "${RED}Fehler: Datenbank-Konfiguration konnte nicht gelesen werden${NC}"
  echo "Bitte sicherstellen, dass database.json im API-Verzeichnis existiert"
  exit 1
fi

echo -e "${BLUE}Datenbank-Verbindung:${NC}"
echo "Host: $DB_HOST"
echo "User: $DB_USER"
echo "Database: $DB_NAME"
echo "Port: $DB_PORT"
echo ""

# Neueste Abstimmung abrufen
echo -e "${BLUE}Neueste Abstimmung:${NC}"
mysql -h $DB_HOST -u $DB_USER -D $DB_NAME -e "
  SELECT 
    id, 
    title, 
    max_votes, 
    UNIX_TIMESTAMP(created_at) as created_at 
  FROM polls 
  ORDER BY id DESC 
  LIMIT 1" 2>/dev/null

if [ $? -ne 0 ]; then
  echo -e "${RED}Fehler bei der MySQL-Verbindung. Passwort erforderlich oder andere Verbindungsprobleme.${NC}"
  echo "Bitte führen Sie die Abfragen aus check-vote-counts.sql manuell aus."
  exit 1
fi

# Letzte Poll-ID
POLL_ID=$(mysql -h $DB_HOST -u $DB_USER -D $DB_NAME -s -N -e "SELECT MAX(id) FROM polls" 2>/dev/null)

echo -e "${BLUE}Abstimmungs-ID für die Analyse: ${POLL_ID}${NC}"
echo ""

# Anzahl der Browser-Instanzen und Stimmen
echo -e "${BLUE}Browser-Instanzen und deren Stimmenanzahl:${NC}"
mysql -h $DB_HOST -u $DB_USER -D $DB_NAME -e "
  SELECT 
    browser_instance_id, 
    COUNT(*) as vote_count,
    MAX(vote_cycle) as max_vote_cycle
  FROM poll_ballots_unprocessed
  WHERE processed = TRUE
  AND poll_id = $POLL_ID
  GROUP BY browser_instance_id
  ORDER BY vote_count DESC" 2>/dev/null

echo ""

# Vote Cycle-Details
echo -e "${BLUE}Vote Cycle-Details pro Browser-Instanz:${NC}"
mysql -h $DB_HOST -u $DB_USER -D $DB_NAME -e "
  SELECT 
    browser_instance_id,
    vote_cycle,
    COUNT(*) as votes_in_cycle
  FROM poll_ballots_unprocessed
  WHERE processed = TRUE
  AND poll_id = $POLL_ID
  GROUP BY browser_instance_id, vote_cycle
  ORDER BY browser_instance_id, vote_cycle" 2>/dev/null

echo ""

# Abstimmungsstatistik
echo -e "${BLUE}Abstimmungsstatistik:${NC}"
mysql -h $DB_HOST -u $DB_USER -D $DB_NAME -e "
  SELECT 
    COUNT(DISTINCT browser_instance_id) as unique_browser_instances,
    COUNT(id) as total_votes,
    MAX(vote_cycle) as max_vote_cycle,
    SUM(CASE WHEN vote_user_completed = 1 THEN 1 ELSE 0 END) as completed_users
  FROM poll_ballots_unprocessed
  WHERE processed = TRUE
  AND poll_id = $POLL_ID" 2>/dev/null

echo ""

# Abstimmungsergebnisse
echo -e "${BLUE}Abstimmungsergebnisse:${NC}"
mysql -h $DB_HOST -u $DB_USER -D $DB_NAME -e "
  SELECT 
    pr.id as result_id,
    ppa.text as answer_text,
    COUNT(pa.id) as vote_count
  FROM poll_results pr
  JOIN poll_answers pa ON pr.id = pa.poll_result_id
  JOIN poll_possible_answers ppa ON pa.poll_possible_answer_id = ppa.id
  WHERE pr.poll_id = $POLL_ID
  GROUP BY pr.id, ppa.text
  ORDER BY vote_count DESC" 2>/dev/null

echo ""
echo -e "${GREEN}Analyse abgeschlossen.${NC}"