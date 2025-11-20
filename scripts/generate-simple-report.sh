#!/bin/bash

# ============================================================================
# Simple HTML Report Generator for k6 Tests
# ============================================================================
# Generates a basic HTML report from k6 JSON output
# Usage: ./scripts/generate-simple-report.sh TEST_NAME
# ============================================================================

TEST_NAME=$1
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_DIR="reports/$TEST_NAME-$TIMESTAMP"

if [ -z "$TEST_NAME" ]; then
    echo "Usage: $0 TEST_NAME"
    echo "Example: $0 user-creation"
    exit 1
fi

mkdir -p $REPORT_DIR

echo " Generating report for: $TEST_NAME"
echo ""

# Run test once with both JSON output and summary export
echo "Running k6 test..."

# Check if k6 is installed locally, otherwise use Docker
if command -v k6 &> /dev/null; then
    echo "Using local k6 installation..."
    k6 run \
      --out json=$REPORT_DIR/results.json \
      --summary-export=$REPORT_DIR/summary.json \
      k6/dist/$TEST_NAME.test.js
    TEST_EXIT_CODE=$?
else
    echo "Local k6 not found, using Docker..."
    # Ensure we are in the project root
    PROJECT_ROOT=$(pwd)
    
    docker run --rm -i \
      -v "$PROJECT_ROOT:/app" \
      -w /app \
      grafana/k6:latest run \
      --out json=$REPORT_DIR/results.json \
      --summary-export=$REPORT_DIR/summary.json \
      k6/dist/$TEST_NAME.test.js
    TEST_EXIT_CODE=$?
fi

# Check if summary was generated
if [ ! -f "$REPORT_DIR/summary.json" ]; then
    echo ""
    echo " Warning: summary.json was not generated"
    echo " Creating empty summary..."
    echo '{"metrics": {}, "root_group": {}}' > $REPORT_DIR/summary.json
fi

# Read summary JSON and embed it in HTML
SUMMARY_DATA=$(cat $REPORT_DIR/summary.json)

# Create simple HTML report with embedded data
echo "Creating HTML report..."
cat > $REPORT_DIR/report.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>k6 Test Report - $TEST_NAME</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 15px;
            margin-top: 0;
        }
        h2 {
            color: #555;
            margin-top: 30px;
        }
        .info {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .info strong {
            color: #fff;
        }
        .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            margin-left: 10px;
        }
        .status.pass {
            background: #4caf50;
            color: white;
        }
        .status.fail {
            background: #f44336;
            color: white;
        }
        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 13px;
            line-height: 1.5;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .metric-card h3 {
            margin: 0 0 10px 0;
            color: #667eea;
            font-size: 14px;
        }
        .metric-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>k6 Load Test Report</h1>
        <div class="info">
            <strong>Test:</strong> $TEST_NAME
            <span class="status $([ $TEST_EXIT_CODE -eq 0 ] && echo 'pass' || echo 'fail')">
                $([ $TEST_EXIT_CODE -eq 0 ] && echo 'PASSED' || echo 'FAILED')
            </span>
            <br>
            <strong>Generated:</strong> $(date)
            <br>
            <strong>Exit Code:</strong> $TEST_EXIT_CODE
        </div>
        
        <h2>Test Summary</h2>
        <div id="results"></div>
        
        <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <strong>Note:</strong> For detailed real-time metrics, use the Grafana dashboard during distributed tests:<br>
            <code>./run-distributed-test.sh $TEST_NAME</code> then open <a href="http://localhost:3001/d/k6-load-testing">http://localhost:3001/d/k6-load-testing</a>
        </div>
    </div>
    <script>
        // Embedded JSON data (no fetch needed, works with file:// protocol)
        const summaryData = $SUMMARY_DATA;
        
        // Display the data
        const resultsDiv = document.getElementById('results');
        
        if (summaryData && summaryData.metrics) {
            // Create a nice display of metrics
            let html = '<div class="metric-grid">';
            
            const metrics = summaryData.metrics;
            for (const [key, value] of Object.entries(metrics)) {
                if (value && value.values) {
                    html += \`
                        <div class="metric-card">
                            <h3>\${key}</h3>
                            <div class="value">\${value.values.avg ? value.values.avg.toFixed(2) : value.values.count || 'N/A'}</div>
                            <small>\${value.type || ''}</small>
                        </div>
                    \`;
                }
            }
            html += '</div>';
            
            // Also show raw JSON
            html += '<h3>Raw Data</h3>';
            html += '<pre>' + JSON.stringify(summaryData, null, 2) + '</pre>';
            
            resultsDiv.innerHTML = html;
        } else {
            resultsDiv.innerHTML = '<pre>' + JSON.stringify(summaryData, null, 2) + '</pre>';
        }
    </script>
</body>
</html>
EOF

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo " Report generated successfully!"
else
    echo " Report generated (test failed with exit code $TEST_EXIT_CODE)"
fi
echo ""
echo "Report location: $REPORT_DIR"
echo "  - results.json  (raw k6 output)"
echo "  - summary.json  (test summary)"
echo "  - report.html   (HTML report)"
echo ""

# Open report in browser (macOS)
if command -v open &> /dev/null; then
    open $REPORT_DIR/report.html
    echo " Report opened in browser"
else
    echo " Open $REPORT_DIR/report.html in your browser"
fi

exit $TEST_EXIT_CODE
