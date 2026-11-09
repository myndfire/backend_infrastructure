# Observability Stack — Langfuse + Elasticsearch/Kibana + OpenObserve

A single `docker compose` bundle that receives telemetry over OTLP and fans it
out to three backends:

```
 your app / OTLP client
          │  OTLP gRPC :4317  or  OTLP/HTTP :4318
          ▼
   otel-collector
          ├──> Langfuse          traces            → http://localhost:3000
          ├──> Elasticsearch     logs + metrics + traces → Kibana :5601
          └──> OpenObserve       logs + metrics + traces → :5080
```

Everything runs locally in 13 containers. Langfuse is the trace backend;
Elasticsearch/Kibana and OpenObserve mirror the same signals so you can query
them independently.

> **Dev-mode defaults everywhere.** Credentials are intentionally simple and
> several ports bind broadly. Read [Security](#12-security) before exposing this
> beyond localhost.

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| Docker Engine / Docker Desktop | Must be **running** before `docker compose up` |
| Docker Compose v2 | `docker compose version` |
| RAM | ~8 GB free; Elasticsearch alone reserves a 512 MB heap |
| Free host ports | See [§4](#4-services-and-ports) — several collide with other directories in this repo |

Two files must exist next to `docker-compose.yml` or startup will fail:

- `.env` — all `${...}` interpolation
- `otel-collector-config.yaml` — bind-mounted read-only into the collector

---

## 2. Quick start

```bash
cd observability/langfuse

# .env.example ships working dev values
cp .env.example .env

docker compose up -d
```

First start pulls roughly **12 GB** of images (Kibana and Elasticsearch alone
are ~4.5 GB) and takes a few minutes on a cold cache. Wait for `langfuse-web`
to report `(healthy)`:

```bash
docker compose ps
```

Then open <http://localhost:3000> and log in with `admin@example.com` /
`Admin1234!`.

Stop without losing data:

```bash
docker compose down
```

---

## 3. Architecture notes

- **Langfuse v4 `events_only`** (`langfuse/langfuse:4.30.0`). Traces are stored
  in ClickHouse (`events_core` / `events_full`) and event payloads in MinIO.
  Some v4 public-API endpoints deliberately return
  `not available on deployments running in Langfuse v4 events_only mode` —
  that is expected, not a fault.
- **The collector is the only ingress.** Nothing talks to a backend directly;
  all three pipelines start at the `otlp` receiver.
- **Startup ordering is enforced by healthchecks.** `langfuse-web`,
  `langfuse-worker` and `otel-collector` wait on their dependencies, so a
  `docker compose up -d` that returns is not yet "ready" — re-run
  `docker compose ps`.

---

## 4. Services and ports

| Service | Container | Host port(s) | Role |
|---|---|---|---|
| `langfuse-web` | `langfuse-web` | `3000` | Langfuse UI + API |
| `langfuse-worker` | `langfuse-worker` | — | Background ingestion jobs |
| `otel-collector` | `otel-collector` | `4317` gRPC, `4318` HTTP | Single OTLP entry point, fans out |
| `elasticsearch` | `langfuse-elastic` | `9200` | Logs/metrics/traces, no auth |
| `kibana` | `langfuse-kibana` | `5601` | Log browser, no login |
| `openobserve` | `openobserve` | `5080` HTTP, `5081` gRPC | Unified logs/metrics/traces UI |
| `minio` | `langfuse-minio` | `9000` | S3 API (no web console, see §11) |
| `mongodb` | `mongodb` | `127.0.0.1:27017` | Optional document store |
| `mongoexpress` | `mongoexpress` | `127.0.0.1:8081` | Mongo UI (basic auth) |
| `redis-cache` | `redis-cache` | `127.0.0.1:6379` | Standalone cache with AOF |
| `postgres` | `langfuse-postgres` | internal | Langfuse transactional data |
| `clickhouse` | `langfuse-clickhouse` | internal | Langfuse analytics |
| `redis` | `langfuse-redis` | internal | Langfuse cache + job queue |

**Port collisions with other directories in this repo:** `3000` (Grafana),
`6379` (Redis), `8081` (MongoExpress), `9200`/`5601` (Elasticsearch/Kibana),
`27017` (MongoDB). Don't run this bundle alongside those services unless you
remap the host-side ports.

---

## 5. Environment variables

`docker-compose.yml` interpolates exactly these 22 variables. They live in
`.env` (gitignored); `.env.example` is the copy-and-go template.

### Required — no functional defaults

| Variable | Purpose | Example |
|---|---|---|
| `NEXTAUTH_SECRET` | Langfuse session signing | `openssl rand -base64 32` |
| `SALT` | Langfuse hashing salt | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Langfuse secret encryption — **must be 64 hex chars** | `openssl rand -hex 32` |
| `LANGFUSE_INIT_ORG_ID` | Seeded organisation id | `local-org` |
| `LANGFUSE_INIT_ORG_NAME` | Seeded organisation name | `Local Org` |
| `LANGFUSE_INIT_PROJECT_ID` | Seeded project id | `local-project` |
| `LANGFUSE_INIT_PROJECT_NAME` | Seeded project name | `Local Project` |
| `LANGFUSE_INIT_PROJECT_PUBLIC_KEY` | Project public key | `pk-lf-local` |
| `LANGFUSE_INIT_PROJECT_SECRET_KEY` | Project secret key | `sk-lf-local` |
| `LANGFUSE_INIT_USER_EMAIL` | Seeded login | `admin@example.com` |
| `LANGFUSE_INIT_USER_NAME` | Seeded display name | `admin` |
| `LANGFUSE_INIT_USER_PASSWORD` | Seeded password | `Admin1234!` |
| `LANGFUSE_HOST` | Collector → Langfuse, **in-network URL** | `http://langfuse-web:3000` |
| `LANGFUSE_AUTH` | `base64("<public_key>:<secret_key>")` | `Y2stbGY...` |
| `OPENOBSERVE_AUTH` | `base64("<email>:<password>")` | `YWRtaW4...` |

### Optional — defaults in the compose file

| Variable | Default | Purpose |
|---|---|---|
| `AUTH_SESSION_MAX_AGE` | `525600` | Session lifetime in minutes (~1 year) |
| `ZO_ROOT_USER_EMAIL` | `admin@example.com` | OpenObserve login |
| `ZO_ROOT_USER_PASSWORD` | `Admin1234!` | OpenObserve password |
| `OPENOBSERVE_ENDPOINT` | `http://openobserve:5080/api/default` | Collector export target (no trailing slash) |
| `MONGO_ROOT_USER` | `admin` | MongoDB root user |
| `MONGO_ROOT_PASSWORD` | `Admin1234!` | MongoDB root password |
| `ME_CONFIG_BASICAUTH` | `true` | Basic auth on MongoExpress |

### Credentials hardcoded in `docker-compose.yml` (not in `.env`)

| Service | Credentials |
|---|---|
| PostgreSQL | `postgres` / `postgres`, db `postgres` |
| ClickHouse | `clickhouse` / `clickhouse` |
| MinIO | `minioadmin` / `minioadmin`, bucket `langfuse` |
| Redis (Langfuse) | no password |
| Elasticsearch / Kibana | security disabled |

Change these in the compose file if the stack leaves localhost.

### Regenerating values

```bash
openssl rand -hex 32                                  # ENCRYPTION_KEY
openssl rand -base64 32                               # NEXTAUTH_SECRET, SALT
echo -n 'pk-lf-local:sk-lf-local' | base64            # LANGFUSE_AUTH
echo -n 'admin@example.com:Admin1234!' | base64       # OPENOBSERVE_AUTH
```

`LANGFUSE_AUTH` and `OPENOBSERVE_AUTH` must **exactly** match the keys and
password above, otherwise the collector's exports are rejected with 401 and
telemetry silently stops.

> `LANGFUSE_INIT_*` is applied only on **first boot**. To change the seeded
> org, project, user or password afterwards, delete the Langfuse volumes
> (`docker compose down -v`) and start over.

---

## 6. The collector config

`otel-collector-config.yaml` is mounted read-only at
`/etc/otel-collector-config.yaml`.

| Part | Detail |
|---|---|
| Receivers | `otlp` on `0.0.0.0:4317` (gRPC) and `0.0.0.0:4318` (HTTP) |
| `filter/drop_noise` (logs) | Drops `DEBUG` records, bodies ending in `_started`, and bodies equal to `retry_wait` |
| `batch` | Batches every signal before export |
| `otlp_http/langfuse` | `${LANGFUSE_HOST}/api/public/otel`, Basic auth, `x-langfuse-ingestion-version: 4` |
| `otlp_http/elasticsearch` | `http://elasticsearch:9200/_otlp` |
| `otlp_http/openobserve` | `${OPENOBSERVE_ENDPOINT}`, Basic auth, `stream-name: observability` |
| `debug` | `verbosity: basic` |

Pipelines:

| Signal | Exporters |
|---|---|
| traces | Elasticsearch, OpenObserve, Langfuse |
| metrics | Elasticsearch, OpenObserve |
| logs | Elasticsearch, OpenObserve |

It reads `${env:...}` values from the `otel-collector` service environment, so
the file cannot be used standalone. After editing it, restart the collector:

```bash
docker compose up -d --force-recreate otel-collector
```

---

## 7. Access and credentials

| UI | URL | Login |
|---|---|---|
| Langfuse | <http://localhost:3000> | `admin@example.com` / `Admin1234!` |
| OpenObserve | <http://localhost:5080> | `admin@example.com` / `Admin1234!` |
| Kibana | <http://localhost:5601> | none |
| MongoExpress | <http://localhost:8081> | basic auth (default `admin` / `pass` unless configured) |
| MinIO S3 API | <http://localhost:9000> | `minioadmin` / `minioadmin` |

---

## 8. Verify it works

**Readiness**

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/public/ready  # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:9000/minio/health/live # 200
```

**Send one OTLP trace through the collector**

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -H 'Content-Type: application/json' \
  -d '{"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"smoke-test"}}]},"scopeSpans":[{"scope":{"name":"smoke"},"spans":[{"traceId":"5b8efff798038103d269b633813fc60c","spanId":"eee19b7ec3c1b174","name":"smoke-test-span","kind":1,"startTimeUnixNano":"1700000000000000000","endTimeUnixNano":"1700000001000000000"}]}]}]}' \
  http://localhost:4318/v1/traces
```

**Confirm it reached Langfuse (ClickHouse)**

```bash
docker exec langfuse-clickhouse clickhouse-client -u clickhouse --password clickhouse \
  -q "SELECT count() FROM default.events_core WHERE trace_id='5b8efff798038103d269b633813fc60c'"
```

**Confirm the S3 write path**

```bash
docker exec langfuse-minio sh -c \
  'mc alias set local http://127.0.0.1:9000 minioadmin minioadmin >/dev/null 2>&1; mc ls -r local/langfuse'
```

**Confirm OpenObserve ingestion**

```bash
curl -s -u 'admin@example.com:Admin1234!' http://localhost:5080/api/default/streams
```

You should see `observability` (traces) and `trace_time_index_observability`.

---

## 9. Data and reset

All state lives in named volumes prefixed with the Compose project name
(`langfuse_*`, derived from this directory):

| Volume | Contents |
|---|---|
| `langfuse_langfuse-postgres-data` | Langfuse relational data |
| `langfuse_langfuse-clickhouse-data` | Traces/observations |
| `langfuse_langfuse-minio-data` | Event payloads (S3) |
| `langfuse_langfuse-redis-data` | Langfuse queue/cache |
| `langfuse_es_data` | Elasticsearch indices |
| `langfuse_openobserve_data` | OpenObserve streams |
| `langfuse_mongodb_data` | MongoDB |
| `langfuse_redis_cache_data` | Standalone cache |

```bash
docker compose down      # stop, keep volumes
docker compose down -v   # stop, delete all state
```

**Volume ownership gotcha.** `minio` expects `langfuse_langfuse-minio-data` to
be owned by UID 1001. A volume left over from an older *official-MinIO* run is
root-owned and fails with `permission denied`. Delete it once:

```bash
docker compose down
docker volume rm langfuse_langfuse-minio-data
```

---

## 10. Troubleshooting

### `failed to resolve reference "quay.io/minio/minio:...": 401 UNAUTHORIZED`

MinIO no longer serves its official images anonymously, and the Docker Hub
repos (`minio/minio`, `minio/mc`) were removed. **Changing the tag does not
help** — every tag returns 401. This stack uses
`bitnamilegacy/minio:2025.7.23-debian-12-r5` instead, with bucket creation
driven by `MINIO_DEFAULT_BUCKETS` (no `minio-init` container).

### `failed to get config: cannot retrieve config ... is a directory`

`otel-collector-config.yaml` was missing when the container started, so Docker
created an empty directory at that path. Stop, remove the directory, restore
the file, restart:

```bash
docker compose down
rm -rf otel-collector-config.yaml
cp /path/to/otel-collector-config.yaml .
docker compose up -d
```

### `minio` exits with `permission denied` / `EACCES`

The data volume is not owned by UID 1001 — see the gotcha in [§9](#9-data-and-reset).
Also confirm the mount is `/bitnami/minio/data`, not `/data`.

### Port already allocated

`redis-cache` (`6379`), `langfuse-web` (`3000`), Elasticsearch (`9200`) and
Kibana (`5601`) collide with other directories in this repo. Stop the other
stack or remap the host port, e.g. `"13000:3000"`.

### `[WARN] Redis ... does not require a password, but a password was supplied`

Startup-only probe from the Langfuse Redis client. Harmless — verify it stops:

```bash
docker logs --since 60s langfuse-worker 2>&1 | grep -c 'Redis connection error'   # 0
```

### `langfuse-web` stays `starting` / `unhealthy`

Its healthcheck runs `wget --spider http://langfuse-web:3000/api/public/ready`,
and `otel-collector` waits on it. Check the app itself:

```bash
docker logs --tail=100 langfuse-web
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/public/ready
```

### Collector exports rejected (401) but the UI is up

`LANGFUSE_AUTH` / `OPENOBSERVE_AUTH` don't match the keys/password in `.env`.
They are literal base64 of `key:secret` and `email:password`.

### Nothing appears in Langfuse

1. `docker compose ps` — is `langfuse-worker` running?
2. `docker logs otel-collector` — any export errors?
3. Confirm the client sends the `x-langfuse-ingestion-version: 4` header when
   posting directly to Langfuse (the collector already adds it).

---

## 11. Known limitations

- **No MinIO web console.** MinIO 2025.x removed the embedded UI. Use the API
  or `docker exec langfuse-minio mc ls -r local/langfuse`. Pinning
  `bitnamilegacy/minio:2024.12.18` restores the console on `9001`, at the cost
  of a much older binary.
- **`bitnamilegacy` is a frozen catalog.** Images will not receive updates.
- **Langfuse v4 `events_only`** does not serve some legacy public-API routes.
- **Dev credentials everywhere.** Not production-ready as shipped.
- **`ENCRYPTION_KEY` is not rotatable** without re-encrypting existing secrets.

---

## 12. Security

Before exposing any of this beyond localhost:

1. Replace every credential in `.env` **and** the hardcoded ones in
   `docker-compose.yml`.
2. Bind `3000`, `4317`, `4318`, `5080`, `5081`, `5601`, `9000`, `9200` to
   `127.0.0.1`.
3. Enable Elasticsearch/Kibana security and MinIO TLS.
4. Put authentication in front of Kibana.
