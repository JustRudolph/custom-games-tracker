# MySQL database

Run `schema.sql` against MySQL 8.0.16 or newer:

    mysql -u root -p < db/schema.sql

If the database was already created with an earlier version of this project, do not rerun `schema.sql`. Apply the migration instead:

    Get-Content -Raw .\db\migrations\001_role_ranks_and_player_snapshots.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4

If migration `001` stopped with a duplicate foreign-key-name error, run `002_complete_player_snapshot_migration.sql` next. Do not rerun `001`, because its earlier statements have already completed.

After migrations `001` and `002`, apply `003_rank_tier_values.sql`. It converts role ranks from free text to numeric tiers used by the team-balancer data model: Iron is `1` through Challenger at `10`.

Apply `004_admin_sessions.sql` to add server-side login sessions, then apply `005_admin_usernames.sql` to use usernames instead of email addresses. Existing accounts receive a temporary username based on their ID, such as `admin1`. Create new accounts by setting temporary `ADMIN_USERNAME`, `ADMIN_NAME`, and `ADMIN_PASSWORD` environment variables, then run `npm.cmd run admin:create`. Passwords must be at least 12 characters and are stored as scrypt hashes.

Apply `006_match_types.sql` to distinguish manually assembled customs from spin-the-wheel customs. Existing matches are marked as manual customs.

Apply `007_login_attempts.sql` before exposing the login route publicly. It stores bounded login lockout state in MySQL so lockouts survive server restarts and work across multiple app instances.

Apply `008_match_drafts.sql` to allow admins to save team rosters before entering champions, K/D/A, and the winning team. Drafts are excluded from public match history and player statistics until completed.

Apply `009_guest_match_submissions.sql` to add pending guest submissions. Pending matches remain private and do not affect statistics until an owner or admin approves them.

Apply `010_match_stats_images.sql` to allow guests to attach a PNG, JPG, or WebP screenshot of the custom stats to a submission.

PowerShell setup:

    Get-Content -Raw .\db\migrations\004_admin_sessions.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4
    Get-Content -Raw .\db\migrations\005_admin_usernames.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4
    Get-Content -Raw .\db\migrations\006_match_types.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4
    Get-Content -Raw .\db\migrations\007_login_attempts.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4
    Get-Content -Raw .\db\migrations\008_match_drafts.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4
    Get-Content -Raw .\db\migrations\009_guest_match_submissions.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4
    $env:ADMIN_USERNAME = "owner"
    $env:ADMIN_NAME = "Owner"
    $env:ADMIN_ROLE = "owner"
    $env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", (Read-Host "Admin password" -AsSecureString)).Password
    npm.cmd run admin:create
    Remove-Item Env:ADMIN_USERNAME, Env:ADMIN_NAME, Env:ADMIN_ROLE, Env:ADMIN_PASSWORD

The schema is independent from Riot services. A match stores its two teams, each team stores its players, and each player entry can record one of the five roles (Top, Jungle, Middle, Bottom, Support), champion, rank at the time of the match, and K/D/A. `players` and `champions` are reusable reference tables, while `admin_accounts` is ready for authenticated administration.

Do not store plaintext passwords. Create admin accounts with `npm.cmd run admin:create`; the server stores passwords as scrypt hashes and enforces authentication before exposing write operations.

Existing browser data is not automatically copied into MySQL yet. The next backend step is an authenticated API that maps the current local match shape to `matches`, `match_teams`, and `match_players`.

## Application API

Copy `.env.example` to `.env`, create the database with `schema.sql`, then run the API and Vite together with `npm.cmd run dev:full`. The React app now reads players and matches from the MySQL API instead of browser storage.

Player deletion is supported. Historical match rows preserve `player_name`, role, rank, champion, and K/D/A as a snapshot; deleting a player removes the roster profile but does not erase its match history.

## Production deployment

Build with `npm.cmd run build`, set `NODE_ENV=production`, and run `npm.cmd start`. In production, the API serves `dist` so the frontend and API share one origin. Set `CLIENT_ORIGIN` to that exact public HTTPS origin.

Use a dedicated MySQL user with only the required privileges. Keep MySQL on a private network. Railway private hosts ending in `.railway.internal` may use `DB_SSL=false`. Public database hosts require `DB_SSL=true`; provide the hosting provider's CA certificate through `DB_SSL_CA` when required.

Set `TRUST_PROXY` to the exact number of trusted reverse proxies between visitors and Node. Leave it at `0` when Node receives connections directly. Incorrect proxy settings make IP-based throttling unreliable.

The production server refuses to start with an HTTP `CLIENT_ORIGIN`, a placeholder database password, or an unencrypted remote database connection. HTTPS must be terminated by the hosting provider or reverse proxy before traffic reaches the app.
