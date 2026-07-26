#!/usr/bin/env bash
set -euo pipefail

OTEL_ENDPOINT="${OTEL_ENDPOINT:-http://localhost:4320}"

TIME_NANO=$(date +%s000000000)

curl -s -X POST "${OTEL_ENDPOINT}/v1/metrics" \
  -H "Content-Type: application/json" \
  -d "{
  \"resourceMetrics\": [
    {
      \"resource\": {
        \"attributes\": [
          { \"key\": \"service.name\", \"value\": { \"stringValue\": \"test-service\" } }
        ]
      },
      \"scopeMetrics\": [
        {
          \"scope\": { \"name\": \"test-script\" },
          \"metrics\": [
            {
              \"name\": \"test_requests_total\",
              \"description\": \"Total test requests\",
              \"unit\": \"1\",
              \"sum\": {
                \"dataPoints\": [
                  { \"timeUnixNano\": \"${TIME_NANO}\", \"asInt\": 42 }
                ],
                \"aggregationTemporality\": 2,
                \"isMonotonic\": true
              }
            }
          ]
        }
      ]
    }
  ]
}"

echo ""
echo "Sent test metric 'test_requests_total' to ${OTEL_ENDPOINT}/v1/metrics"
echo "Check Prometheus at http://localhost:9090 and query: test_requests_total"
