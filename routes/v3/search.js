const { Search } = require('../../lib/search')
const { Manifest } = require('../../lib/opdsManifest')

/**
 * Constructs the simple search endpoints for GET/POST requests. Invokes the search
 * object to construct a query and execute it.
 *
 * @param {Object} app The express application, used to construct endpoints
 * @param {Response} respond Function that responds to the API request
 * @param {ErrorResponse} handleError Function that responds with non-200 Status Code
 */

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
  
  const searchManifest = new Manifest(`ResearchNow Search Results for: ${req.query.query}`)
  searchManifest.metadata.total = total
  searchManifest.metadata.itemsPerPage = perPage
  searchManifest.metadata.currentPage = curPage

  searchManifest.addPagingLinks(req, perPage, curPage, total)
  searchManifest.addPublications(req, resp.hits.hits)

  return searchManifest.generateManifest()
}

module.exports = { searchEndpoints }
