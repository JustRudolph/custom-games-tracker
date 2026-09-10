-- Register historical match participants that do not yet have player records.
-- Safe to run more than once. Names are matched case-insensitively after trimming.
INSERT INTO players (summoner_name)
SELECT MIN(TRIM(mp.player_name))
FROM match_players mp
JOIN match_teams mt ON mt.id = mp.match_team_id
JOIN matches m ON m.id = mt.match_id
WHERE TRIM(mp.player_name) <> ''
  AND m.status = 'complete'
GROUP BY LOWER(TRIM(mp.player_name))
ON DUPLICATE KEY UPDATE summoner_name = VALUES(summoner_name);

-- Link historical match rows to their corresponding player records.
UPDATE match_players mp
JOIN match_teams mt ON mt.id = mp.match_team_id
JOIN matches m ON m.id = mt.match_id AND m.status = 'complete'
JOIN players p ON p.normalized_name = LOWER(TRIM(mp.player_name))
SET mp.player_id = p.id
WHERE mp.player_id IS NULL;
