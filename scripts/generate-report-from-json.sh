#!/bin/bash

# ============================================================================
# HTML Report Generator from JSON Summary
# ============================================================================
# Generates a basic HTML report from an existing k6 summary JSON file
# Usage: ./scripts/generate-report-from-json.sh PATH_TO_SUMMARY_JSON
# ============================================================================

SUMMARY_FILE=$1

if [ -z "$SUMMARY_FILE" ]; then
    echo "Usage: $0 PATH_TO_SUMMARY_JSON"
    echo "Example: $0 reports/user-creation-20251120-123456/summary.json"
    exit 1
fi

if [ ! -f "$SUMMARY_FILE" ]; then
    echo "Error: File not found: $SUMMARY_FILE"
    exit 1
fi

REPORT_DIR=$(dirname "$SUMMARY_FILE")
TEST_NAME=$(basename "$REPORT_DIR" | cut -d'-' -f1-2) # Extract test name from dir name roughly

echo " Generating report from: $SUMMARY_FILE"

# Read summary JSON and embed it in HTML
SUMMARY_DATA=$(cat "$SUMMARY_FILE")

# Create simple HTML report with embedded data
echo "Creating HTML report..."
cat > "$REPORT_DIR/report.html" << EOF
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
            <strong>Source File:</strong> $SUMMARY_FILE<br>
            <strong>Generated:</strong> $(date)
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
echo " Report generated successfully!"
echo ""
echo "Report location: $REPORT_DIR/report.html"
echo ""

# Open report in browser (macOS)
if command -v open &> /dev/null; then
    open "$REPORT_DIR/report.html"
    echo " Report opened in browser"
else
    echo " Open $REPORT_DIR/report.html in your browser"
fi
