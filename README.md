# AI Backend Infrastructure

A modular, containerized local-development stack for AI/LLM applications. Every service runs in its own Docker Compose environment and can be started, stopped, and upgraded independently.

## Disclaimer

> **This repository provides local-development infrastructure configurations only.**  
> All services ship with authentication disabled or weakened by default for ease of use on a trusted, single-machine environment.  
> **The author assumes no responsibility for security incidents, data loss, or service outages arising from deploying these configurations in production, on shared infrastructure, or on publicly accessible networks.**  
> Review the Security Notes in each service's README and harden all settings before any non-local use.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Inference Layer                       │
│              Docker Model Runner (localhost:12434)            │
├─────────────────────────────────────────────────────────────┤
│                        Serving Layer                         │
│  Open Web UI (:8082)  │  Grafana (:3000)  │  MCP Gateway    │
│                       │  Prometheus (:9090)│  (:8811)       │
├─────────────────────────────────────────────────────────────┤
│                       Messaging & Caching                    │
│         RabbitMQ (:5672, :15672)  │  Redis (:6379)         │
├─────────────────────────────────────────────────────────────┤
│                      Data & Embedding                        │
│      MongoDB (:27017)  │  Qdrant (:6333, :6334)            │
├─────────────────────────────────────────────────────────────┤
│                    Observability Stack                       │
│  OTel Collector  →  Jaeger (:16686)  │  Elasticsearch       │
│                                    │  (:9200) + Kibana    │
│                                    │  (:5601)             │
└─────────────────────────────────────────────────────────────┘
```

## Directory Map

| Directory | Service | Primary Port | Purpose |
|-----------|---------|--------------|---------|
| `caching/redis` | Redis Cache | `6379` | In-memory caching with AOF persistence |
| `dashboards/grafana` | Grafana | `3000` | Metrics dashboards (auto-wired to Prometheus) |
| `datastore/mongodb` | MongoDB + MongoExpress | `27017`, `8081` | Primary document datastore |
| `embedding/qdrant` | Qdrant | `6333`, `6334` | Vector database for embeddings |
| `inference/docker_model_runner` | Docker Model Runner | `12434` | Local LLM inference endpoint |
| `logging/elasticsearch` | Elasticsearch + Kibana | `9200`, `5601` | Log aggregation and search |
| `mcp_gateways/docker_mcp_gateway` | MCP Gateway | `8811` | Proxy for MCP (Model Context Protocol) servers |
| `messaging/rabbitmq` | RabbitMQ | `5672`, `15672` | Robust message queue / pub-sub |
| `messaging/redis` | Redis | `6379` | Lightweight messaging / task broker |
| `metrics` | Prometheus | `9090` | Time-series metrics storage |
| `open-web-ui` | Open WebUI | `8082` | Chat interface for local LLMs |
| `otel-collector` | OTel Collector | `4319`, `4320` | Receives traces/metrics, fans out to backends |
| `tracing/jaeger` | Jaeger | `16686` | Distributed tracing UI and storage |

## Requirements

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose v2](https://docs.docker.com/compose/install/)
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (only if running Python test scripts)
- **Docker Desktop Model Runner** enabled (only for `inference/docker_model_runner`)
- **Ollama** running on the host (only for `open-web-ui`)

## Quick Start (Individual Services)

Every service directory contains its own `docker-compose.yml` (or `docker-compose.yaml`). To start any service:

```bash
cd <service-directory>
docker compose up -d
```

To stop:

```bash
docker compose down
```

If a directory contains a `.env.example`, copy it first:

```bash
cp .env.example .env
# Edit .env to set strong credentials
docker compose up -d
```

## Security Mantra

> **All services in this repository default to local-development mode.**
>
> Many services have authentication **disabled** or bind to `0.0.0.0` for convenience. **Review the Security Notes in each service's README before exposing anything to a network or deploying to production.**

Common hardening steps before going beyond localhost:
1. Replace all `CHANGEME` passwords in `.env` files.
2. Enable authentication where it is disabled by default (Open Web UI, MongoExpress, etc.).
3. Bind sensitive ports to `127.0.0.1` instead of `0.0.0.0`.
4. Enable TLS (`insecure: false`) on all OTLP/gRPC exporters.
5. Never mount the host Docker socket (`/var/run/docker.sock`) in production.

## Cross-Service Dependencies

Some services expect others to be running:

- **Grafana** (`dashboards/grafana`) expects **Prometheus** (`metrics`) on `host.docker.internal:9090`.
- **Prometheus** (`metrics`) expects the **OTel Collector** (`otel-collector`) metrics endpoint on `host.docker.internal:8889`.
- **OTel Collector** (`otel-collector`) sends traces to **Jaeger** (`tracing/jaeger`) on `host.docker.internal:4317`.
- **Open Web UI** (`open-web-ui`) expects **Ollama** on `host.docker.internal:11434`.

## License

See [LICENSE](./LICENSE).
