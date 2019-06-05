/* eslint-disable no-undef */
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const bodybuilder = require('bodybuilder')
const logger = require('../lib/logger')

chai.should()
chai.use(sinonChai)
const { expect } = chai

const { Search } = require('../lib/search')
const { MissingParamError } = require('../lib/errors')

describe('v2 simple search tests', () => {
  it('should raise an error if field or query is missing in build', (done) => {
    const testApp = sinon.stub()
    const params = {
      field: 'testing',
    }
    const testSearch = new Search(testApp, params)
    expect(testSearch.buildSearch.bind()).to.throw(MissingParamError('Your POST request must include either queries or filters'))
    done()
  })

  it('should query for a simple search field/query pair', async () => {
    const testClient = sinon.stub()
    testClient.resolves({
      took: 0,
      timed_out: false,
      hits: {
        total: 1,
        max_score: 1,
        hits: [
          {
            _index: 'sfr_test',
            _type: 'test',
            _id: 1,
            _score: 1,
          },
        ],
      },
      aggregations: {},
    })
    const testApp = {
      client: {
        search: testClient,
      },
    }
    const params = {
      field: 'test',
      query: 'testing',
    }
    const testSearch = new Search(testApp, params)
    testSearch.query = {
      build: sinon.stub(),
    }
    const editionRangeStub = sinon.stub(Search, 'formatResponseEditionRange')
    const resp = await testSearch.execSearch()
    expect(resp.took).to.equal(0)
    expect(resp.hits.hits.length).to.equal(1)
    editionRangeStub.restore()
  })

  it('should create facet object for response', (done) => {
    const testResp = {
      aggregations: {
        test: {
          test: {
            buckets: [
              {
                key: 'test1',
                test: { doc_count: 9 },
              },
              {
                key: 'test2',
                test: { doc_count: 3 },
              },
              {
                key: 'test3',
                test: { doc_count: 6 },
              },
            ],
          },
        },
      },
    }

    Search.formatResponseFacets(testResp)
    expect(testResp.facets.test.length).to.equal(3)
    expect(testResp.facets.test[1].value, 'test3')
    done()
  })

  it('should add aggregations for queries', (done) => {
    const testApp = sinon.mock()
    const testSearch = new Search(testApp, {})
    testSearch.query = bodybuilder()
    testSearch.addAggregations()
    testBody = testSearch.query.build()
    expect(testBody).to.have.property('aggs')
    expect(testBody.aggs).to.have.property('language')
    expect(testBody.aggs.language).to.have.property('nested')
    done()
  })

  it('should return a year from an array of editions', (done) => {
    const stubGetRange = sinon.stub(Search, 'getEditionRangeValue')
    stubGetRange.onFirstCall().returns('1900')
    stubGetRange.onSecondCall().returns('2000')
    const testResp = {
      took: 0,
      timed_out: false,
      hits: {
        total: 1,
        max_score: 1,
        hits: [
          {
            _index: 'sfr_test',
            _type: 'test',
            _id: 1,
            _score: 1,
          },
        ],
      },
    }
    Search.formatResponseEditionRange(testResp)
    expect(testResp.hits.hits[0].edition_range).to.equal('1900 - 2000')
    stubGetRange.restore()
    done()
  })

  it('should get a year for a provided set of editions', (done) => {
    const stubCompare = sinon.stub(Search, 'startEndCompare')
    const testHit = {
      _source: {
        instances: [
          {
            pub_date: {
              gte: '2019-01-01',
              lte: '2020-12-31',
            },
          }, {
            pub_date: null,
          },
        ],
      },
    }

    const testStart = Search.getEditionRangeValue(testHit, 'gte', 1)
    const testEnd = Search.getEditionRangeValue(testHit, 'lte', -1)
    expect(testStart).to.equal(2019)
    expect(testEnd).to.equal(2020)
    stubCompare.restore()
    done()
  })

  it('should return ???? if no pub date found', (done) => {
    const stubCompare = sinon.stub(Search, 'startEndCompare')
    const testHit = {
      _source: {
        instances: [
          {
            pub_date: null,
          },
        ],
      },
    }

    const testStart = Search.getEditionRangeValue(testHit, 'gte', 1)
    const testEnd = Search.getEditionRangeValue(testHit, 'lte', -1)
    expect(testStart).to.equal('????')
    expect(testEnd).to.equal('????')
    stubCompare.restore()
    done()
  })

  it('should generate a comparison function for sorting', (done) => {
    const compareFunction = Search.startEndCompare('gte', 1)
    expect(compareFunction).to.be.instanceOf(Function)
    const edition1 = { pub_date: { gte: '1999-01-01', lte: null } }
    const edition2 = { pub_date: { gte: '2000-01-01', lte: null } }
    const order = compareFunction(edition1, edition2)
    expect(order).to.equal(-1)
    done()
  })

  it('should add gte/lte date filter on publication dates', (done) => {
    const testApp = sinon.mock()
    testApp.logger = logger
    const testParams = { filters: [{ field: 'years', value: { start: 1900, end: 2000 } }] }
    const testSearch = new Search(testApp, testParams)
    testSearch.query = bodybuilder()
    testSearch.addFilters()
    testBody = testSearch.query.build()
    expect(testBody).to.have.property('query')
    expect(testBody.query.nested.query.range['instances.pub_date'].gte.getTime()).to.equal(new Date('1900-01-01T12:00:00.000+00:00').getTime())
    expect(testBody.query.nested.query.range['instances.pub_date'].lte.getTime()).to.equal(new Date('2000-12-31T12:00:00.000+00:00').getTime())
    done()
  })

  it('should add gte date filter on publication dates if only start is provided', (done) => {
    const testApp = sinon.mock()
    testApp.logger = logger
    const testParams = { filters: [{ field: 'years', value: { start: 1900 } }] }
    const testSearch = new Search(testApp, testParams)
    testSearch.query = bodybuilder()
    testSearch.addFilters()
    testBody = testSearch.query.build()
    expect(testBody).to.have.property('query')
    expect(testBody.query.nested.query.range['instances.pub_date'].gte.getTime()).to.equal(new Date('1900-01-01T12:00:00.000+00:00').getTime())
    // eslint-disable-next-line no-unused-expressions
    expect(testBody.query.nested.query.range['instances.pub_date'].lte).to.be.undefined
    done()
  })
})
