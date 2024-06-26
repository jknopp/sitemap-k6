import http from 'k6/http'
import { check } from 'k6'
import { parseHTML } from "k6/html";
import { isOK } from './helpers.js'
import { debugObject } from './debug.js'
import _ from 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js'

export function getPage(url, data, metrics){
    //get the page
    let response = http.get(url, data.params)

    //handle checks/metrics
    check(response, isOK) || metrics.addErrorMetrics()
    metrics.addResponseMetrics(response)

    //load page assets
    getPageAssets(response,data, metrics)

    //in case you want to do anything further with response
    return response
}

function getPageAssets(response,data, metrics) {
    //load all secondary assets
    let newAssets = findNewAssets(response,data.assets, data.domainFilter)

    //debugObject(newAssets,'NEW ASSETS!')

    //if we have new assets, requests them
    if(newAssets.length > 0){
        //load new assets
        let pageAssets = createBatchArrayFromURLArray(newAssets,'GET',null,data.params);

        let pageAssetResponses = http.batch(pageAssets);

        for (let key in pageAssetResponses) {
            check(pageAssetResponses[key], isOK) || metrics.addErrorMetrics()

            metrics.addResponseMetrics(pageAssetResponses[key])
        }

        //add new assets to our asset cache to make sure we don't load them again
        data.assets = [...data.assets, ...newAssets]

        //debugObject(assets,'Assets')

        //empty our new assets
        newAssets = [];
    }
}

//check if url has http or https before //
function checkHttpsProtocol(url) {
    if (url.startsWith('https://')) {
        return url
    } else if(url.startsWith('http://')) {
            //force https
            url = url.replace('http://', 'https://')
            return url
    } else {
        //check if it starts with //
        if (url.startsWith('//')) {
            //if it does, add https to the url
            url = 'https:' + url
            return url
        }
    }
    return false
}

/*
 *   Summary.     createBatchArrayFromURLArray
 *   Description. Creates an array for batch k6 calls
 *
 *   @param  array               urls           - array of URLs.
 *   @param  string              method         - HTTP method to use (GET/POST/...)
 *   @param  string|object|null  body           - (optional) body of request to send
 *   @params object|null         params         - (optional) parameters to send with request
 *   @return array               batchArray     - array of requests formatted for batch()
 */
function createBatchArrayFromURLArray (urls,method,body=null,params=null) {
    let batchArray
    //create an array based on urls with method, url, body if not null and params if not null
    if (urls.length > 0) {
        batchArray = urls.map(url => {
            return [
                method,
                url,
                body,
                params
            ]
        })
    }
    return batchArray
}

/*
 *   Summary.     findNewAssets
 *   Description. finds new assets in a response object filters against assets and domain filter
 *
 *   @param response response     - k6 response object.
 *   @param array    assets       - array of asset URLs.
 *   @param array    domainFilter - array of domains to filter out.
 *   @return array                - array of asset urls not originally in assets
 */

function findNewAssets(response, assets, domainFilter) {
    //load all secondary assets
    const doc = parseHTML(response.body)

    //find assets not already loaded (in our assets array)
    let newAssets = findAssets(doc).filter(x => !assets.includes(x))
    newAssets = filterAssetsArray(newAssets,domainFilter)

    return newAssets
}

/*
 *  Summary.     findAssets
 *  Description. Find assets in an HTML document. Currently supports css, js, images but not nested assets. There is no url validation which may cause errors
 *
 *  @param  string doc    - HTML document string
 *  @return array  assets - array of asset URLs
 */
function findAssets(doc) {
    let assets = []

    //find all stylesheets
    doc.find("link[rel='stylesheet']").toArray().forEach(function (item) {
        if(item.attr("href") != undefined) {
            let url = checkHttpsProtocol(item.attr("href"))
            if (url) {
                //url = filterVersions(url)
                assets.push(url)
            }
        }
    })

    //find all javascript
    doc.find("script").toArray().forEach(function (item) {
        if(item.attr("src") != undefined) {
            let url = checkHttpsProtocol(item.attr("src"))
            if (url) {
                //url = filterVersions(url)
                assets.push(url)
            }
        }
    })

    //find all images
    doc.find("img").toArray().forEach(function (item) {

        if(item.attr("src") != undefined) {
            let url = checkHttpsProtocol(item.attr("src"))
            if (url) {
                //url = filterVersions(url)
                assets.push(url)
            }
        }
    })

    return assets
}

function filterVersions(url) {
    if (url.indexOf('?ver=') > -1) {
        //strip ?ver=### from url
        url = url.split('?ver=')[0]
    }
    return url
}

/*
 *   Summary.     filterAssets
 *   Description. Filter an array of assets removing any matching the domain
 *
 *   @param  array   assets         - array of asset URLs.
 *   @param  array   domain         - domain to filter out.
 *   @return array   filteredAssets - array of filtered asset URLs
 */
//filter out domains from assets
function filterAssets(assets, domain) {
    let filteredAssets = []
    assets.forEach(asset => {
        if (!asset.includes(domain)) {
            filteredAssets.push(asset)
        }
    })
    return filteredAssets
}

function filterAssetsArray(assets, domainArray) {
    domainArray.forEach(domain => {
            assets = filterAssets(assets,domain)
    })
    return assets
}