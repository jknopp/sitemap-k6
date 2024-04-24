# sitemap-k6
Collection of k6 testing scripts

```bash
docker run --rm -i -v $PWD:/app grafana/k6 run --insecure-skip-tls-verify /app/loadstorm-slim.js -e SITE_URL=https://host.docker.internal:7101 -e K6_WEB_DASHBOARD_EXPORT=/app/html-report.html -e K6_WEB_DASHBOARD=true
```