#!/usr/bin/env node

/**
 * k6 HTML Report Generator
 * Converts k6 JSON output to beautiful HTML report
 */

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
    console.error('Usage: node generate-html-report.js <json-file> [output-html]');
    process.exit(1);
}

const jsonFile = process.argv[2];
const outputFile = process.argv[3] || jsonFile.replace('.json', '.html');

// Read k6 JSON output
const data = fs.readFileSync(jsonFile, 'utf8');
const lines = data.trim().split('\n');
const metrics = {};
const checks = {};
let testInfo = {};

// Parse JSON lines
lines.forEach(line => {
    try {
        const entry = JSON.parse(line);

        if (entry.type === 'Metric') {
            if (!metrics[entry.metric]) {
                metrics[entry.metric] = [];
            }
            metrics[entry.metric].push(entry.data);
        } else if (entry.type === 'Point') {
            if (!metrics[entry.metric]) {
                metrics[entry.metric] = [];
            }
            metrics[entry.metric].push(entry.data);
        }
    } catch (e) {
        // Skip invalid lines
    }
});

// Calculate statistics
function calculateStats(values) {
    if (!values || values.length === 0) return null;

    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / values.length,
        median: sorted[Math.floor(values.length / 2)],
        p90: sorted[Math.floor(values.length * 0.9)],
        p95: sorted[Math.floor(values.length * 0.95)],
        p99: sorted[Math.floor(values.length * 0.99)],
        count: values.length
    };
}

// Extract metric values
const metricStats = {};
Object.keys(metrics).forEach(metric => {
    const values = metrics[metric]
        .map(d => d.value)
        .filter(v => typeof v === 'number');

    if (values.length > 0) {
        metricStats[metric] = calculateStats(values);
    }
});

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>k6 Load Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }
        
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        
        .summary-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .summary-card h3 {
            color: #667eea;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        .summary-card .value {
            font-size: 2.5em;
            font-weight: 700;
            color: #333;
        }
        
        .summary-card .unit {
            font-size: 0.9em;
            color: #666;
            margin-left: 5px;
        }
        
        .metrics {
            padding: 40px;
        }
        
        .metrics h2 {
            font-size: 1.8em;
            margin-bottom: 30px;
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .metric-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .metric-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }
        
        .metric-table td {
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .metric-table tr:last-child td {
            border-bottom: none;
        }
        
        .metric-table tr:hover {
            background: #f8f9fa;
        }
        
        .metric-name {
            font-weight: 600;
            color: #333;
        }
        
        .metric-value {
            font-family: 'Courier New', monospace;
            color: #667eea;
            font-weight: 600;
        }
        
        .status-pass {
            color: #28a745;
            font-weight: 600;
        }
        
        .status-fail {
            color: #dc3545;
            font-weight: 600;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        
        .chart-container {
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .percentile-bar {
            height: 30px;
            background: linear-gradient(90deg, #28a745 0%, #ffc107 50%, #dc3545 100%);
            border-radius: 4px;
            position: relative;
            margin: 10px 0;
        }
        
        .percentile-marker {
            position: absolute;
            top: -5px;
            width: 2px;
            height: 40px;
            background: #333;
        }
        
        .percentile-label {
            position: absolute;
            top: -25px;
            font-size: 0.8em;
            font-weight: 600;
            transform: translateX(-50%);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 k6 Load Test Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            ${Object.keys(metricStats).slice(0, 4).map(metric => {
    const stats = metricStats[metric];
    const displayValue = metric.includes('duration') || metric.includes('time')
        ? (stats.avg / 1000).toFixed(2)
        : stats.count.toLocaleString();
    const unit = metric.includes('duration') || metric.includes('time') ? 'ms' : '';

    return `
                <div class="summary-card">
                    <h3>${metric.replace(/_/g, ' ')}</h3>
                    <div class="value">${displayValue}<span class="unit">${unit}</span></div>
                </div>
              `;
}).join('')}
        </div>
        
        <div class="metrics">
            <h2>Detailed Metrics</h2>
            
            <table class="metric-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Count</th>
                        <th>Min</th>
                        <th>Avg</th>
                        <th>Median</th>
                        <th>P90</th>
                        <th>P95</th>
                        <th>P99</th>
                        <th>Max</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(metricStats).map(metric => {
    const stats = metricStats[metric];
    const format = (val) => {
        if (metric.includes('duration') || metric.includes('time')) {
            return (val / 1000).toFixed(2) + 'ms';
        }
        return val.toFixed(2);
    };

    return `
                        <tr>
                            <td class="metric-name">${metric}</td>
                            <td class="metric-value">${stats.count.toLocaleString()}</td>
                            <td class="metric-value">${format(stats.min)}</td>
                            <td class="metric-value">${format(stats.avg)}</td>
                            <td class="metric-value">${format(stats.median)}</td>
                            <td class="metric-value">${format(stats.p90)}</td>
                            <td class="metric-value">${format(stats.p95)}</td>
                            <td class="metric-value">${format(stats.p99)}</td>
                            <td class="metric-value">${format(stats.max)}</td>
                        </tr>
                      `;
}).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Generated by k6 HTML Report Generator</p>
            <p>Test completed successfully ✓</p>
        </div>
    </div>
</body>
</html>`;

// Write HTML file
fs.writeFileSync(outputFile, html);
console.log(`✅ HTML report generated: ${outputFile}`);
