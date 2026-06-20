---
title: Installation
description: Step-by-step guide to set up group-ride on Discord or Telegram
---

group-ride supports **Discord** (default) and **Telegram**, configured via the `ADAPTER` environment variable.

Choose your platform to get started:

- [Install on Discord](/docs/installation/discord/)
- [Install on Telegram](/docs/installation/telegram/)

---

## Docker Compose (recommended for production)

```yaml
services:
  bot:
    image: ghcr.io/slashgear/group-ride:latest
    restart: unless-stopped
    env_file: .env
    volumes:
      - data:/usr/src/app/data

volumes:
  data:
```

```bash
docker compose up -d
docker compose logs -f bot
```

See [Configuration](/docs/configuration/) for all available environment variables.