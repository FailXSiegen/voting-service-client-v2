-- Load Test Scenario SQL
-- Dieses Skript erstellt Testdaten für Lasttests des Voting Tools
-- ACHTUNG: Nur in Test-Umgebungen verwenden!

-- ===================================================================
-- 1. CLEANUP (Lösche alte Testdaten in korrekter Reihenfolge)
-- ===================================================================

-- Lösche abhängige Daten zuerst (wegen Foreign Key Constraints)
-- Verwende einfachere DELETE-Statements für bessere Kompatibilität

-- Finde alle Event-IDs für lasttest-2025
SET @cleanup_event_id = (SELECT id FROM event WHERE slug = 'lasttest-2025');

-- Lösche Poll-abhängige Daten wenn Event existiert
DELETE FROM poll_answer WHERE poll_result_id IN (
    SELECT pr.id FROM poll_result pr 
    WHERE pr.poll_id IN (SELECT id FROM poll WHERE event_id = @cleanup_event_id)
);

DELETE FROM poll_user_voted WHERE poll_result_id IN (
    SELECT pr.id FROM poll_result pr 
    WHERE pr.poll_id IN (SELECT id FROM poll WHERE event_id = @cleanup_event_id)
);

DELETE FROM poll_result WHERE poll_id IN (
    SELECT id FROM poll WHERE event_id = @cleanup_event_id
);

DELETE FROM poll_possible_answer WHERE poll_id IN (
    SELECT id FROM poll WHERE event_id = @cleanup_event_id
);

DELETE FROM poll_user WHERE poll_id IN (
    SELECT id FROM poll WHERE event_id = @cleanup_event_id
);

DELETE FROM poll WHERE event_id = @cleanup_event_id;

-- Lösche Event-User
DELETE FROM event_user WHERE event_id = @cleanup_event_id;

-- Lösche Events
DELETE FROM event WHERE slug = 'lasttest-2025';

-- Jetzt kann der Organizer sicher gelöscht werden
DELETE FROM organizer WHERE username = 'loadtest-admin';

-- ===================================================================
-- 2. ORGANIZER (Admin für manuelle Inspektion)
-- ===================================================================

-- Erstelle Test-Organizer (Password: TestAdmin123!)
INSERT INTO organizer (
    create_datetime,
    username,
    email,
    `password`,
    public_name,
    public_organisation,
    confirmed_email,
    super_admin,
    verified,
    `hash`
) VALUES (
    UNIX_TIMESTAMP(),
    'loadtest-admin',
    'admin@loadtest.example.com',
    '$2b$10$YourHashedPasswordHere', -- Muss mit bcrypt gehashed werden
    'Lasttest Administrator',
    'Test Organisation GmbH',
    1,
    0,
    1,
    MD5(CONCAT('loadtest-admin', UNIX_TIMESTAMP()))
);

SET @organizer_id = LAST_INSERT_ID();

-- ===================================================================
-- 3. EVENT
-- ===================================================================

-- Erstelle Test-Event
INSERT INTO `event` (
    organizer_id,
    create_datetime,
    modified_datetime,
    scheduled_datetime,
    title,
    lobby_open,
    active,
    deleted,
    description,
    slug,
    multivote_type,
    delete_datetime,
    delete_planned,
    styles,
    logo
) VALUES (
    @organizer_id,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP() + 86400, -- Morgen
    'Lasttest Event 2025',
    1, -- Lobby ist offen
    1, -- Event ist aktiv
    0,
    'Dies ist ein automatisch generiertes Event für Lasttests. Es enthält 200 Testnutzer mit verschiedenen Stimmberechtigungen.',
    'lasttest-2025',
    2, -- Multiple votes erlaubt
    0,
    0,
    '{}', -- Empty JSON for styles
    '' -- Empty string for logo
);

SET @event_id = LAST_INSERT_ID();

-- ===================================================================
-- 4. EVENT USERS (200 Testnutzer)
-- ===================================================================

-- Lösche existierende Testnutzer für dieses Event
DELETE FROM event_user WHERE event_id = @event_id;

