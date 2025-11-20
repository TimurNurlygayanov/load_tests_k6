# Grafana Dashboards

This directory contains Grafana dashboard configurations for visualizing k6 load test results.

## Pre-configured Dashboards

The Grafana instance comes with pre-configured dashboards for:
- k6 Load Testing Results
- HTTP Request Metrics
- Error Rates
- Response Times (percentiles)
- Worker Performance Comparison

## Accessing Dashboards

1. Start the distributed test environment:
   ```bash
   ./run-distributed-test.sh user-creation
   ```
This directory contains pre-configured Grafana dashboards that are automatically loaded when the Grafana container starts.

## Auto-Loaded Dashboards

### k6 Load Testing Dashboard (`k6-dashboard.json`)

**Automatically provisioned!** This dashboard is loaded when you run `docker-compose up`.

**Access:** http://localhost:3001/d/k6-load-testing

**Panels included:**
- **HTTP Requests per Second** - Real-time request rate
- **HTTP Request Duration** - Average response time
- **Error Rate** - Percentage of failed requests
- **Virtual Users** - Current number of VUs
- **Total Requests** - Cumulative request count
- **Total Iterations** - Cumulative iteration count
- **Response Time Percentiles** - p50, p95, p99 latencies

**Features:**
- Auto-refresh every 5 seconds
- Last 15 minutes of data by default
- Color-coded thresholds (green/yellow/red)
- Mean and max calculations in legends

## How It Works

1. **Dashboard Provisioning**: The `grafana/provisioning/dashboards/dashboards.yml` file tells Grafana to load all JSON files from this directory

2. **Automatic Loading**: When Grafana starts, it automatically imports `k6-dashboard.json`

3. **No Manual Import Needed**: The dashboard is ready to use immediately after running `docker-compose up`

## Viewing the Dashboard

```bash
# Start the distributed testing environment
./run-distributed-test.sh user-creation

# Open Grafana
open http://localhost:3001

# The k6 dashboard will be available in the "Dashboards" menu
# Or go directly to: http://localhost:3001/d/k6-load-testing
```

## Customizing the Dashboard

You can customize the dashboard in two ways:

### Option 1: Edit in Grafana UI
1. Open the dashboard in Grafana
2. Click "Dashboard settings" (gear icon)
3. Make your changes
4. Click "Save dashboard"
5. Export as JSON and replace `k6-dashboard.json`

### Option 2: Edit JSON Directly
1. Edit `k6-dashboard.json` in this directory
2. Restart Grafana: `docker-compose restart grafana`
3. Changes will be automatically loaded

## Additional Community Dashboards

You can also import community k6 dashboards:

### k6 Prometheus Dashboard (ID: 2587)
1. Go to http://localhost:3001
2. Click "+" → "Import"
3. Enter dashboard ID: `2587`
4. Select "InfluxDB" as the data source
5. Click "Import"

**Note:** This requires InfluxDB v1.x format. Our setup uses InfluxDB v2 with Prometheus remote write, so some adjustments may be needed.

## Dashboard Data Source

All dashboards use the **InfluxDB** data source which is automatically configured via:
- `grafana/provisioning/datasources/influxdb.yml`
- Connection: `http://influxdb:8086`
- Organization: `k6`
- Bucket: `k6`

## Troubleshooting

### Dashboard not showing data?

1. **Check InfluxDB connection:**
   ```bash
   curl http://localhost:8086/health
   ```

2. **Verify k6 is sending metrics:**
   ```bash
   docker-compose logs k6-worker-1 | grep "influxdb"
   ```

3. **Check Grafana data source:**
   - Go to http://localhost:3001/datasources
   - Click on "InfluxDB"
   - Click "Test" button

### Dashboard not loading?

1. **Check Grafana logs:**
   ```bash
   docker-compose logs grafana
   ```

2. **Verify dashboard file exists:**
   ```bash
   ls -la grafana/dashboards/k6-dashboard.json
   ```

3. **Restart Grafana:**
   ```bash
   docker-compose restart grafana
   ```
