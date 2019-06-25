/* eslint-disable no-undef */
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chaiPromise = require('chai-as-promised')

chai.should()
chai.use(sinonChai)
chai.use(chaiPromise)
const { expect } = chai

const { transformSearchOPDS } = require('../routes/v3/search')
const { Manifest } = require('../lib/opdsManifest')

describe('v3 search tests', () => {
  describe('transformSearchOPDS()', () => {
    it('should return an OPDS Manifest', (done) => {
      const testResp = { hits: { total: 1 } }
      const testReq = { query: { query: 'Testing' } }
      const stubPaging = sinon.stub(Manifest.prototype, 'addPagingLinks')
      const stubPubs = sinon.stub(Manifest.prototype, 'addPublications')
      const stubManifest = sinon.stub(Manifest.prototype, 'generateManifest').returns(true)
      const output = transformSearchOPDS(testReq, testResp)
      /* eslint-disable no-unused-expressions */
      expect(stubPaging).to.be.calledOnce
      expect(stubPubs).to.be.calledOnce
      expect(stubManifest).to.be.calledOnce
      expect(output).to.be.true
      /* eslint-enable no-unused-expressions */
      done()
    })
  })
})