-- Prozedur zum Erstellen von Testnutzern
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS CreateTestUsers()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE vote_amount INT;
    DECLARE allow_vote INT;
    
    -- 170 normale Stimmberechtigte (User 1-170)
    WHILE i <= 170 DO
        INSERT INTO event_user (
            event_id,
            create_datetime,
            username,
            email,
            password,
            public_name,
            allow_to_vote,
            vote_amount,
            online,
            coorganizer,
            verified
        ) VALUES (
            @event_id,
            UNIX_TIMESTAMP(),
            CONCAT('testuser', i),
            CONCAT('testuser', i, '@test.local'),
            '$2b$10$TestPasswordHash', -- Password: test123
            CONCAT('Testnutzer ', i),
            1, -- Stimmberechtigt
            1, -- Eine Stimme
            0,
            0,
            1
        );
        SET i = i + 1;
    END WHILE;
    
    -- 25 Mehrfach-Stimmberechtigte (User 171-195)
    WHILE i <= 195 DO
        -- Zufällige Stimmanzahl zwischen 3 und 5
        SET vote_amount = 3 + FLOOR(RAND() * 3);
        
        INSERT INTO event_user (
            event_id,
            create_datetime,
            username,
            email,
            password,
            public_name,
            allow_to_vote,
            vote_amount,
            online,
            coorganizer,
            verified
        ) VALUES (
            @event_id,
            UNIX_TIMESTAMP(),
            CONCAT('testuser', i),
            CONCAT('testuser', i, '@test.local'),
            '$2b$10$TestPasswordHash',
            CONCAT('Mehrfachstimmen-Nutzer ', i, ' (', vote_amount, ' Stimmen)'),
            1, -- Stimmberechtigt
            vote_amount, -- 3-5 Stimmen
            0,
            0,
            1
        );
        SET i = i + 1;
    END WHILE;
    
    -- 5 Nicht-Stimmberechtigte (User 196-200)
    WHILE i <= 200 DO
        INSERT INTO event_user (
            event_id,
            create_datetime,
            username,
            email,
            password,
            public_name,
            allow_to_vote,
            vote_amount,
            online,
            coorganizer,
            verified
        ) VALUES (
            @event_id,
            UNIX_TIMESTAMP(),
            CONCAT('testuser', i),
            CONCAT('testuser', i, '@test.local'),
            '$2b$10$TestPasswordHash',
            CONCAT('Beobachter ', i),
            0, -- NICHT stimmberechtigt
            0, -- Keine Stimmen
            0,
            0,
            1
        );
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

-- Führe die Prozedur aus
CALL CreateTestUsers();

-- ===================================================================
-- 5. POLLS (2 Abstimmungen)
-- ===================================================================

-- Abstimmung 1: Geheime Ja/Nein/Enthaltung Abstimmung
INSERT INTO poll (
    event_id,
    title,
    poll_answer,
    `type`,
    possible_answers,
    min_votes,
    max_votes,
    original_id
) VALUES (
    @event_id,
    'Geheime Abstimmung: Soll das neue Lasttest-Feature implementiert werden?',
    'Bitte stimmen Sie ab',
    1, -- Geheime Abstimmung
    1, -- Possible answers aktiviert
    1, -- Minimum 1 Stimme
    1, -- Maximum 1 Stimme
    NULL
);

SET @poll1_id = LAST_INSERT_ID();

-- Mögliche Antworten für Abstimmung 1
INSERT INTO poll_possible_answer (poll_id, title, `order`) VALUES
    (@poll1_id, 'Ja', 1),
    (@poll1_id, 'Nein', 2),
    (@poll1_id, 'Enthaltung', 3);

-- Abstimmung 2: Offene Multiple-Choice Abstimmung
INSERT INTO poll (
    event_id,
    title,
    poll_answer,
    `type`,
    possible_answers,
    min_votes,
    max_votes,
    original_id
) VALUES (
    @event_id,
    'Offene Abstimmung: Welche Features sollen priorisiert werden? (max. 3 Auswahlen)',
    'Wählen Sie bis zu 3 Features aus',
    2, -- Offene Abstimmung
    1, -- Possible answers aktiviert
    1, -- Minimum 1 Stimme
    3, -- Maximum 3 Stimmen
    NULL
);

SET @poll2_id = LAST_INSERT_ID();

-- Mögliche Antworten für Abstimmung 2
INSERT INTO poll_possible_answer (poll_id, title, `order`) VALUES
    (@poll2_id, 'Verbesserte Performance', 1),
    (@poll2_id, 'Neue UI/UX', 2),
    (@poll2_id, 'Mobile App', 3),
    (@poll2_id, 'Erweiterte Statistiken', 4),
    (@poll2_id, 'Integration mit externen Systemen', 5);

-- ===================================================================
-- 5. AUSGABE DER ERSTELLTEN TEST-IDs
-- ===================================================================

SELECT 
    'Test-Daten erfolgreich erstellt!' as Status,
    @organizer_id as 'Organizer ID',
    @event_id as 'Event ID',
    @poll1_id as 'Poll 1 ID (Geheim)',
    @poll2_id as 'Poll 2 ID (Offen)',
    (SELECT COUNT(*) FROM event_user WHERE event_id = @event_id) as 'Anzahl Testnutzer',
    (SELECT COUNT(*) FROM event_user WHERE event_id = @event_id AND allow_to_vote = 1) as 'Davon stimmberechtigt';

-- Cleanup Prozedur
DROP PROCEDURE IF EXISTS CreateTestUsers;