#!/bin/bash

# Farben für die Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Database Check für Browser-Instanzen und Vote-Cycles ===${NC}"
echo "Datum/Zeit: $(date)"
echo ""

# Docker-Container für die Datenbank identifizieren
DB_CONTAINER=$(docker ps | grep mysql | grep -v pause | awk '{print $1}')

if [ -z "$DB_CONTAINER" ]; then
  echo -e "${RED}Fehler: Kein MySQL-Container gefunden${NC}"
  echo "Bitte stellen Sie sicher, dass der Docker-Container läuft."
  
  # Versuche, alle Container anzuzeigen
  echo -e "${YELLOW}Verfügbare Container:${NC}"
  docker ps
  exit 1
fi

echo -e "${GREEN}Gefundener MySQL-Container: ${DB_CONTAINER}${NC}"

# Datenbank-Parameter ermitteln (aus Umgebungsvariablen des Containers)
DB_NAME=$(docker exec $DB_CONTAINER bash -c 'echo $MYSQL_DATABASE')
DB_USER=$(docker exec $DB_CONTAINER bash -c 'echo $MYSQL_USER')
DB_ROOT_PASSWORD=$(docker exec $DB_CONTAINER bash -c 'echo $MYSQL_ROOT_PASSWORD')

if [ -z "$DB_NAME" ]; then
  echo -e "${YELLOW}Konnte Datenbanknamen nicht aus Container-Umgebungsvariablen ermitteln.${NC}"
  DB_NAME="voting_app_db" # Fallback-Wert
fi

echo -e "${BLUE}Datenbank-Informationen:${NC}"
echo "Container: $DB_CONTAINER"
echo "DB Name: $DB_NAME"
echo "DB User: $DB_USER"
echo ""

# Neueste Abstimmung abrufen
echo -e "${BLUE}Neueste Abstimmung:${NC}"
docker exec -i $DB_CONTAINER mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME << EOF
  SELECT 
    id, 
    title, 
    max_votes,
    created_at
  FROM polls 
  ORDER BY id DESC 
  LIMIT 1;
EOF

# Poll-ID der letzten Abstimmung auslesen
POLL_ID=$(docker exec -i $DB_CONTAINER mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME -s -N -e "SELECT MAX(id) FROM polls;")

echo -e "${BLUE}Abstimmungs-ID für die Analyse: ${POLL_ID}${NC}"
echo ""

# Browser-Instanzen und Stimmenanzahl
echo -e "${BLUE}Browser-Instanzen und deren Stimmenanzahl:${NC}"
docker exec -i $DB_CONTAINER mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME << EOF
  SELECT 
    browser_instance_id, 
    COUNT(*) as vote_count,
    MAX(vote_cycle) as max_vote_cycle
  FROM poll_ballots_unprocessed
  WHERE processed = TRUE
  AND poll_id = $POLL_ID
  GROUP BY browser_instance_id
  ORDER BY vote_count DESC;
EOF

echo ""

# Vote Cycle-Details
echo -e "${BLUE}Vote Cycle-Details pro Browser-Instanz:${NC}"
docker exec -i $DB_CONTAINER mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME << EOF
  SELECT 
    browser_instance_id,
    vote_cycle,
    COUNT(*) as votes_in_cycle
  FROM poll_ballots_unprocessed
  WHERE processed = TRUE
  AND poll_id = $POLL_ID
  GROUP BY browser_instance_id, vote_cycle
  ORDER BY browser_instance_id, vote_cycle;
EOF

echo ""

# Abstimmungsstatistik
echo -e "${BLUE}Abstimmungsstatistik:${NC}"
docker exec -i $DB_CONTAINER mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME << EOF
  SELECT 
    COUNT(DISTINCT browser_instance_id) as unique_browser_instances,
    COUNT(id) as total_votes,
    MAX(vote_cycle) as max_vote_cycle,
    SUM(CASE WHEN vote_user_completed = 1 THEN 1 ELSE 0 END) as completed_users
  FROM poll_ballots_unprocessed
  WHERE processed = TRUE
  AND poll_id = $POLL_ID;
EOF

echo ""

# Abstimmungsergebnisse
echo -e "${BLUE}Abstimmungsergebnisse:${NC}"
docker exec -i $DB_CONTAINER mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME << EOF
  SELECT 
    pr.id as result_id,
    ppa.text as answer_text,
    COUNT(pa.id) as vote_count
  FROM poll_results pr
  JOIN poll_answers pa ON pr.id = pa.poll_result_id
  JOIN poll_possible_answers ppa ON pa.poll_possible_answer_id = ppa.id
  WHERE pr.poll_id = $POLL_ID
  GROUP BY pr.id, ppa.text
  ORDER BY vote_count DESC;
EOF

echo ""
echo -e "${GREEN}Analyse abgeschlossen.${NC}"