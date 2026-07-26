# OTel Collector

OpenTelemetry Collector that receives metrics and traces from applications and fans them out to multiple backends.

```
Application (OTLP) → OTel Collector ──→ Prometheus (:8889)
                                     └──→ Jaeger (:4317)
                                     └──→ Logfire (cloud)
```

## Prerequisites

- Docker
- Docker Compose v2
- Optional: A [Logfire](https://logfire.pydantic.dev/) account and token if you want to export traces to the cloud.

## Quick Start

The easiest way to start is with the helper script:

```bash
./start.sh
```

What `start.sh` does:
1. Sources `.env` from the same directory (if it exists).
2. Checks whether `LOGFIRE_TOKEN` is set and prints a warning if missing.
3. Starts the collector via Docker Compose.

Or start directly with docker compose:

```bash
LOGFIRE_TOKEN=your_token docker compose up -d
```

## Verification

Check the collector health endpoint:

```bash
curl http://localhost:13133
```

Check that the container is running:

```bash
docker compose ps
```

## Configuration

### Logfire Token

The Logfire exporter requires an auth token. Set it one of three ways:

**1. `.env` file (recommended)**

Copy the example file and add your token:

```bash
cp .env.example .env
# Edit .env to set LOGFIRE_TOKEN=your_token
./start.sh
```

**2. Environment variable**

```bash
LOGFIRE_TOKEN=your_token ./start.sh
```

**3. Export in shell**

```bash
export LOGFIRE_TOKEN=your_token
./start.sh
```

If `LOGFIRE_TOKEN` is not set, the collector starts without the Logfire exporter. Metrics and Jaeger tracing continue unaffected.

### Collector Config

`otel-collector-config.yaml` defines:

- **Receivers**: OTLP gRPC (`:4319`), OTLP HTTP (`:4320`)
- **Exporters**:
  - Prometheus metrics endpoint (`:8889`)
  - Jaeger OTLP gRPC (`host.docker.internal:4317`)
  - Logfire OTLP HTTP (`https://logfire-us.pydantic.dev`)
- **Pipelines**: Metrics → Prometheus; Traces → Jaeger + Logfire

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 4319 | gRPC | Receive OTLP traces |
| 4320 | HTTP | Receive OTLP metrics |
| 13133 | HTTP | Health check |
| 8889 | HTTP | Prometheus scrape endpoint |

## Viewing Data

To actually view the data the collector receives, the following downstream services must be running (they are in separate directories of this repo):

- **Metrics**: Start [**Prometheus**](../metrics) and open `http://localhost:9090`.
- **Traces**: Start [**Jaeger**](../tracing/jaeger) and open `http://localhost:16686`.
- **Logs**: Start [**Elasticsearch + Kibana**](../logging/elasticsearch) (if your application sends logs via OTLP).
- **Cloud Traces**: Open the Logfire project URL printed in your application console.

## Security Notes

> ⚠️ **Insecure TLS**: The collector uses `tls.insecure: true` when sending traces to Jaeger. This is acceptable only for local development on a single machine. Remove or disable `insecure: true` in `otel-collector-config.yaml` for any networked or production deployment.
>
> ⚠️ **Logfire Token**: Keep your `LOGFIRE_TOKEN` secret. Never commit it to the repository. The `.env` file is blocked by `.gitignore`.

## Stop

```bash
docker compose down
```

## View Logs

```bash
docker compose logs -f
```
