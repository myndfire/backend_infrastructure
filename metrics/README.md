# Metrics (Prometheus)

Prometheus 3.x for storing and querying time-series metrics. This directory is **Prometheus only** — the OpenTelemetry Collector that feeds metrics into Prometheus lives in [`../otel-collector`](../otel-collector).

## Prerequisites

- Docker
- Docker Compose v2
- **OTel Collector** (from [`../otel-collector`](../otel-collector)) should be running, because Prometheus scrapes the collector's metrics endpoint at `host.docker.internal:8889`.

## Setup

Start Prometheus:

```bash
docker compose up -d
```

## Verification

Check Prometheus health:

```bash
curl http://localhost:9090/-/healthy
```

Query the list of active targets:

```bash
curl 'http://localhost:9090/api/v1/query?query=up'
```

Open the Prometheus UI:

```bash
open http://localhost:9090
```

## Usage

| Item | Value |
|------|-------|
| UI | http://localhost:9090 |
| Scrapes | `host.docker.internal:8889` (OTel Collector) |
| Volume | `prometheus_data` |
| Config | `./prometheus.yml` |

## Configuration

Prometheus is configured via `prometheus.yml`:

- Scrape interval: `15s`
- Target: `host.docker.internal:8889` (OTel Collector Prometheus exporter)

If the OTel Collector is not running, the target will show as `DOWN` in the Prometheus UI until it comes online.

### Sending a Test Metric

A helper script is included to send a test OTLP metric directly to the collector:

```bash
# Ensure the OTel Collector is running first
cd ../otel-collector && docker compose up -d

# Send the test metric
cd ../metrics
./test-metric.sh
```

The script pushes `test_requests_total=42` to `localhost:4320` (the collector's HTTP metrics receiver). After a few seconds, you can query it in Prometheus:

```bash
curl 'http://localhost:9090/api/v1/query?query=test_requests_total'
```

## About `otel-collector-config.yaml` in This Directory

The file `otel-collector-config.yaml` here is a **reference copy** of the collector configuration used by the `../otel-collector` service. It is **not** consumed by the Prometheus compose file. Any changes to collector routing should be made in `../otel-collector/otel-collector-config.yaml`.

## Security Notes

> ⚠️ The default Prometheus image has **no built-in authentication**. Exposing port `9090` to a public network allows anyone to read all metrics and run arbitrary PromQL queries. **Keep this local-only, or place it behind a reverse proxy with TLS and basic auth before any public exposure.**

## Stop and Remove Data

```bash
docker compose down
```

Wipe the volume:

```bash
docker compose down -v
```
