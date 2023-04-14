// @ts-check
/**
 * Represents a LowerCaseNode that converts incoming messages to lowercase and passes them on.
 * @typedef {import('../types.d.ts').CCT_MessageInput} MessageInput
 * @typedef {import('../types.d.ts').CountdownConfig} CountdownConfig
 *
 */
const assert = require('assert');
const helper = require('node-red-node-test-helper');
const CountdownTimerNode = require('../configurable-countdown-timer.js');
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
    ...partial,
  };
}

/**
 * @type {import('sinon').SinonFakeTimers}
 */
let clock;

describe('configurable-countdown-timer Node', function () {
  beforeEach(function (done) {
    if (clock) {
      clock.reset();
      clock.restore();
    }

    clock = sinon.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    clock.loopLimit = 10;

    helper.startServer(done);
  });

  afterEach(function (done) {
    clock.reset();
    clock.restore();
    helper.unload();
    helper.stopServer(done);
  });

  it('should be loaded', async function () {
    const cctNodeId = 'cctNodeId';

    const flow = [{ id: cctNodeId, type: cctType, name: cctType }];

    await helper.load(CountdownTimerNode, flow);

    const n1 = helper.getNode(cctNodeId);

    assert.equal(n1.name, cctType);
  });

  it('sending true should send all the clock values and emit the after count at the end', (done) => {
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

    helper.load(CountdownTimerNode, flow, () => {
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
          done(e);
        }
      });

      const messageInput = getMessage({ payload: true });

      cctNode.receive(messageInput);

      clock.tick(50000);
      clock.runAll();
    });
  });

  // TODO: Fix this test...
  xit('sending false should not start the countdown send all the clock values and emit the after count at the end', (done) => {
    const cctNodeId = 'cctNodeId';
    const countReceiverNodeId = 'countReceiverNodeId';
    const afterCountEndTriggerId = 'afterCountEndTriggerId';
    const onCountdownCancelId = 'onCountdownCancelId';

    /** @type {import('../types.d.ts').CountdownConfig} */
    const cctConfig = getConfig({
      countdownFrom: '3',
    });

    const flow = [
      {
        id: cctNodeId,
        type: cctType,
        name: cctType,
        wires: [[countReceiverNodeId], [afterCountEndTriggerId], [onCountdownCancelId]],
        ...cctConfig,
      },
      { id: countReceiverNodeId, type: 'helper' },
      { id: afterCountEndTriggerId, type: 'helper' },
    ];

    helper.load(CountdownTimerNode, flow, () => {
      const countReceiverNode = helper.getNode(countReceiverNodeId);
      const afterCountEndTrigger = helper.getNode(afterCountEndTriggerId);
      const onCountdownCancelTrigger = helper.getNode(onCountdownCancelId);

      const cctNode = helper.getNode(cctNodeId);

      countReceiverNode.on('input', function (msg) {
        clock.reset();
        assert.fail('countReceiverNode called');
      });

      afterCountEndTrigger.on('input', function (msg) {
        clock.reset();
        assert.fail('afterCountEndTrigger called');
      });

      onCountdownCancelTrigger.on('input', function (msg) {
        clock.reset();
        assert.fail('onCountdownCancelTrigger called');
      });

      const messageInput = getMessage({ payload: false });

      cctNode.receive(messageInput);

      clock.tick(8000);
      clock.loopLimit = 10;
      done();
    });
  });

  it('sending true again should not restart the countdown if restart on second input is set', (done) => {
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

    helper.load(CountdownTimerNode, flow, () => {
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
          done(e);
        } finally {
          clock.restore();
        }
      });

      const messageInput = getMessage({ payload: true });

      cctNode.receive(messageInput);
      clock.tick(1000);
      // true again
      cctNode.receive(messageInput);
      clock.tick(10000);

      clock.runAll();
    });
  });

  it('sending true again should restart the countdown when restartOnSecondMessage is true', (done) => {
    const cctNodeId = 'cctNodeId';
    const countReceiverNodeId = 'countReceiverNodeId';
    const afterCountEndTriggerId = 'afterCountEndTriggerId';
    const onCountdownCancelId = 'onCountdownCancelId';

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
        wires: [[countReceiverNodeId], [afterCountEndTriggerId], [onCountdownCancelId]],
        ...cctConfig,
      },
      { id: countReceiverNodeId, type: 'helper' },
      { id: afterCountEndTriggerId, type: 'helper' },
    ];

    const ticks = [];

    helper.load(CountdownTimerNode, flow, () => {
      const countReceiverNode = helper.getNode(countReceiverNodeId);
      const afterCountEndTrigger = helper.getNode(afterCountEndTriggerId);
      const onCountdownCancel = helper.getNode(onCountdownCancelId);

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
          done(e);
        } finally {
          clock.restore();
        }
      });

      const messageInput = getMessage({ payload: true });

      cctNode.receive(messageInput);
      clock.tick(1000);
      // true again
      cctNode.receive(messageInput);
      clock.tick(10000);

      clock.runAll();
    });
  });

  it('sending false while a countdown is running should stop the counter and never emit afterCountdownEnd', (done) => {
    const cctNodeId = 'cctNodeId';
    const countReceiverNodeId = 'countReceiverNodeId';
    const afterCountEndTriggerId = 'afterCountEndTriggerId';
    const onCountdownCancelId = 'onCountdownCancelId';

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
        wires: [[countReceiverNodeId], [afterCountEndTriggerId], [onCountdownCancelId]],
        ...cctConfig,
      },
      { id: countReceiverNodeId, type: 'helper' },
      { id: afterCountEndTriggerId, type: 'helper' },
      { id: onCountdownCancelId, type: 'helper' },
    ];

    const ticks = [];

    helper.load(CountdownTimerNode, flow, () => {
      const countReceiverNode = helper.getNode(countReceiverNodeId);
      const afterCountEndTrigger = helper.getNode(afterCountEndTriggerId);
      const onCountdownCancel = helper.getNode(onCountdownCancelId);

      const cctNode = helper.getNode(cctNodeId);

      countReceiverNode.on('input', function (msg) {
        console.log('countReceiverNode INPUT', msg.payload);
        ticks.push(msg.payload);
      });

      let afterCountEndCalled = false;
      afterCountEndTrigger.on('input', function (msg) {
        afterCountEndCalled = true;
      });

      onCountdownCancel.on('input', function (msg) {
        console.log('afterCountEndTrigger INPUT', msg.payload);

        try {
          console.log(ticks);
          assert.equal(afterCountEndCalled, false);
          assert.equal(ticks.join(','), '3,2');
          console.log('END');
          done();
        } catch (e) {
          done(e);
        } finally {
          clock.restore();
        }
      });

      const messageInput = getMessage({ payload: true });

      cctNode.receive(messageInput);
      clock.tick(1000);

      // cancel
      cctNode.receive(getMessage({ payload: false }));
      clock.tick(10000);
      clock.runAll();
    });
  });
});
