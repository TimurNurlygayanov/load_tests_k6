# Helper Scripts

This directory contains utility scripts used by the Docker containers.

## Scripts

### seed-database.sh

Seeds the API with test data for performance testing.

**Usage in Docker:**
```bash
docker-compose --profile seed up seeder
```

**What it does:**
- Creates 100 users with random balances ($50k-$200k)
- Places 1 market order per user (BTCUSD buy)
- Creates positions for each user
- Shows progress every 10 users

**Environment Variables:**
- `BASE_URL` - API server URL (default: http://api:3000)

**Output:**
```
🌱 Seeding Database for Performance Tests
==========================================

Configuration:
  API URL: http://api:3000
  Users to create: 100

Creating 100 users with orders...
  Progress: 10/100 users created...
  Progress: 20/100 users created...
  ...

✅ Database Seeding Completed!
  ✓ Users created: 100
  ✓ Orders placed: 100
  ✓ Positions opened: 100
```

---

### generate-simple-report.sh

Generates a simple HTML report from k6 test results.

**Usage:**
```bash
./scripts/generate-simple-report.sh TEST_NAME
```

**Example:**
```bash
./scripts/generate-simple-report.sh user-creation
```

**What it does:**
- Runs the specified k6 test
- Captures JSON output and summary
- Creates a styled HTML report
- Opens report in browser automatically

**Output:**
```
reports/TEST_NAME-TIMESTAMP/
  ├── results.json   (raw k6 output)
  ├── summary.json   (test summary)
  └── report.html    (HTML visualization)
```

---

## Adding New Scripts

1. Create script in this directory
2. Make it executable: `chmod +x scripts/your-script.sh`
3. Add to `Dockerfile.k6`: `COPY scripts/*.sh /scripts/`
4. Use in docker-compose or run directly

## Best Practices

- Use `#!/bin/sh` for maximum compatibility
- Include clear echo messages for progress
- Check for errors and exit with proper codes
- Use environment variables for configuration
- Add comments explaining what the script does
