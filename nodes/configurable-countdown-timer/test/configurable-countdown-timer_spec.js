// @ts-check
/**
 * Represents a LowerCaseNode that converts incoming messages to lowercase and passes them on.
 * @typedef {import('../types.d.ts').CCT_MessageInput} MessageInput
 *
 */

const should = require('should');
const helper = require('node-red-node-test-helper');
const lowerNode = require('../configurable-countdown-timer.js');

// @ts-ignore
helper.init(require.resolve('node-red'), {
  functionGlobalContext: { os:require('os') }
});

const cctType = 'configurable-countdown-timer'
/**
 *
 * @param {Partial<MessageInput>} [partial]
 * @returns  {MessageInput}
 */
function getMessage(partial) {
  return {
    ...partial
  }
}

describe('configurable-countdown-timer Node', function () {

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function (done) {
      helper.unload();
      helper.stopServer(done);
  });

  it('should be loaded', function (done) {
  const cctNodeId = 'cctNodeId';

    const flow = [{ id: cctNodeId,type: cctType, name: cctType}];

    helper.load(lowerNode, flow, function () {

      const n1 = helper.getNode(cctNodeId);

      try {
        n1.should.have.property('name', 'configurable-countdown-timer');
        done();
      } catch(err) {
        done(err);
      }
    });
  });

  it('should make payload lower case', function (done) {
  const cctNodeId = 'cctNodeId';
  const endHelperNodeId = 'endHelperNodeId';

    const flow = [
      { id: cctNodeId,type: cctType, name: cctType,wires:[[endHelperNodeId]] },
      { id: endHelperNodeId, type: 'helper' }
    ];

    helper.load(lowerNode, flow, function () {
      const endHelperNode = helper.getNode(endHelperNodeId);
      const cctNode = helper.getNode(cctNodeId);

      endHelperNode.on('input', function (msg) {
        try {
          msg.should.have.property('payload', 'uppercase');
          done();
        } catch(err) {
          done(err);
        }
      });

      const message = getMessage({ payload: 'UpperCase' })

      cctNode.receive(message);
    });
  });
});
