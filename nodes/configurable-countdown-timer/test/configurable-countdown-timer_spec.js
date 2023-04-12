// @ts-check
/**
 * Represents a LowerCaseNode that converts incoming messages to lowercase and passes them on.
 * @typedef {import('../types.d.ts').CCT_MessageInput} MessageInput
 * @typedef {import('../types.d.ts').CountdownConfig} CountdownConfig
 *
 */
const assert = require('assert');
const helper = require('node-red-node-test-helper');
const lowerNode = require('../configurable-countdown-timer.js');
const sinon = require('sinon');

// @ts-ignore
helper.init(require.resolve('node-red'), {
  functionGlobalContext: { os: require('os') },
});

const cctType = 'configurable-countdown-timer';
/**
 *
 * @param {Partial<MessageInput>} [partial]
 * @returns  {MessageInput}
 */
function getMessage(partial) {
  return {
    _msgid: Date.now().toString(),
    ...partial,
  };
}

/**
 *
 * @param {Partial<CountdownConfig>} [partial]
 * @returns  {CountdownConfig}
 */
function getConfig(partial) {
  return {
    countdownFrom: '3',
    restartOnSecondMessage: false,
    ...partial
  }
}

/**
 * @type {import('sinon').SinonFakeTimers}
 */
let clock;

describe('configurable-countdown-timer Node', function () {
  beforeEach(function (done) {
    clock = sinon.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    helper.startServer(done);
  });

  afterEach(function (done) {
    clock.restore()
    helper.unload();
    helper.stopServer(done);
  });

  it('should be loaded', async function () {
    const cctNodeId = 'cctNodeId';

    const flow = [{ id: cctNodeId, type: cctType, name: cctType }];

    await helper.load(lowerNode, flow);

    const n1 = helper.getNode(cctNodeId);

    assert.equal(n1.name, cctType);
  });


  it('should send all the clock values and emit the after count at the end',  (done) => {
    const cctNodeId = 'cctNodeId';
    const countReceiverNodeId = 'countReceiverNodeId';
    const afterCountEndTriggerId = 'afterCountEndTriggerId';

    /** @type {import('../types.d.ts').CountdownConfig} */
    const cctConfig = {
      countdownFrom: '3',
    };

    const flow = [
      {
        id: cctNodeId,
        type: cctType,
        name: cctType,
        wires: [[countReceiverNodeId], [afterCountEndTriggerId]],
        ...cctConfig,
      },
      { id: countReceiverNodeId, type: 'helper' },
      { id: afterCountEndTriggerId, type: 'helper' },
    ];

    const ticks = [];

    helper.load(lowerNode, flow, () => {

      const countReceiverNode = helper.getNode(countReceiverNodeId);
      const afterCountEndTrigger = helper.getNode(afterCountEndTriggerId);

      const cctNode = helper.getNode(cctNodeId);

      countReceiverNode.on('input', function (msg) {
        console.log('countReceiverNode INPUT', msg.payload);
        ticks.push(msg.payload);
      });

      afterCountEndTrigger.on('input', function (msg) {
        console.log('afterCountEndTrigger INPUT', msg.payload);

        try {
          console.log(ticks);
          assert.equal(ticks.join(','), '3,2,1,0');
          console.log('END');
          done();
        } catch (e) {
          done(e)
        }
      });

      const messageInput = getMessage({ payload: true });

      cctNode.receive(messageInput);

      clock.tick(50000);
      clock.runAll();

    });
  });

  it('sending true again should not restart the countdown if restart on second input is set',  (done) => {
    const cctNodeId = 'cctNodeId';
    const countReceiverNodeId = 'countReceiverNodeId';
    const afterCountEndTriggerId = 'afterCountEndTriggerId';

    /** @type {import('../types.d.ts').CountdownConfig} */
    const cctConfig = getConfig({
      countdownFrom: '3',
      restartOnSecondMessage: false,
    });

    const flow = [
      {
        id: cctNodeId,
        type: cctType,
        name: cctType,
        wires: [[countReceiverNodeId], [afterCountEndTriggerId]],
        ...cctConfig,
      },
      { id: countReceiverNodeId, type: 'helper' },
      { id: afterCountEndTriggerId, type: 'helper' },
    ];

    const ticks = [];

    helper.load(lowerNode, flow, () => {

      const countReceiverNode = helper.getNode(countReceiverNodeId);
      const afterCountEndTrigger = helper.getNode(afterCountEndTriggerId);

      const cctNode = helper.getNode(cctNodeId);

      countReceiverNode.on('input', function (msg) {
        console.log('countReceiverNode INPUT', msg.payload);
        ticks.push(msg.payload);
      });

      afterCountEndTrigger.on('input', function (msg) {
        console.log('afterCountEndTrigger INPUT', msg.payload);

        try {
          console.log(ticks);
          assert.equal(ticks.join(','), '3,2,1,0');
          console.log('END');
          done();
        } catch (e) {
          done(e)
        } finally {
          clock.restore()
        }
      });

      const messageInput = getMessage({ payload: true });

      cctNode.receive(messageInput);
      clock.tick(1000);
      // true again
      cctNode.receive(messageInput);
      clock.tick(50000);

      clock.runAll();

    });
  });


  it('sending true again should restart the countdown when restartOnSecondMessage is  true',  (done) => {
    const cctNodeId = 'cctNodeId';
    const countReceiverNodeId = 'countReceiverNodeId';
    const afterCountEndTriggerId = 'afterCountEndTriggerId';

    /** @type {import('../types.d.ts').CountdownConfig} */
    const cctConfig = getConfig({
      countdownFrom: '3',
      restartOnSecondMessage: true,
    });

    const flow = [
      {
        id: cctNodeId,
        type: cctType,
        name: cctType,
        wires: [[countReceiverNodeId], [afterCountEndTriggerId]],
        ...cctConfig,
      },
      { id: countReceiverNodeId, type: 'helper' },
      { id: afterCountEndTriggerId, type: 'helper' },
    ];

    console.log('flow', flow)
    const ticks = [];

    helper.load(lowerNode, flow, () => {

      const countReceiverNode = helper.getNode(countReceiverNodeId);
      const afterCountEndTrigger = helper.getNode(afterCountEndTriggerId);

      const cctNode = helper.getNode(cctNodeId);

      countReceiverNode.on('input', function (msg) {
        console.log('countReceiverNode INPUT', msg.payload);
        ticks.push(msg.payload);
      });

      afterCountEndTrigger.on('input', function (msg) {
        console.log('afterCountEndTrigger INPUT', msg.payload);

        try {
          console.log(ticks);
          assert.equal(ticks.join(','), '3,2,3,2,1,0');
          console.log('END');
          done();
        } catch (e) {
          done(e)
        } finally {
          clock.restore()
        }
      });

      const messageInput = getMessage({ payload: true });

      cctNode.receive(messageInput);
      clock.tick(1000);
      // true again
      cctNode.receive(messageInput);
      clock.tick(50000);

      clock.runAll();

    });
  });
});
