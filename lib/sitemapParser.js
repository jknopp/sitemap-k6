import http from 'k6/http'
import { fail } from 'k6'

export function sitemapUrls(url) {
    const urls = []
    const response = http.get(url)

    if (response.status != 200) {
        fail(`sitemap (${url}) did *not* return 200 status`)
    }

    response.html().find('sitemap loc').each(function (idx, el) {
        const response = http.get(el.innerHTML())

        response.html().find('url loc').each(function (idx, el) {
            urls.push(el.innerHTML())
        })
    })

    response.html().find('url loc').each(function (idx, el) {
            urls.push(el.innerHTML())
        })

    if (! urls.length) {
        fail('sitemap did *not* contain any urls')
    }
    return urls
}