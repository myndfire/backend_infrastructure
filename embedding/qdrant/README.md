# Qdrant

Qdrant vector database for storing and querying embeddings.

## Prerequisites

- Docker
- Docker Compose v2

## Setup

Start the service:

```bash
docker compose up -d
```

Wait a few seconds for the healthcheck to pass.

## Verification

Check the health endpoint:

```bash
curl http://localhost:6333/healthz
```

Expected output: `{"status":"ok"}`

Open the web dashboard:

```bash
open http://localhost:6333/dashboard
```

## Usage

| Item | Value |
|------|-------|
| REST API | http://localhost:6333 |
| gRPC API | localhost:6334 |
| Volume | `qdrant_data` |

Quick REST example — check cluster info:

```bash
curl http://localhost:6333/collections
```

## Configuration

No environment variables are required for local development. Qdrant runs with its default configuration. For advanced tuning (e.g., enabling API keys or changing storage paths), mount a custom `config.yaml` into the container.

## Security Notes

> ⚠️ **No authentication is enabled by default.** This is acceptable for local development on a trusted machine only.
>
> Before exposing Qdrant to any network:
> - Configure API keys via `config.yaml`.
> - Bind to `127.0.0.1` or place behind a reverse proxy with TLS.

## Stop and Remove Data

```bash
docker compose down
```

Wipe the volume:

```bash
docker compose down -v
```
