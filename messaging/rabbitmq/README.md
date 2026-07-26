# RabbitMQ

RabbitMQ 3 (management image) with the Management UI enabled.

## Prerequisites

- Docker
- Docker Compose v2

## Setup

> **Note:** All commands below assume you are in this directory (`messaging/rabbitmq`).

```bash
cd messaging/rabbitmq
```

Start the broker:

```bash
docker compose up -d
```

Wait ~10 seconds for the healthcheck to pass.

## Verification

Check service status:

```bash
docker compose ps
```

Check the node health from inside the container:

```bash
docker compose exec rabbitmq rabbitmqctl status
```

You should see output showing node uptime, listeners, and memory usage.

Access the Management UI in your browser:

```bash
open http://localhost:15672
```

## Usage

| Item | Value |
|------|-------|
| AMQP | `localhost:5672` |
| Management UI | http://localhost:15672 |
| Volume | `rabbitmq_data` |

Default credentials (change before any network exposure):
- **Username**: `guest`
- **Password**: `guest`

> ⚠️ **Security Warning**: `guest/guest` are factory defaults. They must be changed before exposing RabbitMQ to any network or deploying to production.

### Changing Default Credentials

Create a new admin user and delete `guest`:

```bash
# Enter the container (uses the service name from docker-compose.yml)
docker compose exec rabbitmq bash

# Create a new user
rabbitmqctl add_user myuser strongpassword
rabbitmqctl set_user_tags myuser administrator
rabbitmqctl set_permissions -p / myuser ".*" ".*" ".*"

# Delete the default guest user
rabbitmqctl delete_user guest
```

## Configuration

No `.env` file is required for basic usage. The `docker-compose.yml` uses the official `rabbitmq:3-management` image and exposes the standard ports.

For TLS, federation, or advanced tuning, mount a custom `rabbitmq.conf` and `definitions.json` into the container.

## Stop and Remove Data

```bash
docker compose down
```

Wipe the volume:

```bash
docker compose down -v
```
