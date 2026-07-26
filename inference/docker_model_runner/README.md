# Docker Model Runner

Runs LLMs locally via Docker Desktop's Model Runner feature. This provides an OpenAI-compatible API endpoint on your machine without needing external inference services.

## Prerequisites

- **Docker Desktop** with the **Model Runner** feature enabled (experimental/beta feature in some Docker Desktop versions).
- Docker Compose v2
- [uv](https://docs.astral.sh/uv/) (for running the Python test script)

## Setup

Start the model runner service:

```bash
docker compose up -d
```

## Verification

List available models:

```bash
curl http://localhost:12434/engines/v1/models
```

You should see a JSON list of models that are ready to serve.

Check that the OpenAI-compatible endpoint is reachable:

```bash
curl http://localhost:12434/engines/v1/health
```

## Usage

The Model Runner exposes an OpenAI-compatible API at:

```
http://localhost:12434/engines/v1
```

Environment variables (set in `.env` or export directly):

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_NAME` | `ai/smollm2` | Model to load and serve |
| `BASE_URL` | `http://localhost:12434/engines/v1` | OpenAI-compatible base URL |
| `MODEL_RUNNER_API_KEY` | `ignored` | API key (Docker Model Runner does not require one) |

## Testing

Run the test script using `uv` (it will automatically fetch the required packages):

```bash
cp .env.example .env
# Edit .env if needed
uv run --with openai --with python-dotenv test.py
```

## Configuration

Set the model to run via the `MODEL_NAME` environment variable:

```bash
export MODEL_NAME=ai/smollm2
docker compose up -d
```

## Security Notes

> ⚠️ **The default compose file exposes the inference endpoint on the host network.** If you enable the commented-out `gateway-local` or `gateway-remote` blocks, note that they mount the host Docker socket (`/var/run/docker.sock`). This grants the container root-level access to the host. **Never enable those blocks in production or on shared infrastructure.**
>
> For any network-exposed deployment, bind the Model Runner to `127.0.0.1` and place a reverse proxy with authentication in front of it.

## Stop

```bash
docker compose down
```

## Data

Docker Model Runner stores model weights in Docker-managed volumes. There is no user-managed volume to reset in this compose file.
