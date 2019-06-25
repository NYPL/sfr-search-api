/* eslint-disable no-undef */
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const { mockRes } = require('sinon-express-mock')

chai.should()
chai.use(sinonChai)
const { expect } = chai

const { respond } = require('../routes/v3/v3')

describe('Testing core v3 API Handler', () => {
  it('should return true for respond()', (done) => {
    const resp = {
      test: 'test',
    }
    const params = sinon.stub()
    const res = mockRes()
    const output = respond(res, resp, params)
    expect(output).to.be.true // eslint-disable-line
    expect(res.status).to.be.calledWith(200)
    done()
  })
})
