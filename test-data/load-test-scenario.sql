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

-- Lösche JWT Refresh Tokens für den Organizer (verhindert Foreign Key Constraint)
DELETE FROM jwt_refresh_token WHERE organizer_id IN (
    SELECT id FROM organizer WHERE username = 'loadtest-admin'
);

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
    '$argon2i$v=19$m=4096,t=3,p=1$ppvQXML++YDjeEBZCp4g6A$3DMa7gxmtyw39OQ9lko2p1PrLPbmb7tVv2Kcl3dRU6U', -- Password: loadtest123
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
    UNIX_TIMESTAMP() - 3600, -- Vor 1 Stunde gestartet
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
DROP PROCEDURE IF EXISTS CreateTestUsers$$
CREATE PROCEDURE CreateTestUsers()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE vote_amount INT;
    DECLARE allow_vote INT;
    
    -- 30 Einzelstimmberechtigte (User 1-30) - für 1x Test
    WHILE i <= 30 DO
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
            '$argon2i$v=19$m=4096,t=3,p=1$VaBFkbaMX7B0+rYCuX+cYQ$Ff2PfK3CReoOPKZ+WSqdgKrYCPmrRlM/4U7xSot1CvU', -- Password: test123
            CONCAT('single User ', i, ' (1 votes)'),
            1, -- Stimmberechtigt
            1, -- Eine Stimme
            0,
            0,
            1
        );
        SET i = i + 1;
    END WHILE;
    
    -- 15 Dreifachstimmberechtigte (User 31-45) - für 3x Test
    WHILE i <= 45 DO
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
            '$argon2i$v=19$m=4096,t=3,p=1$VaBFkbaMX7B0+rYCuX+cYQ$Ff2PfK3CReoOPKZ+WSqdgKrYCPmrRlM/4U7xSot1CvU',
            CONCAT('triple User ', i, ' (3 votes)'),
            1, -- Stimmberechtigt
            3, -- Drei Stimmen
            0,
            0,
            1
        );
        SET i = i + 1;
    END WHILE;
    
    -- 5 Fünffachstimmberechtigte (User 46-50) - für 5x Test
    WHILE i <= 50 DO
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
            '$argon2i$v=19$m=4096,t=3,p=1$VaBFkbaMX7B0+rYCuX+cYQ$Ff2PfK3CReoOPKZ+WSqdgKrYCPmrRlM/4U7xSot1CvU',
            CONCAT('five User ', i, ' (5 votes)'),
            1, -- Stimmberechtigt
            5, -- Fünf Stimmen
            0,
            0,
            1
        );
        SET i = i + 1;
    END WHILE;
    
    -- 5 Nicht-Stimmberechtigte (User 51-55)
    WHILE i <= 55 DO
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
            '$argon2i$v=19$m=4096,t=3,p=1$VaBFkbaMX7B0+rYCuX+cYQ$Ff2PfK3CReoOPKZ+WSqdgKrYCPmrRlM/4U7xSot1CvU',
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
    create_datetime,
    title,
    poll_answer,
    list,
    `type`,
    repeated,
    min_votes,
    max_votes,
    allow_abstain,
    original_id
) VALUES (
    @event_id,
    UNIX_TIMESTAMP(),
    'Geheime Abstimmung: Soll das neue Lasttest-Feature implementiert werden?',
    'Bitte stimmen Sie ab',
    '', -- Empty list
    1, -- Geheime Abstimmung
    0, -- Nicht wiederholbar
    1, -- Minimum 1 Stimme
    1, -- Maximum 1 Stimme
    1, -- Enthaltung erlaubt
    NULL
);

SET @poll1_id = LAST_INSERT_ID();

-- Mögliche Antworten für Abstimmung 1
INSERT INTO poll_possible_answer (poll_id, create_datetime, content) VALUES
    (@poll1_id, UNIX_TIMESTAMP(), 'Ja'),
    (@poll1_id, UNIX_TIMESTAMP(), 'Nein'),
    (@poll1_id, UNIX_TIMESTAMP(), 'Enthaltung');

-- Abstimmung 2: Offene Multiple-Choice Abstimmung
INSERT INTO poll (
    event_id,
    create_datetime,
    title,
    poll_answer,
    list,
    `type`,
    repeated,
    min_votes,
    max_votes,
    allow_abstain,
    original_id
) VALUES (
    @event_id,
    UNIX_TIMESTAMP(),
    'Offene Abstimmung: Welche Features sollen priorisiert werden? (max. 3 Auswahlen)',
    'Wählen Sie bis zu 3 Features aus',
    '', -- Empty list
    2, -- Offene Abstimmung
    0, -- Nicht wiederholbar
    1, -- Minimum 1 Stimme
    3, -- Maximum 3 Stimmen
    0, -- Keine Enthaltung
    NULL
);

SET @poll2_id = LAST_INSERT_ID();

-- Mögliche Antworten für Abstimmung 2
INSERT INTO poll_possible_answer (poll_id, create_datetime, content) VALUES
    (@poll2_id, UNIX_TIMESTAMP(), 'Verbesserte Performance'),
    (@poll2_id, UNIX_TIMESTAMP(), 'Neue UI/UX'),
    (@poll2_id, UNIX_TIMESTAMP(), 'Mobile App'),
    (@poll2_id, UNIX_TIMESTAMP(), 'Erweiterte Statistiken'),
    (@poll2_id, UNIX_TIMESTAMP(), 'Integration mit externen Systemen');

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