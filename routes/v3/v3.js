const express = require('express')
const elasticsearch = require('elasticsearch')
const logger = require('../../lib/logger')
const pjson = require('../../package.json')
const { searchEndpoints } = require('./search')

const OPDS_TYPE = 'application/opds+json'

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
    apiVersion: 'v3-dev',
  })
})

v3Router.get('/opds', (req, res) => {
  res.send({
    metadata: { title: 'ResearchNow: Open Source & Public Domain eBooks' },
    links: [
      {
        rel: 'self',
        href: getCurrentUrl(req),
        type: OPDS_TYPE,
      },
      {
        rel: 'search',
        href: '/search{?query}',
        type: OPDS_TYPE,
        templated: true,
      },
    ],
  })
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

/**
 * Handle errors returned in the course of making a query.
 *
 * @param {Res} res An Express response object.
 * @param {Error} error An error received, to be parsed and returned as non-200 status.
 */
const handleError = (res, error) => {
  v3Router.logger.error('Resources#handleError:', error)
  let statusCode = 500
  switch (error.name) {
    case 'InvalidParameterError':
      statusCode = 422
      break
    case 'NotFoundError':
      statusCode = 404
      break
    default:
      statusCode = 500
  }
  res.status(statusCode).send({
    status: statusCode,
    name: error.name,
    error: error.message ? error.message : error,
  })
  return false
}

const getCurrentUrl = (req) => {
  return `${req.protocol}://${req.get('host')}${req.originalUrl}`
}

searchEndpoints(v3Router, respond, handleError)

module.exports = { v3Router, respond, handleError }
