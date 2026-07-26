# Redis Cache

Redis 7 (Alpine) configured for caching with AOF (Append-Only File) persistence.

## Prerequisites

- Docker
- Docker Compose v2

## Setup

Start the service:

```bash
docker compose up -d
```

Wait ~5 seconds for the healthcheck to pass.

## Verification

Check service status:

```bash
docker compose ps
```

Ping Redis:

```bash
redis-cli ping
```

Expected output:

```
PONG
```

View logs:

```bash
docker compose logs -f redis
```

## Usage

| Item | Value |
|------|-------|
| Host | `localhost` |
| Port | `6379` |
| Persistence | AOF (`appendonly yes`) |
| Volume | `redis_cache_data` |

Connect with `redis-cli`:

```bash
redis-cli -p 6379
```

## Configuration

No environment variables are required. Edit `docker-compose.yml` directly if you need to change the command flags (e.g., add `requirepass` or change maxmemory policy).

## Security Notes

> ⚠️ **No authentication is enabled by default**, and the port is bound to `0.0.0.0:6379`. This is acceptable for local development on a trusted machine only.
>
> Before exposing Redis to any network:
> - Set `requirepass` or enable Redis ACLs.
> - Bind to `127.0.0.1` instead of `0.0.0.0`.
> - Consider using a TLS tunnel for remote access.

## Stop and Remove Data

Stop the container:

```bash
docker compose down
```

Stop and wipe the volume:

```bash
docker compose down -v
```
