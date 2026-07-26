# MongoDB + MongoExpress

Docker Compose setup with MongoDB 7.0 and MongoExpress.

## Prerequisites

- Docker
- Docker Compose v2

## Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to customize usernames and passwords if needed.

Start the services:

```bash
docker compose up -d
```

Wait ~30 seconds for MongoDB to report `healthy`.

## Verification

Check service health:

```bash
docker compose ps
```

You should see `mongodb` with status `healthy` (after ~30s startup).

View logs:

```bash
# All services
docker compose logs -f

# Just MongoDB
docker compose logs -f mongodb
```

## Accessing Services

| Service | URL | Credentials |
|---------|-----|-------------|
| MongoDB | `mongodb://localhost:27017` | admin / `<set in .env>` |
| MongoExpress | http://localhost:8081 | admin / `<set in .env>` |

Connect with `mongosh`:

```bash
mongosh "mongodb://admin:<password>@localhost:27017"
```

> ⚠️ **Security Warning**: The provided `.env.example` enables basic auth for MongoExpress by default (`ME_CONFIG_BASICAUTH=true`). Only disable authentication (`ME_CONFIG_BASICAUTH=false`) for local development on a trusted machine. Never expose an unprotected MongoExpress instance to a network.

## Configuration

Environment variables (set in `.env`):

| Variable | Description |
|----------|-------------|
| `MONGO_ROOT_USER` | MongoDB root username |
| `MONGO_ROOT_PASSWORD` | MongoDB root password |
| `MONGO_DATABASE` | Default database name (`aiplatform`) |
| `ME_CONFIG_BASICAUTH` | Enable/disable MongoExpress basic auth (`true` by default) |
| `ME_CONFIG_BASICAUTH_USERNAME` | MongoExpress username |
| `ME_CONFIG_BASICAUTH_PASSWORD` | MongoExpress password |

**Note:** MongoDB binds to `127.0.0.1:27017`, which limits direct host connections to localhost. MongoExpress exposes `8081` on all interfaces.

## Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes (data wipe)
docker compose down -v

# Restart a specific service
docker compose restart mongodb

# Check service health
docker compose ps
```

## Troubleshooting

### Connection refused

Wait for MongoDB to finish initializing (~30s). Check health status:

```bash
docker compose ps
```

### Can't access MongoExpress

Ensure the service started after MongoDB became healthy:

```bash
docker compose logs mongoexpress
```

## Development

For local development, data is stored in a Docker volume:

```bash
docker volume ls | grep mongodb
```

To reset everything:

```bash
docker compose down -v
docker compose up -d
```

## Architecture Notes

- **Default database:** `aiplatform`
- **Binding:** MongoDB is bound to `127.0.0.1:27017` (localhost-only) as a safe default for local development.
- **Role in stack:** Primary document datastore used by other application services in this repo.
