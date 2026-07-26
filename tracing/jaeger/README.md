# Jaeger

All-in-one Jaeger instance for distributed tracing. Uses Badger as the local storage backend.

## Prerequisites

- Docker
- Docker Compose v2

## Setup

Start Jaeger:

```bash
docker compose up -d
```

Wait a few seconds for the container to initialize.

## Verification

Check the Jaeger UI:

```bash
curl -I http://localhost:16686
```

Open the UI in your browser:

```bash
open http://localhost:16686
```

Verify OTLP gRPC is listening:

```bash
# gRPC health is harder to curl; check the container logs instead
docker compose logs -f jaeger
```

## Usage

| Item | Value |
|------|-------|
| Jaeger UI | http://localhost:16686 |
| OTLP gRPC | `localhost:4317` |
| OTLP HTTP | `localhost:4318` |
| Volume | `jaeger_data` |

## Architecture Notes

- **Storage backend**: Badger (embedded, single-node). This is suitable for local development but is not designed for high throughput or long-term retention.
- **Persistence**: Data survives `docker compose down` because it lives in the `jaeger_data` volume. However, Badger is not guaranteed to be compatible across major Jaeger version upgrades. If you upgrade the image tag, you may need to wipe the volume.
- **Cross-reference**: The [**OTel Collector**](../otel-collector) sends traces to this Jaeger instance at `host.docker.internal:4317`. Make sure Jaeger is running before starting the collector if you want traces to appear immediately.

## Configuration

No `.env` file is required. `docker-compose.yml` sets:

- `COLLECTOR_OTLP_ENABLED=true` — enables the native OTLP receivers.

## Security Notes

> ⚠️ Jaeger all-in-one has **no built-in authentication**. Exposing `16686` or `4317/4318` to a public network allows anyone to read traces and submit new spans. **Keep this local-only, or place it behind a reverse proxy with TLS and basic auth before any public exposure.**

## Stop and Remove Data

```bash
docker compose down
```

Wipe the volume:

```bash
docker compose down -v
```
