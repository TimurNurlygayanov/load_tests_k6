# k6 Reporting & Monitoring

Guide to generating reports and collecting system metrics during k6 tests.

## Automatic HTML Reports ✨

**Every test run automatically generates a beautiful HTML report!**

### How It Works

When you run tests using `./run-tests.sh`, the system:
1. Runs the k6 test with JSON output
2. Automatically generates an HTML report
3. Opens the report in your browser (macOS)
4. Saves to timestamped directory

### Running Tests with Reports

```bash
# Run any test suite
./run-tests.sh load
./run-tests.sh stress
./run-tests.sh performance

# Reports are saved to:
# reports/YYYYMMDD-HHMMSS-testname/report.html
```

### Report Features

✅ **Beautiful Design** - Professional gradient styling  
✅ **Summary Cards** - Key metrics at a glance  
✅ **Detailed Table** - All percentiles (min, avg, median, p90, p95, p99, max)  
✅ **Responsive Layout** - Works on all screen sizes  
✅ **Timestamped** - Never overwrites previous reports  
✅ **Auto-Open** - Opens in browser automatically  

### Example Reports

Check `reports/examples/` for sample HTML reports.

### Manual Report Generation

Generate a report from existing JSON output:

```bash
node generate-html-report.js results.json report.html
```

---

## Built-in k6 Reporting

### Console Output (Default)

k6 provides detailed console output automatically:

```bash
k6 run k6/dist/user-creation.test.js
```

**Output includes:**
- Test duration and stages
- HTTP metrics (requests, duration, failures)
- Custom metrics
- Threshold pass/fail status
- Summary statistics

### Enhanced Console Output

Add `--summary-export` to save JSON summary:

```bash
k6 run --summary-export=results.json k6/dist/user-creation.test.js
```

## HTML Reports

### Option 1: Using k6-html-reporter (Recommended)

**Install:**
```bash
npm install -g k6-to-junit
npm install -g k6-html-reporter
```

**Generate report:**
```bash
# Run test and save JSON output
k6 run --out json=test-results.json k6/dist/user-creation.test.js

# Convert to HTML (requires separate tool)
# Note: k6 doesn't have built-in HTML export, use third-party tools
```

### Option 2: Export to Multiple Formats

k6 supports various output formats:

```bash
# JSON output
k6 run --out json=results.json k6/dist/test.js

# CSV output
k6 run --out csv=results.csv k6/dist/test.js

# InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 k6/dist/test.js

# Multiple outputs
k6 run --out json=results.json --out influxdb=http://localhost:8086/k6 k6/dist/test.js
```

## System Metrics Collection

k6 doesn't collect server-side metrics directly, but you can integrate with monitoring tools.

### Option 1: Prometheus + Grafana (Recommended)

**Architecture:**
```
k6 → Prometheus Remote Write → Prometheus → Grafana
Server → Node Exporter → Prometheus → Grafana
```

**Setup:**

1. **Install Prometheus on server:**
```bash
# On your API server
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*
```

2. **Install Node Exporter (for system metrics):**
```bash
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-*.tar.gz
cd node_exporter-*
./node_exporter &
```

3. **Run k6 with Prometheus output:**
```bash
k6 run --out experimental-prometheus-rw k6/dist/test.js
```

4. **View in Grafana:**
- Import k6 dashboard
- Add server metrics from Node Exporter
- Correlate load test metrics with system metrics

### Option 2: InfluxDB + Grafana

**Setup InfluxDB:**
```bash
# Install InfluxDB
docker run -d -p 8086:8086 \
  -v influxdb:/var/lib/influxdb \
  influxdb:1.8

# Create database
curl -XPOST 'http://localhost:8086/query' --data-urlencode 'q=CREATE DATABASE k6'
```

**Run k6 with InfluxDB output:**
```bash
k6 run --out influxdb=http://localhost:8086/k6 k6/dist/test.js
```

**Grafana Dashboard:**
- Add InfluxDB as data source
- Import k6 dashboard (ID: 2587)
- Visualize real-time metrics

### Option 3: Simple Server Monitoring Script

For basic monitoring without external tools:

