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
./start_collectors.sh
```

What `start_collectors.sh` does:
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
./start_collectors.sh
```

**2. Environment variable**

```bash
LOGFIRE_TOKEN=your_token ./start_collectors.sh
```

**3. Export in shell**

```bash
export LOGFIRE_TOKEN=your_token
./start_collectors.sh
```

If `LOGFIRE_TOKEN` is not set, the collector starts without the Logfire exporter. Metrics and Jaeger tracing continue unaffected.

## How It Works

The collector is controlled by two files that work together:

| File | Role |
|------|------|
| `docker-compose.yml` | Defines the container, image, ports, and mounts the config |
| `otel-collector-config.yaml` | Defines the collector's internal routing (receivers → processors → exporters) |

### `docker-compose.yml` — The Container Runtime

```yaml
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.115.1
    container_name: otel-collector
    command: ["--config=/etc/otel-collector-config.yaml"]
    environment:
      - LOGFIRE_TOKEN=${LOGFIRE_TOKEN:-}
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml:ro
    ports:
      - "4319:4319"   # OTLP gRPC traces receiver
      - "4320:4320"   # OTLP HTTP metrics receiver
      - "8889:8889"   # Prometheus scrape endpoint
      - "13133:13133" # Health check
```

- **Image**: Uses the official `contrib` collector (includes extra exporters like Prometheus).
- **Config mount**: Your local `otel-collector-config.yaml` is mounted into the container at `/etc/otel-collector-config.yaml` as **read-only** (`:ro`).
- **Environment**: `LOGFIRE_TOKEN` is passed from your `.env` file (or empty string if unset).
- **Ports**: The collector listens on 4 ports — 2 for receiving data, 1 for Prometheus scraping, 1 for health checks.

### `otel-collector-config.yaml` — The Brain

This YAML defines the collector's internal plumbing using 5 top-level sections:

#### 1. Receivers — How data enters

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4319    # gRPC for traces
      http:
        endpoint: 0.0.0.0:4320      # HTTP for metrics
```

- **OTLP** (OpenTelemetry Protocol) is the standard way apps send telemetry.
- Your application sends traces to `localhost:4319` (gRPC) and metrics to `localhost:4320` (HTTP).

#### 2. Processors — What happens to data in transit

```yaml
processors:
  batch:
    timeout: 10s
```

- **Batches** incoming data into groups before sending.
- Reduces network overhead by collecting data for 10 seconds, then sending one payload instead of many tiny ones.

#### 3. Exporters — Where data goes

```yaml
exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"       # Prometheus pulls metrics from here
    resource_to_telemetry_conversion:
      enabled: true

  otlp/jaeger:
    endpoint: "host.docker.internal:4317"   # Sends traces to Jaeger
    tls:
      insecure: true

  otlphttp/logfire:
    endpoint: "https://logfire-us.pydantic.dev"  # Sends traces to Logfire cloud
    headers:
      Authorization: "${LOGFIRE_TOKEN}"
```

Three destinations:

| Exporter | Purpose | How it works |
|----------|---------|--------------|
| **prometheus** | Metrics storage | Opens a web server on `:8889` that Prometheus *scrapes* (pull model) |
| **otlp/jaeger** | Traces storage | Pushes traces to Jaeger at `host.docker.internal:4317` |
| **otlphttp/logfire** | Cloud traces | Pushes traces to Pydantic Logfire SaaS using your token |

#### 4. Extensions — Extra features

```yaml
extensions:
  health_check:
    endpoint: 0.0.0.0:13133
```

- A simple HTTP health endpoint you can `curl` to verify the collector is alive.

#### 5. Service — The pipeline definition (wiring it all together)

```yaml
service:
  extensions: [health_check]
  pipelines:
    metrics:
      receivers: [otlp]           # Metrics come in via OTLP (port 4320)
      processors: [batch]       # Get batched
      exporters: [prometheus]   # Go to Prometheus scrape endpoint (port 8889)
    traces:
      receivers: [otlp]                    # Traces come in via OTLP (port 4319)
      processors: [batch]                  # Get batched
      exporters: [otlp/jaeger, otlphttp/logfire]  # Go to BOTH Jaeger AND Logfire
```

This is the **routing table**:

```
METRICS FLOW:
App (OTLP HTTP :4320) → [receiver: otlp] → [processor: batch] → [exporter: prometheus :8889]

TRACES FLOW:
App (OTLP gRPC :4319) → [receiver: otlp] → [processor: batch] → [exporter: otlp/jaeger :4317]
                                                      ↓
                                              [exporter: logfire cloud]
```

### How They Connect

| `docker-compose.yml` | `otel-collector-config.yaml` | Relationship |
|----------------------|------------------------------|--------------|
| Mounts config as read-only | Gets loaded by `--config` flag | Compose provides the file; the collector reads it |
| Exposes port `4319` | Receiver listens on `0.0.0.0:4319` | External apps can reach the gRPC receiver |
| Exposes port `4320` | Receiver listens on `0.0.0.0:4320` | External apps can reach the HTTP receiver |
| Exposes port `8889` | Prometheus exporter on `0.0.0.0:8889` | Prometheus (from `../metrics`) scrapes this |
| Injects `LOGFIRE_TOKEN` | Exporter uses `${LOGFIRE_TOKEN}` | Env var from `.env` → container → config interpolation |

### A Concrete Example

Your app sends a trace span to `localhost:4319` (OTLP gRPC):

1. **Receiver** (`otlp` on `:4319`) accepts the span.
2. **Processor** (`batch`) holds it for up to 10s, collecting more spans.
3. **Exporters** push the batch to:
   - Jaeger at `host.docker.internal:4317` (local tracing UI)
   - Logfire at `https://logfire-us.pydantic.dev` (cloud dashboard, if token is set)

Meanwhile, your app sends metrics to `localhost:4320` (OTLP HTTP):

1. **Receiver** (`otlp` on `:4320`) accepts the metric.
2. **Processor** (`batch`) groups it with other metrics.
3. **Exporter** (`prometheus` on `:8889`) makes it available for Prometheus to scrape.

### Why This Architecture Matters

- **Single instrumentation point**: Your app only needs to know about the collector (one endpoint), not about Prometheus, Jaeger, and Logfire separately.
- **Fan-out**: One trace goes to multiple backends simultaneously — local (Jaeger) and cloud (Logfire) — with zero code changes.
- **Vendor independence**: If you stop using Logfire, just remove that exporter from the config. Your app code doesn't change at all.

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
