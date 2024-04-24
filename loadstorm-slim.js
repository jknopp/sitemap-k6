import http from 'k6/http'
import { check, group,  sleep } from 'k6'
import { rand, sitemapUrls, findNewAssets, findAssets, createBatchArrayFromURLArray, debugObject } from './lib/helpers.js'
import { isOK } from './lib/checks.js'
import _ from 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js'
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import Metrics from './lib/metrics.js';

const metrics = new Metrics()

export const options = {
    vus: 10,
    duration: '60s',
    /*
    stages: [
        { duration: '20m', target: 1000 }, // simulate ramp-up of traffic from 1 to 1000 users over 20 minutes.
        { duration: '10m', target: 1000 }, // stay at max load for 10 minutes
    ],
    */
}

//setup executes once at the start and passes data to the main function (default) which a VUser executes
export function setup () {
    //get siteurl from command line parameter
    let siteUrl = __ENV.SITE_URL
    if(siteUrl == undefined) {
        throw new Error("Missing SITE_URL variable")
    }
    //make sure we have trailing slash on the url
    const lastChar = siteUrl.substr(-1);
    if (lastChar != '/') {
       siteUrl = siteUrl + '/';
    }

    //get sitemap of the site to browse
    let sitemap = sitemapUrls(`${siteUrl}sitemap.xml`)

    //setup cookie jar to use for VUser
    const jar = new http.CookieJar()

    //setup parameters to be sent with every request, eg. custom header and cookie jar
    const globalParams = {
        headers: {
            "accept-encoding": "gzip, br, deflate",
        },
        jar: {jar},
    };

    const domainFilter = ['googleapis.com'];

    //set delay between pages
    const pause = {
        min: 0,//5
        max: 0//10
    }

    return { urls: sitemap, siteurl: siteUrl, params: globalParams, domainFilter: domainFilter, pause: pause }
}

export default function (data) {
    //setup URL to test (must be passed from command line with -e SITE_URL=https://example.com)
    const siteUrl = data.siteurl
    let assets = [] //track all static asset urls
    let newAssets = [] //used to track new assets we need to load before they are cached by the browser
    const pause = data.pause

    /*
        browse site based on sitemap
    */
    //for each url create a group, run k6 request, check responses
    let pageCounter = 1;
    data.urls.forEach(url => {
        group(url, function () {
            //console.log("\r\n\r\nBrowsing page "+ pageCounter + ' | url: ' + url)
            //load the page and check the response and log metrics
            let response = http.get(url, data.params)
            check(response, isOK)
                || metrics.addErrorMetrics()
            metrics.addResponseMetrics(response)

           // debugObject(response,'Page '+pageCounter,true)

            //load all secondary assets
            newAssets = findNewAssets(response, assets, data.domainFilter, metrics)

            //if we have new assets, requests them
            if(newAssets.length > 0){
                //load new assets
                let pageAssets = createBatchArrayFromURLArray(newAssets, 'GET', null, data.params);

                //debugObject(pageAssets,'Page '+pageCounter+' Assets')

                let pageAssetResponses = http.batch(pageAssets);

                for (let key in pageAssetResponses) {
                    check(pageAssetResponses[key], isOK)
                        || metrics.addErrorMetrics()

                    metrics.addResponseMetrics(pageAssetResponses[key])
                    //debugObject(pageAssetResponses[key],'Page Asset response '+key,true)
                }

                //add new assets to our asset cache to make sure we don't load them again
                assets = [...assets, ...newAssets]
                //debugObject(assets,'Assets')
                //empty our new assets
                newAssets = [];
            }
        })
        pageCounter++;
        sleep(rand(pause.min, pause.max))
    })
}

export function handleSummary(data) {
  return {
      "/app/summary.html": htmlReport(data),
      stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}