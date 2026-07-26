# Docker MCP Gateway

A Docker-based gateway for the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). It proxies requests to multiple MCP servers defined in a catalog file.

## Prerequisites

- Docker
- Docker Compose v2
- A Docker engine that supports the experimental MCP gateway image (`docker/mcp-gateway`)

## Setup

Start the gateway:

```bash
docker compose up -d
```

## Verification

Check that the gateway container is running:

```bash
docker compose ps
```

List registered servers via the gateway (adjust path if your gateway exposes a different introspection endpoint):

```bash
curl http://localhost:8811/v1/servers
```

## Usage

| Item | Value |
|------|-------|
| Gateway URL | http://localhost:8811 |
| Catalog file | `./catalog.yaml` |

## Configuration

The gateway is configured via `catalog.yaml`, which defines the MCP servers to proxy. The current catalog registers three servers:

| Server | URL | Active in Compose |
|--------|-----|-------------------|
| `quote-server` | http://host.docker.internal:9000/mcp | ✅ Yes (`--servers=quote-server,duckduckgo`) |
| `duckduckgo` | http://duckduckgo:8080/mcp | ✅ Yes (`--servers=quote-server,duckduckgo`) |
| `huggingface` | https://huggingface.co/mcp | ❌ No (listed in catalog but not included in `--servers`) |

To activate `huggingface`, edit `docker-compose.yaml` and add it to the `--servers` flag:

```yaml
command:
  - --servers=quote-server,duckduckgo,huggingface
```

To register a new server, add an entry to `catalog.yaml` and update the `--servers` flag.

## Security Notes

> ⚠️ **Docker Socket Mount**: This compose file mounts the host Docker socket (`/var/run/docker.sock`). This grants the container full control over the host Docker daemon, effectively allowing root-level access to the host. **Only use this for local development. Never deploy this configuration in production or on shared infrastructure.**
>
> ⚠️ **External Proxying**: The gateway proxies HTTP to external URLs (e.g., HuggingFace) and internal services (e.g., `host.docker.internal:9000`). Ensure you trust every endpoint in `catalog.yaml` before enabling it. If any upstream server requires authentication tokens, store them in a `.env` file and inject them securely — never commit real credentials to `catalog.yaml`.

## Stop

```bash
docker compose down
```

## Data

There is no persistent volume for the gateway itself. The `catalog.yaml` is mounted read-only from the host.
