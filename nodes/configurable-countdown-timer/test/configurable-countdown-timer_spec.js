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

  it('should emit each countdown number on the second output', function (done) {
  const cctNodeId = 'cctNodeId';
  const countReceiverNodeId = 'countReceiverNodeId';
    const afterCountEndTriggerId = 'afterCountEndTriggerId';

    /** @type {import('../types.d.ts').ICountdownTimerNode} */
    const cctProperties = {
      countdownValue : 3
    }

    const flow = [
      {
        id: cctNodeId, type: cctType, name: cctType
        , wires: [[afterCountEndTriggerId], [countReceiverNodeId]],
        ...cctProperties
      },
      { id: countReceiverNodeId, type: 'helper' },
      { id: afterCountEndTriggerId, type: 'helper' },
      { id: countReceiverNodeId, type: 'helper' },
    ];

    helper.load(lowerNode, flow, function () {
      const countReceiverNode = helper.getNode(countReceiverNodeId);
      const afterCountEndTrigger = helper.getNode(afterCountEndTriggerId);

      const cctNode = helper.getNode(cctNodeId);


      countReceiverNode.on('input', function (msg) {
        let counter = cctProperties.countdownValue;
        counter--;
        if (counter === 0) {
          done();
        }
      });

      const messageInput = getMessage({ payload: true })

      cctNode.receive(messageInput);
    });
  });
});