**Create monitoring script on server:**
```bash
#!/bin/bash
# monitor-server.sh

OUTPUT_FILE="server-metrics-$(date +%Y%m%d-%H%M%S).log"

echo "Timestamp,CPU%,Memory%,DiskIO,NetworkRx,NetworkTx" > $OUTPUT_FILE

while true; do
    TIMESTAMP=$(date +%s)
    CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    MEM=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
    DISK=$(iostat -x 1 2 | tail -1 | awk '{print $14}')
    NET_RX=$(cat /sys/class/net/eth0/statistics/rx_bytes)
    NET_TX=$(cat /sys/class/net/eth0/statistics/tx_bytes)
    
    echo "$TIMESTAMP,$CPU,$MEM,$DISK,$NET_RX,$NET_TX" >> $OUTPUT_FILE
    sleep 1
done
```

**Run during tests:**
```bash
# On server
./monitor-server.sh &
MONITOR_PID=$!

# Run k6 tests
# ...

# Stop monitoring
kill $MONITOR_PID
```

## Custom Metrics in k6

Add custom metrics to track specific behaviors:

```typescript
import { Trend, Counter, Rate, Gauge } from 'k6/metrics';

// Custom metrics
const orderProcessingTime = new Trend('order_processing_time');
const ordersCreated = new Counter('orders_created');
const errorRate = new Rate('error_rate');
const activeUsers = new Gauge('active_users');

export default function() {
  const start = Date.now();
  
  // Your test logic
  const response = http.post(/* ... */);
  
  const duration = Date.now() - start;
  orderProcessingTime.add(duration);
  
  if (response.status === 201) {
    ordersCreated.add(1);
  } else {
    errorRate.add(1);
  }
  
  activeUsers.add(__VU);
}
```

## Report Generation Script

Generate reports with a single command:

```bash
./scripts/generate-simple-report.sh TEST_NAME
```

**Example:**
```bash
./scripts/generate-simple-report.sh user-creation
```

**What it does:**
- Runs the k6 test with JSON output
- Generates summary JSON
- Creates a simple HTML report
- Opens report in browser automatically

**Output:**
```
reports/TEST_NAME-TIMESTAMP/
  ├── results.json   (raw k6 output)
  ├── summary.json   (test summary)
  └── report.html    (HTML visualization)
```

## Recommended Setup

### For Development/Learning:
1. **Use built-in console output** - Good enough for most cases
2. **Export JSON summaries** - For record keeping
3. **Simple server monitoring script** - Track basic metrics

### For Production/Serious Testing:
1. **Prometheus + Grafana** - Industry standard
2. **InfluxDB** - Time-series database for metrics
3. **k6 Cloud** - Paid service with full features

## Quick Start: Basic Reporting

Add to your test runner script:

```bash
# In run-tests.sh
REPORT_DIR="reports/$(date +%Y%m%d-%H%M%S)"
mkdir -p $REPORT_DIR

k6 run \
  --summary-export=$REPORT_DIR/summary.json \
  --out json=$REPORT_DIR/results.json \
  k6/dist/test.js

echo "Report saved to $REPORT_DIR"
```

## Metrics Available

### k6 Built-in Metrics:
- `http_req_duration` - Request duration
- `http_req_failed` - Failed requests
- `http_reqs` - Total requests
- `vus` - Virtual users
- `vus_max` - Max virtual users
- `iterations` - Total iterations
- `data_received` - Data downloaded
- `data_sent` - Data uploaded

### Custom Metrics (in our tests):
- `errors` - Error rate
- `orders_placed` - Orders created
- `price_requests` - Price data requests
- `order_latency` - Order execution time
- `response_time` - Custom response tracking

## Example: Full Monitoring Setup

```bash
# 1. Start server monitoring
ssh server "./monitor-server.sh &"

# 2. Run k6 test with reporting
k6 run \
  --summary-export=reports/summary.json \
  --out json=reports/results.json \
  k6/dist/test.js

# 3. Stop server monitoring
ssh server "pkill -f monitor-server.sh"

# 4. Analyze results
cat reports/summary.json | jq '.metrics'
```

## Resources

- **k6 Docs:** https://k6.io/docs/
- **k6 Cloud:** https://k6.io/cloud/
- **Grafana k6 Dashboard:** https://grafana.com/grafana/dashboards/2587
- **Prometheus Integration:** https://k6.io/docs/results-output/real-time/prometheus-remote-write/

## Summary

**Built-in Reporting:**
- ✅ Console output (always available)
- ✅ JSON export (`--out json=file.json`)
- ✅ Summary export (`--summary-export=file.json`)

**System Metrics:**
- ⚠️ Not built-in to k6
- ✅ Use Prometheus + Node Exporter
- ✅ Use InfluxDB + Telegraf
- ✅ Simple shell scripts for basic monitoring

**Best Practice:**
Start with JSON exports, add Prometheus/Grafana when needed for production testing.
