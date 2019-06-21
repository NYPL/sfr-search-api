const bodybuilder = require('bodybuilder')
const { Publication } = require('../../lib/opdsPublication')
const { ElasticSearchError, MissingParamError } = require('../../lib/errors')

const workEndpoints = (app, respond, handleError) => {
  app.get('/opds/work/:uuid', async (req, res) => {
    const { params } = req

    try {
      const workRes = await fetchWork(params, app)
      respond(res, transformWorkOPDS(workRes, req), params)
    } catch (err) {
      handleError(res, err)
    }
  })
}

const fetchWork = (params, app) => {
  if (!('uuid' in params) || params.uuid === undefined) {
    throw new MissingParamError('Your request must include an UUID as a param (e.g. /opds/work/{uuid})')
  }

  const { uuid } = params
  console.log('UUID', params)
  const body = bodybuilder().orQuery('term', 'uuid', uuid)

  const esQuery = {
    index: process.env.ELASTICSEARCH_INDEX_V2,
    body: body.build(),
  }

  return new Promise((resolve, reject) => {
    app.client.search(esQuery)
      .then((resp) => {
        // Raise an error if 0 or many results were found
        const respCount = resp.hits.hits.length
        if (respCount < 1) reject(new ElasticSearchError('Could not locate a record with that identifier'))
        else if (respCount > 1) reject(new ElasticSearchError('Returned multiple records, identifier lacks specificity'))
        // eslint-disable-next-line dot-notation
        resolve(resp.hits.hits[0]['_source'])
      })
      .catch(error => reject(error))
  })
}

const transformWorkOPDS = (work, req) => {
  const pub = new Publication(work, req)
  pub.setMetadata()
  pub.setLinks()
  return pub.generateManifest()
}

module.exports = { fetchWork, workEndpoints }
