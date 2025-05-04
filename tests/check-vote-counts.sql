-- SQL-Abfragen zur Überprüfung der Stimmen und Browser-Instanzen

-- 1. Überprüfung der Browser-Instanzen und deren Stimmenanzahl
SELECT 
    browser_instance_id, 
    COUNT(*) as vote_count,
    MIN(created_at) as first_vote,
    MAX(created_at) as last_vote,
    MAX(vote_cycle) as max_vote_cycle
FROM poll_ballots_unprocessed
WHERE processed = TRUE
GROUP BY browser_instance_id
ORDER BY vote_count DESC;

-- 2. Detaillierte Überprüfung pro Browser-Instanz und Vote-Cycle
SELECT 
    browser_instance_id,
    vote_cycle,
    COUNT(*) as votes_in_cycle
FROM poll_ballots_unprocessed
WHERE processed = TRUE
GROUP BY browser_instance_id, vote_cycle
ORDER BY browser_instance_id, vote_cycle;

-- 3. Überprüfung der Vote-Cycles für die neueste Abstimmung
SELECT 
    p.id as poll_id,
    p.title as poll_title,
    COUNT(DISTINCT pbu.browser_instance_id) as unique_browser_instances,
    COUNT(pbu.id) as total_votes,
    MAX(pbu.vote_cycle) as max_vote_cycle
FROM polls p
LEFT JOIN poll_ballots_unprocessed pbu ON p.id = pbu.poll_id
WHERE p.id = (SELECT MAX(id) FROM polls) -- Die neueste Abstimmung
AND pbu.processed = TRUE
GROUP BY p.id, p.title;

-- 4. Überprüfung der unverarbeiteten Stimmen (sollten normalerweise 0 sein)
SELECT 
    poll_id,
    COUNT(*) as unprocessed_votes
FROM poll_ballots_unprocessed
WHERE processed = FALSE
GROUP BY poll_id
ORDER BY poll_id DESC;

-- 5. Prüfung der Abstimmungsergebnisse
SELECT 
    pr.poll_id,
    pr.possible_answer_id,
    ppa.text as answer_text,
    COUNT(pa.id) as vote_count
FROM poll_results pr
JOIN poll_answers pa ON pr.id = pa.poll_result_id
JOIN poll_possible_answers ppa ON pa.poll_possible_answer_id = ppa.id
WHERE pr.poll_id = (SELECT MAX(id) FROM polls) -- Die neueste Abstimmung
GROUP BY pr.poll_id, pr.possible_answer_id, ppa.text
ORDER BY vote_count DESC;

-- 6. Überprüfung der vote_user_completed Werte
SELECT 
    poll_id,
    browser_instance_id,
    MAX(vote_cycle) as max_vote_cycle,
    vote_user_completed
FROM poll_ballots_unprocessed
WHERE processed = TRUE
AND poll_id = (SELECT MAX(id) FROM polls) -- Die neueste Abstimmung
GROUP BY poll_id, browser_instance_id, vote_user_completed
ORDER BY poll_id, browser_instance_id;