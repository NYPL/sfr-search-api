const express = require('express')
const elasticsearch = require('elasticsearch')
const logger = require('../../lib/logger')
const { handleError, InvalidRequestError } = require('../../lib/errors')
const pjson = require('../../package.json')
const { searchEndpoints } = require('./search')
const { workEndpoints } = require('./work')
const { Manifest } = require('../../lib/opdsManifest')

// Create an instance of an Express router to handle requests to v2 of the API
const v3Router = express.Router()

// Initialize logging
v3Router.logger = logger

// Set ElasticSearch endpoint for routes
v3Router.client = new elasticsearch.Client({
  host: process.env.ELASTICSEARCH_HOST,
})

// Status endpoint to verify that v2 is available
v3Router.get('/', (req, res) => {
  res.send({
    codeVersion: pjson.version,
    apiVersion: process.env.API_VERSIOn,
  })
})

v3Router.get('/opds', (req, res) => {
  const rootManifest = new Manifest('ResearchNow: Open Source & Public Domain eBooks')
  rootManifest.addLink('self', Manifest.getCurrentUrl(req), process.env.OPDS_TYPE)
  res.send(rootManifest.generateManifest())
})

v3Router.post('/opds/*', (req, res) => {
  v3Router.logger.error('POST queries are not allowed')
  handleError(res, new InvalidRequestError('Only GET requests are allowed for OPDS 2 queries'))
})

/**
 * Parses and returns the results of a query against the API.
 *
 * @param {Res} res An Express response object.
 * @param {Object} _resp The body of the response.
 * @param {Object} params An object representing the query made against the API.
 */
const respond = (res, _resp, params) => {
  const contentType = 'application/json'

  let resp = _resp
  if (contentType !== 'text/plain') resp = JSON.stringify(_resp, null, 2)

  v3Router.logger.info(`Search performed: ${JSON.stringify(params)}`)
  res.type(contentType)
  res.status(200).send(resp)
  return true
}

searchEndpoints(v3Router, respond, handleError)
workEndpoints(v3Router, respond, handleError)

module.exports = { v3Router, respond, handleError }
