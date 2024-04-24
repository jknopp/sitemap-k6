import { Rate, Trend, Counter } from 'k6/metrics'
import { fail, } from 'k6'

export default class Metrics {
  errorRate
  errorCount
  loginFailure
  loginResponseTime
  cartFailure
  cartResponseTime
  pageResponseTime
  assetResponseTime
  responseCacheRate

  constructor() {
    this.errorRate = new Rate('errors')
    this.errorCount = new Counter('errorCounter')
    this.loginFailure = new Counter('loginFailureCounter')
    this.loginResponseTime = new Trend('LoginResponseTime')
    this.cartFailure = new Counter('cartFailureCounter')
    this.cartResponseTime = new Trend('CartResponseTime')
    this.pageResponseTime = new Trend('PageResponseTime')
    this.assetResponseTime = new Trend('AssetResponseTime')
    this.responseCacheRate = new Rate('response_cached')
  }

  addResponseMetrics(response){
    //check if response was cached (cloudflare, litespeed, generic proxy support)
    this.responseCacheRate.add(responseWasCached(response))
    //add successful request to error rate
    this.errorRate.add(0)

    //check if we have text/html content (page) or not (asset)
    if('content-type' in response.headers && response.headers['content-type'].includes('text/html')){
        this.pageResponseTime.add(response.timings.duration)
    }else if('Content-Type' in response.headers && response.headers['Content-Type'].includes('text/html')){
        this.pageResponseTime.add(response.timings.duration)
    }else{
        this.assetResponseTime.add(response.timings.duration)
    }
  }

  addErrorMetrics(){
    this.errorRate.add(1)
    this.errorCount.add(1)
    fail('status code was *not* 200')
  }
}

function responseWasCached (response) {
    const headers = Object.keys(response.headers).reduce(
        (c, k) => (c[k.toLowerCase()] = response.headers[k].toLowerCase(), c), {}
    )

    // Cloudflare
    if (headers['cf-cache-status'] === 'hit') {
        return true
    }

    // Generic proxy
    if (headers['x-proxy-cache'] === 'hit') {
        return true
    }

    // Litespeed
    if (headers['x-lsadc-cache'] === 'hit') {
        return true
    }

    //Fastly, KeyCDN, Akamai
    if (headers['x-cache'] === 'hit') {
        return true
    }

    //WPX CDN
    if (headers['x-cache-status'] === 'hit') {
        return true
    }

    return false
}