# Grafana

Grafana 11.4.0 with an auto-provisioned Prometheus datasource. Use this dashboard to visualize metrics collected by the OTel Collector and stored in Prometheus.

## Prerequisites

- Docker
- Docker Compose v2
- **Prometheus** (from [`../metrics`](../metrics)) should be running so the datasource is reachable.

## Setup

Copy the example environment file and set a strong admin password:

```bash
cp .env.example .env
# Edit .env and replace CHANGEME with a strong password
docker compose up -d
```

## Verification

Check Grafana health:

```bash
curl http://localhost:3000/api/health
```

Open the UI in your browser:

```bash
open http://localhost:3000
```

Log in with the credentials from your `.env` file.

## Usage

| Item | Value |
|------|-------|
| URL | http://localhost:3000 |
| Default Datasource | Prometheus (`http://host.docker.internal:9090`) |
| Volume | `grafana_data` |
| Provisioning | `./provisioning/datasources/prometheus.yml` |

## Configuration

Environment variables (set in `.env`):

| Variable | Description |
|----------|-------------|
| `GRAFANA_ADMIN_USER` | Grafana admin username |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password |

The Prometheus datasource is pre-configured via provisioning and points to `host.docker.internal:9090`. If Prometheus is not running, the datasource will show as unavailable until it comes online.

## Security Notes

> ⚠️ The `.env.example` ships with `GRAFANA_ADMIN_PASSWORD=CHANGEME`. **Change this before exposing Grafana to any network.**
>
> The default Prometheus image has no built-in authentication. If you need to expose Grafana publicly, place it behind a reverse proxy (e.g., Nginx or Traefik) with TLS and basic auth.

## Stop and Remove Data

```bash
docker compose down
```

Wipe the volume:

```bash
docker compose down -v
```
