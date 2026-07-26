# Messaging

This directory contains two independent messaging services: **RabbitMQ** and **Redis**. They serve different purposes and can be started independently depending on your workload.

## When to Use Which

| Feature | RabbitMQ | Redis |
|---------|----------|-------|
| Durability | Persistent queues, message acks | In-memory (optional AOF) |
| Patterns | Pub/Sub, Work Queues, Routing, RPC | Pub/Sub, Streams, Lists |
| Complexity | Higher (exchanges, bindings) | Lower (key-value + lists) |
| Best for | Reliable job queues, event bus | Lightweight caching, real-time messaging |

Use **RabbitMQ** when you need guaranteed delivery, complex routing, or long-lived queues.
Use **Redis** when you want a simple, fast message buffer or when you are already using Redis for caching.

## Quick Start

### RabbitMQ only

```bash
cd rabbitmq
docker compose up -d
```

Access the Management UI at http://localhost:15672.

### Redis only

```bash
cd redis
docker compose up -d
```

Connect on port `6379`.

### Both

```bash
cd rabbitmq && docker compose up -d
cd ../redis && docker compose up -d
```

## Ports

| Service | Port | Purpose |
|---------|------|---------|
| RabbitMQ | `5672` | AMQP protocol |
| RabbitMQ | `15672` | Management UI |
| Redis | `6379` | Redis protocol |

## Architecture Notes

- Both services use **separate Docker volumes**, so starting/stopping one does not affect the other.
- Redis in `messaging/redis` uses the volume `redismq_data` to distinguish it from the caching instance in `caching/redis` (which uses `redis_cache_data`).
