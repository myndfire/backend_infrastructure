# Elasticsearch + Kibana

Single-node Elasticsearch 7.17.16 with Kibana.

> ⚠️ **Security Warning**: Authentication is disabled (`xpack.security.enabled=false`) for local development convenience. **Do not expose these services to a network or deploy them publicly without enabling security.**

## Prerequisites

- Docker
- Docker Compose v2
- At least **~1 GB of free RAM** on the host (Elasticsearch JVM heap is set to `-Xms512m -Xmx512m`; the container needs additional overhead).

## Setup

Start the services:

```bash
docker compose up -d
```

Wait ~30–60 seconds for Elasticsearch to finish startup and for Kibana to connect.

## Verification

Check Elasticsearch:

```bash
curl http://localhost:9200
```

You should see a JSON response with cluster name, version, and tagline.

Check Kibana:

```bash
curl -I http://localhost:5601
```

Open Kibana in your browser:

```bash
open http://localhost:5601
```

## Access

| Service | URL |
|---------|-----|
| Elasticsearch | http://localhost:9200 |
| Kibana | http://localhost:5601 |

## Configuration

No `.env` file is required. Environment variables are set inline in `docker-compose.yml`:

- `xpack.security.enabled=false` — disables auth (local dev only).
- `xpack.monitoring.enabled=false` — disables monitoring plugin.
- `ES_JAVA_OPTS=-Xms512m -Xmx512m` — JVM heap size.

## Enabling Security for Production

To harden this stack for a networked or production environment:

1. Set `xpack.security.enabled=true` in both Elasticsearch and Kibana environment blocks.
2. Generate certificates and configure TLS between nodes and clients.
3. Set built-in user passwords using the Elasticsearch `setup-passwords` tool or the Elasticsearch keystore.

For full details, see the [Elasticsearch security documentation](https://www.elastic.co/guide/en/elasticsearch/reference/7.17/security-minimal-setup.html).

## Stop

```bash
docker compose down
```

## Stop and Remove Data

```bash
docker compose down -v
```

This removes the `elasticsearch_data` and `kibana_data` volumes.
