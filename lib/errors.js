function ElasticSearchError(message) {

  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('error message is required')
  }

  this.message = message
  this.name = "ElasticSearchError";
}

ElasticSearchError.prototype = Error.prototype

module.exports = {
  ElasticSearchError
}
