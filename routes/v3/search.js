const { Search } = require('../../lib/search')
const { Publication } = require('../../lib/opdsPublication')

/**
 * Constructs the simple search endpoints for GET/POST requests. Invokes the search
 * object to construct a query and execute it.
 *
 * @param {Object} app The express application, used to construct endpoints
 * @param {Response} respond Function that responds to the API request
 * @param {ErrorResponse} handleError Function that responds with non-200 Status Code
 */

const OPDS_TYPE = 'application/opds+json'

const searchEndpoints = (app, respond, handleError) => {
  app.get('/opds/search', async (req, res) => {
    const params = req.query
    const searcher = new Search(app, params)

    try {
      searcher.buildSearch()
      await searcher.addPaging()
      const searchRes = await searcher.execSearch()
      respond(res, transformSearchOPDS(req, searchRes), params)
    } catch (err) {
      handleError(res, err)
    }
  })
}

const transformSearchOPDS = (req, resp) => {
  const perPage = req.query.per_page ? req.query.per_page : 10
  const curPage = req.query.page ? req.query.page : 1
  const { total } = resp.hits

  const opdsManifest = {
    metadata: {
      title: `ResearchNow Search Results for: ${req.query.query}`,
      total,
      itemsPerPage: perPage,
      currentPage: curPage,
    },
    links: [],
    navigation: [],
    publications: [],
  }

  setPagingLinks(req, opdsManifest.links, perPage, curPage, total)
  setPublications(req, opdsManifest.publications, resp.hits.hits)

  return opdsManifest
}

const getCurrentUrl = (req) => {
  return `${req.protocol}://${req.get('host')}${req.originalUrl}`
}

const setPublications = (req, pubs, hits) => {
  hits.map(hit => pubs.push(parseHit(req, hit)))
}

const parseHit = (req, hit) => {
  // eslint-disable-next-line no-underscore-dangle
  const pub = new Publication(hit._source, req)
  pub.setMetadata()
  pub.setLinks()
  return pub.generateManifest()
}

const setPagingLinks = (req, links, perPage, curPage, total) => {
  const lastPageNum = Math.floor(total / perPage)
  const prevPageNum = curPage - 1
  const nextPageNum = curPage + 1

  const firstPageRels = ['first']
  if (curPage === 1) { firstPageRels.push('self')}
  if (prevPageNum === 1) { firstPageRels.push('previous')}
  links.push({
    rel: firstPageRels,
    href: `${getCurrentUrl(req)}&page=1`,
    type: OPDS_TYPE,
  })

  if (prevPageNum > 1) {
    links.push({
      rel: ['previous'],
      href: `${getCurrentUrl(req)}&page=${prevPageNum}`,
      type: OPDS_TYPE,
    })
  }

  const lastPageRels = ['last']
  if (curPage === lastPageNum) { lastPageRels.push('self') }
  if (nextPageNum === lastPageNum) { lastPageRels.push('next') }
  links.push({
    rel: lastPageRels,
    href: `${getCurrentUrl(req)}&page=${lastPageNum}`,
    type: OPDS_TYPE,
  })

  if (nextPageNum < lastPageNum) {
    links.push({
      rel: ['next'],
      href: `${getCurrentUrl(req)}&page=${nextPageNum}`,
      type: OPDS_TYPE,
    })
  }

  if (curPage > 1 && curPage < lastPageNum) {
    links.push({
      rel: ['self'],
      href: `${getCurrentUrl(req)}&page=${curPage}`,
      type: OPDS_TYPE,
    })
  }
}

module.exports = { searchEndpoints }
