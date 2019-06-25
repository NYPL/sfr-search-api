/* eslint-disable no-undef */
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chaiPromise = require('chai-as-promised')

chai.should()
chai.use(sinonChai)
chai.use(chaiPromise)
const { expect } = chai

const { fetchWork, transformWorkOPDS } = require('../routes/v3/work')
const { ElasticSearchError, MissingParamError } = require('../lib/errors')
const { Publication } = require('../lib/opdsPublication')

describe('v3 single work retrieval tests', () => {
  it('should raise an error if identifier is missing', (done) => {
    const params = {
      field: 'testing',
    }
    expect(fetchWork.bind(fetchWork, params, 'app')).to.throw(MissingParamError('Your request must include an identifier field or parameter'))
    done()
  })

  it('should return a single record for a successful query', async () => {
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
            _source: {
              uuid: 1,
              title: 'Test Work',
            },
          },
        ],
      },
    })
    const testApp = {
      client: {
        search: testClient,
      },
    }
    const params = {
      uuid: 1,
    }
    const resp = await fetchWork(params, testApp)
    expect(resp.uuid).to.equal(1)
    expect(resp.title).to.equal('Test Work')
  })

  it('should raise error if multiple records received', async () => {
    const testClient = sinon.stub()
    testClient.resolves({
      took: 0,
      timed_out: false,
      hits: {
        total: 1,
        max_score: 1,
        hits: [
          'hit1',
          'hit2',
        ],
      },
    })
    const testApp = {
      client: {
        search: testClient,
      },
    }
    const params = {
      uuid: 1,
    }
    const outcome = fetchWork(params, testApp)
    expect(outcome).to.eventually.throw(ElasticSearchError('Returned multiple records, identifier lacks specificity'))
  })

  describe('transformWorkOPDS()', () => {
    it('should generate a new OPDS Publication record', (done) => {
      const stubMeta = sinon.stub(Publication.prototype, 'setMetadata')
      const stubLinks = sinon.stub(Publication.prototype, 'setLinks')
      const stubManifest = sinon.stub(Publication.prototype, 'generateManifest')
      stubManifest.returns(true)
      const output = transformWorkOPDS('work', 'request')
      /* eslint-disable no-unused-expressions */
      expect(output).to.be.true
      expect(stubMeta).to.be.calledOnce
      expect(stubLinks).to.be.calledOnce
      /* eslint-enable no-unused-expressions */
      stubMeta.restore()
      stubLinks.restore()
      stubManifest.restore()
      done()
    })
  })
})
