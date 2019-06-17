const { Publication } = require('./opdsPublication')

class Manifest {
  constructor(title) {
    this.metadata = {}
    this.links = []
    this.metadata.title = title
    this.addSearchLink()
  }

  addSearchLink() {
    this.links.push({
      rel: 'search',
      href: '/search{?query}',
      type: process.env.OPDS_TYPE,
      templated: true,
    })
  }

  addLink(rel, href, type, templated = false) {
    this.links.push({
      rel,
      href,
      type,
      templated,
    })
  }

  static getCurrentUrl(req) {
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`
  }

  generateManifest() {
    const outManifest = {
      metadata: this.metadata,
      links: this.links,
    }
    if (this.publications && this.publications.length > 0) {
      outManifest.publications = this.publications
    }
    return outManifest
  }

  addPagingLinks(req, perPage, curPage, total) {
    const lastPageNum = Math.floor(total / perPage)
    const prevPageNum = curPage - 1
    const nextPageNum = curPage + 1

    const firstPageRels = ['first']
    if (curPage === 1) { firstPageRels.push('self') }
    if (prevPageNum === 1) { firstPageRels.push('previous') }
    this.addLink(firstPageRels, `${Manifest.getCurrentUrl(req)}&page=1`, process.env.OPDS_TYPE)

    if (prevPageNum > 1) {
      this.addLink(['previous'], `${Manifest.getCurrentUrl(req)}&page=${prevPageNum}`, process.env.OPDS_TYPE)
    }

    const lastPageRels = ['last']
    if (curPage === lastPageNum) { lastPageRels.push('self') }
    if (nextPageNum === lastPageNum) { lastPageRels.push('next') }
    this.addLink(lastPageRels, `${Manifest.getCurrentUrl(req)}&page=${lastPageNum}`, process.env.OPDS_TYPE)

    if (nextPageNum < lastPageNum) {
      this.addLink(['next'], `${Manifest.getCurrentUrl(req)}&page=${nextPageNum}`, process.env.OPDS_TYPE)
    }

    if (curPage > 1 && curPage < lastPageNum) {
      this.addLink(['self'], `${Manifest.getCurrentUrl(req)}&page=${curPage}`, process.env.OPDS_TYPE)
    }
  }

  addPublications(req, hits) {
    this.publications = []
    hits.map(hit => this.addPublication(req, hit))
  }

  addPublication(req, hit) {
    // eslint-disable-next-line no-underscore-dangle
    const pub = new Publication(hit._source, req)
    pub.setMetadata()
    pub.setLinks()
    this.publications.push(pub.generateManifest())
  }
}

module.exports = { Manifest }
