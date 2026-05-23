# Deployment Guide

This guide covers deploying Group Ride on a Scaleway instance using Docker Compose.

## Prerequisites

- A [Scaleway](https://www.scaleway.com) account
- A GitHub Personal Access Token with `read:packages` scope (to pull the private image from GHCR)
- Your bot configured — see [SETUP.md](SETUP.md)

---

## Step 1 — Create a Scaleway instance

A **DEV1-S** (2 vCPU, 2 GB RAM) is more than sufficient for this bot.

When creating the instance, select the **Docker** InstantApp image — Docker and Docker Compose are pre-installed and ready to use, no manual setup needed.

Once the instance is created, SSH in and verify:

```bash
ssh root@<YOUR_INSTANCE_IP>
docker --version
docker compose version
```

---

## Step 2 — Authenticate to GitHub Container Registry

The Docker image is hosted on GHCR (private). You need a GitHub Personal Access Token (PAT) to pull it.

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

## Updating to a new version

Each push to `main` builds and pushes a new `:latest` image to GHCR. To update the bot on the instance:

```bash
cd /opt/group-ride
docker compose pull
docker compose up -d
```

Zero-downtime: Compose will replace the container with the new image and restart it automatically.

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

## SQLite data

The database is stored in a named Docker volume (`group-ride_data`) and persists across container restarts and image updates. To back it up:

```bash
docker run --rm \
  -v group-ride_data:/data \
  -v $(pwd):/backup \
  busybox tar czf /backup/group-ride-backup-$(date +%Y%m%d).tar.gz /data
```

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
