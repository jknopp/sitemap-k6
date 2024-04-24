# sitemap-k6
Collection of k6 testing scripts

## Inspiration
k6-WordPress-benchmarks: https://github.com/ReviewSignal/k6-WordPress-benchmarks

## Docker
Example with a site running *outside* of docker on https://localhost:7101

* `--insecure-skip-tls-verify` flag should be passed when using a VS dev-cert locally
* `-e SITE_URL=https://host.docker.internal:7101` is the url of the site to test
    * `host.docker.internal` replaces `localhost` when running in a container

```bash
docker run --rm -i -v $PWD:/app -w /app -e K6_WEB_DASHBOARD_EXPORT=html-report.html -e K6_WEB_DASHBOARD=true grafana/k6 run --insecure-skip-tls-verify ./sitemap-k6.js -e SITE_URL=https://host.docker.internal:7101
```