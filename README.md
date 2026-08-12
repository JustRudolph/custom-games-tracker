# Diamond Dynasty Custom Games

A React and Express application for manually recording League of Legends custom games. Match, player, and administrator data is stored in MySQL.

## Requirements

- [Node.js 22 or newer](https://nodejs.org/)
- MySQL Server 8.0.16 or newer
- Git


## Start an existing installation

Use these steps when the database and `.env` file have already been configured.

1. Start the MySQL service.
2. Open PowerShell in the project folder.
3. Install dependencies if needed:

```powershell
npm.cmd install
```

4. Start the API and React development server:

```powershell
npm.cmd run dev:full
```

5. Open `http://localhost:5173` in a browser.

Keep the PowerShell window open while using the app. Press `Ctrl+C` to stop both servers.

## First-time setup

### 1. Install dependencies

```powershell
npm.cmd install
```

### 2. Create the database

Make sure MySQL Server is running, then import the schema:

```powershell
Get-Content -Raw .\db\schema.sql |
  & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" `
    -u root `
    -p `
    --default-character-set=utf8mb4
```

Enter the MySQL root password when prompted. This command is for a fresh database only. Do not rerun it over an existing `customs_ledger` database; use the migrations documented in [db/README.md](db/README.md) instead.

If MySQL is installed elsewhere, replace the path to `mysql.exe` with its actual location.

### 3. Configure local environment variables

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

Open `.env` and set the database credentials. A basic local configuration looks like this:

```dotenv
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=customs_ledger
DB_USER=root
DB_PASSWORD=your_mysql_password
CLIENT_ORIGIN=http://localhost:5173
DB_SSL=false
TRUST_PROXY=0
```

Do not commit `.env`; it contains credentials and is already excluded by `.gitignore`.

### 4. Create an administrator

Choose a password containing at least 12 characters, then run:

```powershell
$env:ADMIN_USERNAME = "owner"
$env:ADMIN_NAME = "Owner"
$env:ADMIN_ROLE = "owner"
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new(
  "",
  (Read-Host "Admin password" -AsSecureString)
).Password

npm.cmd run admin:create

Remove-Item Env:ADMIN_USERNAME, Env:ADMIN_NAME, Env:ADMIN_ROLE, Env:ADMIN_PASSWORD
```

The username may contain lowercase letters, numbers, dots, underscores, and hyphens.

### 5. Start the application

```powershell
npm.cmd run dev:full
```

The local services are:

- React app: `http://localhost:5173`
- Express API: `http://localhost:3001`

Vite automatically sends local `/api` requests to the Express server.

## Useful commands

```powershell
# Run only the React frontend
npm.cmd run dev

# Run only the Express API
npm.cmd run server

# Create a production frontend build
npm.cmd run build

# Preview the production frontend build locally
npm.cmd run preview
```

## Troubleshooting

### Database connection failed

- Confirm MySQL Server is running in Windows Services.
- Confirm `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in `.env` are correct.
- Confirm the `customs_ledger` database exists.
- Restart `npm.cmd run dev:full` after changing `.env`.

### PowerShell rejects the `<` operator

PowerShell does not support the Command Prompt-style MySQL redirection syntax. Use the `Get-Content ... | & mysql.exe` command shown above.

### A port is already in use

Close the older development-server terminal, or stop it with `Ctrl+C`, and then run `npm.cmd run dev:full` again.

## Deployment

Pushing the `main` branch triggers the GitHub Pages workflow for `https://ddcustoms.me`. The deployed frontend uses `https://api.ddcustoms.me/api`; the Express API and MySQL database are hosted separately on Railway.

```powershell
git add .
git commit -m "Describe the update"
git push origin main
```
