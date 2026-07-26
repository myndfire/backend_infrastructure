# Open Web UI

A local chat interface for LLMs, powered by [Open WebUI](https://github.com/open-webui/open-webui). It connects to Ollama running on the host and provides a user-friendly web interface for chatting with local models.

## Prerequisites

- Docker
- Docker Compose v2
- **Ollama** running on the host at port `11434` (the compose file uses `OLLAMA_BASE_URL=http://host.docker.internal:11434`).

## Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to suit your needs (see Configuration below).

### Option A: Open WebUI Only

Start just the chat interface:

```bash
docker compose -f docker-compose.yaml up -d
```

### Option B: Open WebUI + Grafana LGTM Stack

Start the chat interface bundled with the Grafana LGTM (Loki-Grafana-Tempo-Mimir) stack for observability:

```bash
docker compose -f docker-compose-with-grafana.yaml up -d
```

## Verification

Check the WebUI:

```bash
curl -I http://localhost:8082
```

Open the UI in your browser:

```bash
open http://localhost:8082
```

If using the Grafana variant, check Grafana health:

```bash
curl http://localhost:3000/api/health
```

## Usage

| Variant | Service | URL | Notes |
|---------|---------|-----|-------|
| Both | Open WebUI | http://localhost:8082 | Chat interface |
| Grafana variant | Grafana | http://localhost:3000 | Metrics, logs, traces dashboard |
| Grafana variant | OTLP gRPC | `localhost:4317` | Receive OTLP traces/metrics |
| Grafana variant | OTLP HTTP | `localhost:4318` | Receive OTLP traces/metrics |

## Configuration

Environment variables (set in `.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBUI_AUTH` | `True` | Enable/disable WebUI authentication. `.env.example` defaults to `True` for safety. |
| `OTEL_EXPORTER_OTLP_INSECURE` | `false` | Use insecure (plaintext) OTLP. Set to `true` only for local development without TLS. |

The `docker-compose.yaml` disables auth for local convenience (`WEBUI_AUTH=False`). The `.env.example` overrides this to `True` so that if you copy it, you are secure by default.

## Security Notes

> ⚠️ **Authentication**: The plain `docker-compose.yaml` sets `WEBUI_AUTH=False` for local development. **Never expose this service to a network without enabling authentication.** Use the `.env.example` defaults (`WEBUI_AUTH=True`) or configure proper user management before any public deployment.
>
> ⚠️ **OTLP Insecurity**: The Grafana variant sets `OTEL_EXPORTER_OTLP_INSECURE=false` by default. Only override this to `true` for single-machine local development. All networked or production deployments must use TLS.

## Stop and Remove Data

```bash
docker compose down
```

Wipe volumes:

```bash
docker compose down -v
```
