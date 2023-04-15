// @ts-check
/**
 * Represents a LowerCaseNode that converts incoming messages to lowercase and passes them on.
 * @typedef {import('./types.d.ts').RxDebounceTimeConfig} RxDebounceTimeConfig
 * @typedef {import('node-red').NodeMessageInFlow} NodeMessageInFlow
 */
const assert = require('assert');
const helper = require('node-red-node-test-helper');
const RxDebounceTime = require('./rx-debounce-time.js');
const sinon = require('sinon');

// @ts-ignore
helper.init(require.resolve('node-red'), {
  functionGlobalContext: { os: require('os') },
});

const rxDebounceType = 'rx-debounce-time';
/**
 *
 * @param {Partial<NodeMessageInFlow>} [partial]
 * @returns  {NodeMessageInFlow}
 */
function getMessage(partial) {
  return {
    _msgid: Date.now().toString(),
    ...partial,
  };
}

/**
 *
 * @param {Partial<RxDebounceTimeConfig>} [partial]
 * @returns  {RxDebounceTimeConfig}
 */
function getConfig(partial) {
  return {
    debounceInMs: '100',
    ...partial,
  };
}

/**
 * @type {import('sinon').SinonFakeTimers}
 */
let clock;

describe('rx-debounce-time Node', function () {
  beforeEach(function (done) {
    if (clock) {
      clock.reset();
      clock.restore();
    }

    clock = sinon.useFakeTimers({
      toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
    });
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
    const rxDebounceNodeId = 'rxDebounceNodeId';

    const flow = [{ id: rxDebounceNodeId, type: rxDebounceType, name: rxDebounceType }];

    await helper.load(RxDebounceTime, flow);

    const n1 = helper.getNode(rxDebounceNodeId);

    assert.equal(n1.name, rxDebounceType);
  });

  it('should send just last value after the debounce time', (done) => {
    const rxDebounceNodeId = 'rxDebounceNodeId';
    const helperReceiverNodeId = 'helperReceiverNodeId';
    const helperCounterNodeId = 'helperCounterNodeId';
    const injectNodeId = 'injectNodeId';

    const rxDebounceConfig = getConfig({
      debounceInMs: '100',
    });

    const flow = [
      { id: injectNodeId, type: 'helper', wires: [[helperCounterNodeId, rxDebounceNodeId]] },
      { id: helperCounterNodeId, type: 'helper', wires: [] },
      {
        id: rxDebounceNodeId,
        type: rxDebounceType,
        name: rxDebounceType,
        wires: [[helperReceiverNodeId]],
        ...rxDebounceConfig,
      },
      { id: helperReceiverNodeId, type: 'helper' },
    ];

    let calls = 0;
    const myPayload = 'my Payload here';

    helper.load(RxDebounceTime, flow, () => {
      const helperReceiverNode = helper.getNode(helperReceiverNodeId);
      const helperCounterNode = helper.getNode(helperCounterNodeId);

      const rxDebounceNode = helper.getNode(rxDebounceNodeId);
      const injectNode = helper.getNode(injectNodeId);

      injectNode.on('input', function (msg) {
        console.log('injectNode INPUT', msg.payload);
      });

      rxDebounceNode.on('input', function (msg) {
        console.log('rxDebounceNode INPUT', msg.payload);
      });

      helperCounterNode.on('input', function (msg) {
        console.log('helperCounterNode INPUT', msg.payload);
        calls++;
      });

      helperReceiverNode.on('input', function (msg) {
        console.log('helperReceiverNode INPUT', msg.payload);

        try {
          console.log('calls', calls);
          assert.equal(calls, 1);
          assert.equal(msg.payload, myPayload);
          done();
        } catch (e) {
          done(e);
        }
      });

      const messageInput = getMessage({ payload: true });
      injectNode.send(messageInput);
      injectNode.send(messageInput);
      injectNode.send(messageInput);
      injectNode.send(messageInput);
      injectNode.send(messageInput);
      injectNode.send(messageInput);

      clock.tick(50000);

      clock.runAll();
    });
  });
});
