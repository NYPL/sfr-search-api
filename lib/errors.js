function ElasticSearchError(message) {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('error message is required')
  }

  this.message = message
  this.name = 'ElasticSearchError'
}

ElasticSearchError.prototype = Error.prototype


function MissingParamError(message) {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('error message is required')
  }

  this.message = message
  this.name = 'MissingParamError'
}

MissingParamError.prototype = Error.prototype


function InvalidRequestError(message) {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('error message is required')
  }

  this.message = message
  this.name = 'InvalidRequestError'
}

MissingParamError.prototype = Error.prototype


function NotFoundError(message) {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('error message is required')
  }

  this.message = message
  this.name = 'NotFoundError'
}

MissingParamError.prototype = Error.prototype


/**
 * Handle errors returned in the course of making a query.
 *
 * @param {Res} res An Express response object.
 * @param {Error} error An error received, to be parsed and returned as non-200 status.
 */
const handleError = (res, error) => {
  let statusCode
  let errorType
  let errorMessage
  switch (error.name) {
    case 'MissingParamError':
      statusCode = 400
      errorType = 'invalid-or-missing-parameter'
      errorMessage = error.message
      break
    case 'NotFoundError':
      statusCode = 404
      errorType = 'url-not-found'
      errorMessage = error.message
      break
    case 'InvalidRequestError':
      statusCode = 501
      errorType = 'invalid-http-request'
      errorMessage = error.message
      break
    default:
      statusCode = 500
      errorType = 'internal-server-error'
      errorMessage = error.message ? error.message : 'Encountered an unexpected error. Please retry your query'
  }
  res.status(statusCode).send({
    type: `sfr-api-url/${errorType}`,
    status: statusCode,
    detail: errorMessage,
  })
  return false
}

module.exports = {
  ElasticSearchError,
  MissingParamError,
  InvalidRequestError,
  NotFoundError,
  handleError,
}
