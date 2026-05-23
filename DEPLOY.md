# Deployment Guide

This guide covers deploying Group Ride on a Scaleway instance using Docker Compose, with automatic deployments triggered by a git tag.

## Table of contents

- [Prerequisites](#prerequisites)
- [Step 1 — Create a Scaleway instance](#step-1--create-a-scaleway-instance)
- [Step 2 — Authenticate to GitHub Container Registry](#step-2--authenticate-to-github-container-registry)
- [Step 3 — Set up the deployment directory](#step-3--set-up-the-deployment-directory)
- [Step 4 — Start the bot](#step-4--start-the-bot)
- [Step 5 — Enable automatic deployments (CI/CD)](#step-5--enable-automatic-deployments-cicd)
- [Releasing a new version](#releasing-a-new-version)
- [Useful commands](#useful-commands)
- [SQLite data](#sqlite-data)
- [PostgreSQL data](#postgresql-data)

---

## Prerequisites

- A [Scaleway](https://www.scaleway.com) account
- A GitHub Personal Access Token with `read:packages` scope (to pull the image from GHCR)
- Your bot configured — see [SETUP.md](SETUP.md)

---

## Step 1 — Create a Scaleway instance

A **STARDUST1-S** (1 vCPU, 1 GB RAM, ~€1.80/month) is sufficient for this bot. A **DEV1-S** (2 vCPU, 2 GB RAM) gives more headroom if needed.

When creating the instance, select the **Docker** InstantApp image — Docker and Docker Compose are pre-installed and ready to use.

Once the instance is created, SSH in and verify:

```bash
ssh root@<YOUR_INSTANCE_IP>
docker --version
docker compose version
```

---

## Step 2 — Authenticate to GitHub Container Registry

The Docker image is hosted on GHCR. You need a GitHub Personal Access Token (PAT) to pull it.

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Generate a token with the **`read:packages`** scope
3. On the instance, log in:

```bash
echo "<YOUR_PAT>" | docker login ghcr.io -u <YOUR_GITHUB_USERNAME> --password-stdin
```

---

## Step 3 — Set up the deployment directory

```bash
mkdir -p /opt/group-ride && cd /opt/group-ride
```

Create the `.env` file:

```bash
cat > .env <<EOF
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_server_id
DISCORD_ANNOUNCEMENT_CHANNEL_ID=your_announcement_channel_id
DISCORD_FORUM_CHANNEL_ID=your_forum_channel_id
DATABASE_PATH=/app/data/group-ride.db
# DATABASE_URL=postgres://user:password@your-db-host:5432/group_ride
EOF
```

> Keep this file private — it contains your bot token.

Download the Compose file:

```bash
curl -fsSL https://raw.githubusercontent.com/Slashgear/group-ride/main/docker-compose.yml -o docker-compose.yml
```

---

## Step 4 — Start the bot

```bash
docker compose pull
docker compose up -d
```

Check that it is running:

```bash
docker compose ps
docker compose logs -f
```

You should see:

```
Group Ride bot is running
```

---

## Step 5 — Enable automatic deployments (CI/CD)

The release workflow (`tag → test → GitHub release → Docker image → deploy`) is already set up. The `deploy` job SSHes into your instance and runs `docker compose pull && docker compose up -d`. You just need to give it the credentials.

### 5a — Generate a dedicated SSH key pair

On your local machine (not the instance):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/group-ride-deploy -N ""
```

This creates two files:
- `~/.ssh/group-ride-deploy` — private key (goes to GitHub)
- `~/.ssh/group-ride-deploy.pub` — public key (goes to the instance)

### 5b — Authorise the key on the instance

```bash
ssh root@<YOUR_INSTANCE_IP> "echo '$(cat ~/.ssh/group-ride-deploy.pub)' >> ~/.ssh/authorized_keys"
```

### 5c — Add secrets to GitHub

Go to **GitHub → your repo → Settings → Secrets and variables → Actions** and add:

| Secret name | Value |
|---|---|
| `DEPLOY_HOST` | Your instance IP address |
| `DEPLOY_SSH_KEY` | Contents of `~/.ssh/group-ride-deploy` (the private key) |

### 5d — Configure the GitHub environment

The deploy job uses the `production` environment, which lets you add protection rules (e.g. manual approval before each deploy).

Go to **GitHub → Settings → Environments → production** and configure as needed. If you skip this, the job still runs — the environment is optional.

---

## Releasing a new version

Once everything is set up, releasing is a single command from your local machine:

```bash
# 1. Bump the version in package.json
#    e.g. change "version": "0.2.0" to "0.3.0"

# 2. Commit, then tag and push
bun run release
```

This triggers the full pipeline: **tests → GitHub release → Docker image → SSH deploy**.

---

## Useful commands

```bash
# View live logs
docker compose logs -f

# Stop the bot
docker compose down

# Restart
docker compose restart

# Open a shell in the running container
docker compose exec bot sh
```

---

## SQLite data

The database is stored in a named Docker volume (`group-ride_data`) and persists across container restarts and image updates. To back it up:

```bash
docker run --rm \
  -v group-ride_data:/data \
  -v $(pwd):/backup \
  busybox tar czf /backup/group-ride-backup-$(date +%Y%m%d).tar.gz /data
```

---

## PostgreSQL data

If you set `DATABASE_URL`, the bot connects to your PostgreSQL instance instead of SQLite — no volume needed. Run the migrations once before starting the bot:

```bash
for f in src/adapters/postgres/migrations/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

For backup, use your provider's snapshot feature or `pg_dump`:

```bash
pg_dump "$DATABASE_URL" > group-ride-backup-$(date +%Y%m%d).sql
```
