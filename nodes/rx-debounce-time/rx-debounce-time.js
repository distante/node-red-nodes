// @ts-check
const { Subject, debounceTime } = require('rxjs');
const shared = require('../shared.js');

/**
 * Represents a LowerCaseNode that converts incoming messages to lowercase and passes them on.
 * @typedef {import('./types.js').IRxDebounceTimeNode} IRxDebounceTimeNode
 * @typedef {import('./types.js').RxDebounceTimeConfig} RxDebounceTimeConfig
 * @typedef {import('node-red').Node} NodeRedNode
 * @typedef {import('node-red').NodeMessageInFlow} NodeMessageInFlow
 * @typedef {import('node-red').NodeMessage} NodeMessage
 *
 * @typedef {import('rxjs').Subscription} Subscription
 *
 *
 *
 * @typedef RxDebounceTimeMessage
 * @prop {NodeMessageInFlow} msg
 * @prop {(msg: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void} send
 * @prop {(err?: Error) => void} done
 */

/**@type {import('node-red').NodeInitializer} */
const initializer = (RED) => {
  /** @implements {IRxDebounceTimeNode} */
  class RxDebounceTimeNode {
    /**
     * @type NodeRedNode
     */
    nodeRef;

    /**
     * @type {RxDebounceTimeConfig}
     */
    config;

    /**
     * @type Subject<RxDebounceTimeMessage>
     */
    #value$$ = new Subject();

    /**
     * @type Subscription | undefined
     */
    #subscription;

    constructor(config) {
      // @ts-expect-error NodeRed patches the prototype
      RED.nodes.createNode(this, config);
      this.config = config;
      // @ts-ignore Node Red Patches this.
      this.nodeRef = this;
      this.#initialize();
    }

    #initialize() {
      this.nodeRef.on('input', (msg, send, done) => {
        this.#ensureSubscription();
        this.#value$$.next({ msg, send, done });
      });

      this.nodeRef.on('close', (done) => {
        if (typeof this.#subscription !== 'undefined') {
          this.nodeRef.debug('Cleaning up subscription');
          this.#subscription.unsubscribe();
        }
        done();
      });
    }

    #ensureSubscription() {
      if (this.#subscription) {
        return;
      }

      const debounceInMs = parseInt(this.config.debounceInMs);

      if (!this.config.debounceInMs || isNaN(debounceInMs) || debounceInMs < 0) {
        this.nodeRef.error('debounceInMs is not correctly defined!');
        return;
      }

      this.#subscription = this.#value$$.pipe(debounceTime(debounceInMs)).subscribe((data) => {
        data.msg[
          'info'
        ] = `received at ${shared.getCurrentTimeAndDate()} and debounced for ${debounceInMs}ms`;
        data.send([data.msg]);
        data.done();
      });
    }
  }

  // @ts-ignore NodeRed patches the prototype
  RED.nodes.registerType('rx-debounce-time', RxDebounceTimeNode);
};

module.exports = initializer;
