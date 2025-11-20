# Distributed Load Testing with Docker

Run load tests with multiple k6 workers and aggregate results in Grafana.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Docker Network                       │
│                                                      │
│  ┌──────────┐                                       │
│  │   API    │ ← ┌──────────┐                       │
│  │  Server  │ ← │ k6 Worker│                       │
│  │  :3000   │ ← │    #1    │                       │
│  └──────────┘ ← └──────────┘                       │
│       ↓        ← ┌──────────┐                       │
│  ┌──────────┐ ← │ k6 Worker│                       │
│  │ InfluxDB │ ← │    #2    │                       │
│  │  :8086   │ ← └──────────┘                       │
│  └──────────┘ ← ┌──────────┐                       │
│       ↓        ← │ k6 Worker│                       │
│  ┌──────────┐ ← │    #3    │                       │
│  │ Grafana  │ ← └──────────┘                       │
│  │  :3001   │ ← ┌──────────┐                       │
│  └──────────┘ ← │ k6 Worker│                       │
│                  │    #4    │                       │
│                  └──────────┘                       │
└─────────────────────────────────────────────────────┘
```

> **Note:** This setup is compatible with both Intel (x86_64) and Apple Silicon (ARM64) Macs. InfluxDB 2.7 is used for ARM64 support.

## Quick Start

### 1. Build and Run

```bash
# Run distributed test with 4 workers
./run-distributed-test.sh user-creation

# Or manually with docker-compose
docker-compose up -d api influxdb grafana
docker-compose --profile load-test up k6-worker-1 k6-worker-2 k6-worker-3 k6-worker-4
```

### 2. View Results

- **Grafana Dashboard:** http://localhost:3001
- **API Server:** http://localhost:3000
- **InfluxDB:** http://localhost:8086

### 3. Stop Services

```bash
docker-compose down
```

## Running Different Tests

```bash
# User creation test
./run-distributed-test.sh user-creation

# Market data test
./run-distributed-test.sh market-data

# Stress test
./run-distributed-test.sh user-profiles

# Performance test
./run-distributed-test.sh perf-market-latest
```

## Scaling Workers

The system uses a single worker service definition that can be scaled dynamically.

### Using the Script (Recommended)

```bash
# Run with 4 workers (default)
./run-distributed-test.sh user-creation

# Run with 8 workers
./run-distributed-test.sh user-creation 8

# Run with 2 workers
./run-distributed-test.sh perf-market-latest 2
```

### Manual Scaling

```bash
# Start infrastructure
docker-compose up -d api influxdb grafana

# Scale to 4 workers
docker-compose --profile load-test up --scale k6-worker=4

# Scale to 10 workers
docker-compose --profile load-test up --scale k6-worker=10
```

### How It Works

- **Single service definition** - No copy-paste of worker configs
- **Dynamic scaling** - Use `--scale k6-worker=N` to create N instances
- **Unique tags** - Each worker gets tagged with its hostname
- **Auto-naming** - Docker creates: `k6-worker_1`, `k6-worker_2`, etc.

## Services

### API Server
- **Port:** 3000
- **Health:** http://localhost:3000/health
- **Auto-restart:** Yes
- **Health check:** Every 10s

### InfluxDB
- **Port:** 8086
- **Database:** k6
- **User:** admin
- **Password:** admin123
- **Persistence:** Docker volume

### Grafana
- **Port:** 3001
- **Auth:** Anonymous (Admin role)
- **Datasource:** InfluxDB (auto-configured)
- **Dashboards:** Auto-loaded from `grafana/dashboards/`

### k6 Workers
- **Count:** 4 (configurable)
- **Network:** Shared with API
- **Output:** InfluxDB
- **Tags:** worker=worker-N
- **Profile:** load-test

## Aggregated Results

All workers send metrics to InfluxDB with tags:
- `worker=worker-1`, `worker-2`, etc.
- `test=test-name`

Grafana automatically aggregates:
- **Total RPS** - Sum across all workers
- **Average response time** - Mean across all workers
- **Error rate** - Combined error percentage
- **Per-worker metrics** - Individual worker performance

## Grafana Dashboards

### Import k6 Dashboard

1. Open Grafana: http://localhost:3001
2. Click "+" → Import
3. Enter ID: **2587**
4. Select "InfluxDB" datasource
5. Click Import

### Custom Queries

Example InfluxDB queries in Grafana:

**Total RPS:**
```sql
SELECT sum("value") FROM "http_reqs" WHERE $timeFilter GROUP BY time($__interval)
```

**Average Response Time:**
```sql
SELECT mean("value") FROM "http_req_duration" WHERE $timeFilter GROUP BY time($__interval)
```

**Per-Worker RPS:**
```sql
SELECT sum("value") FROM "http_reqs" WHERE $timeFilter GROUP BY time($__interval), "worker"
```

## Troubleshooting

### API Not Starting

```bash
# Check logs
docker-compose logs api

# Restart
docker-compose restart api
```

### Workers Failing

```bash
# Check worker logs
docker-compose logs k6-worker-1

# Verify API is healthy
curl http://localhost:3000/health
```

### No Data in Grafana

```bash
# Check InfluxDB
curl http://localhost:8086/query?q=SHOW+DATABASES

# Verify k6 output
docker-compose logs k6-worker-1 | grep influxdb
```

### Port Conflicts

If ports are already in use:

```yaml
# Edit docker-compose.yml
services:
  api:
    ports:
      - "3001:3000"  # Change host port
  grafana:
    ports:
      - "3002:3000"  # Change host port
```

## Advanced Usage

### Custom Test Configuration

Create `docker-compose.override.yml`:

```yaml
version: '3.8'
services:
  k6-worker-1:
    command: >
      run
      --vus 100
      --duration 5m
      --out influxdb=http://influxdb:8086/k6
      /scripts/custom-test.js
```

### Environment Variables

```bash
# Set custom API URL
docker-compose up -e BASE_URL=http://api:3000

# Set custom InfluxDB
docker-compose up -e K6_OUT=influxdb=http://influxdb:8086/k6
```

### Persistent Data

Data is stored in Docker volumes:
- `influxdb-data` - Metrics history
- `grafana-data` - Dashboards and settings

To reset:
```bash
docker-compose down -v
```

## Performance Tips

1. **Scale workers based on load** - More workers = more load
2. **Monitor API resources** - Watch CPU/memory in `docker stats`
3. **Use SSD for volumes** - Faster InfluxDB writes
4. **Limit worker VUs** - Don't overwhelm the API
5. **Clean old data** - InfluxDB retention policies

## Production Deployment

For production use:

1. **Secure Grafana** - Enable authentication
2. **Secure InfluxDB** - Enable auth, use strong passwords
3. **Use external volumes** - For data persistence
4. **Add reverse proxy** - Nginx/Traefik for SSL
5. **Monitor resources** - Add Prometheus/cAdvisor
6. **Scale horizontally** - Multiple API instances with load balancer

## Resources

- **k6 Docs:** https://k6.io/docs/
- **InfluxDB Docs:** https://docs.influxdata.com/influxdb/v1.8/
- **Grafana Docs:** https://grafana.com/docs/
- **Docker Compose:** https://docs.docker.com/compose/
