# MySQL database

Run `schema.sql` against MySQL 8.0.16 or newer:

    mysql -u root -p < db/schema.sql

If the database was already created with an earlier version of this project, do not rerun `schema.sql`. Apply the migration instead:

    Get-Content -Raw .\db\migrations\001_role_ranks_and_player_snapshots.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4

If migration `001` stopped with a duplicate foreign-key-name error, run `002_complete_player_snapshot_migration.sql` next. Do not rerun `001`, because its earlier statements have already completed.

After migrations `001` and `002`, apply `003_rank_tier_values.sql`. It converts role ranks from free text to numeric tiers used by the team-balancer data model: Iron is `1` through Challenger at `10`.

The schema is independent from Riot services. A match stores its two teams, each team stores its players, and each player entry can record one of the five roles (Top, Jungle, Middle, Bottom, Support), champion, rank at the time of the match, and K/D/A. `players` and `champions` are reusable reference tables, while `admin_accounts` is ready for authenticated administration.

Do not store plaintext passwords. Create admin accounts with an Argon2id or bcrypt hash in `password_hash`, and enforce authentication in the API layer before exposing write operations.

Existing browser data is not automatically copied into MySQL yet. The next backend step is an authenticated API that maps the current local match shape to `matches`, `match_teams`, and `match_players`.

## Application API

Copy `.env.example` to `.env`, create the database with `schema.sql`, then run the API and Vite together with `npm.cmd run dev:full`. The React app now reads players and matches from the MySQL API instead of browser storage.

Player deletion is supported. Historical match rows preserve `player_name`, role, rank, champion, and K/D/A as a snapshot; deleting a player removes the roster profile but does not erase its match history.
