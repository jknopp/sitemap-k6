# sitemap-k6
Collection of k6 testing scripts

## Inspiration
k6-WordPress-benchmarks: https://github.com/ReviewSignal/k6-WordPress-benchmarks

## Docker
Example with a site running outside of docker on https://localhost:7101

```bash
docker run --rm -i -v $PWD:/app grafana/k6 run --insecure-skip-tls-verify /app/loadstorm.js -e SITE_URL=https://host.docker.internal:7101 -e K6_WEB_DASHBOARD_EXPORT=/app/html-report.html -e K6_WEB_DASHBOARD=true
```