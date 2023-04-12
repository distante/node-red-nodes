// @ts-check

/**
 * Represents a LowerCaseNode that converts incoming messages to lowercase and passes them on.
 * @typedef {import('./types.d.ts').CCT_MessageInput} MessageInput
 * @typedef {import('./types.d.ts').ICountdownTimerNode} ICountdownTimerNode
 * @typedef {import('./types.d.ts').CountdownConfig} CountdownConfig
 * @typedef {import('node-red').Node} NodeRedNode
 * @typedef {import('node-red').NodeMessageInFlow} NodeMessageInFlow
 * @typedef {import('node-red').NodeMessage} NodeMessage
 *
 */




/**@type {import('node-red').NodeInitializer} */
const initializer = (RED) => {
  /** @implements {ICountdownTimerNode} */
  class CountdownTimerNode {
    /**
     * @type NodeRedNode
     */
    nodeRef;

    /**
     * @type {CountdownConfig}
     */
    config;

    /**
     * @type {NodeJS.Timer | undefined}
     */
    counterInterval;

    ticks = -1;



    constructor(config) {
      // @ts-expect-error NodeRed patches the prototype
      RED.nodes.createNode(this, config);
      this.config = config;
      console.log('config', config);

      // @ts-ignore Node Red Patches this.
      this.nodeRef = this;

      this.nodeRef.on('input', (msg, send, done) => {
        console.log('input (config)', this.config);
        // @ts-expect-error message is typed here
        this.handleInput(msg,send, done);
      });

      this.nodeRef.on('close', (done) => {
        this.nodeRef.debug('Cleaning up nodes');
        clearInterval(this.counterInterval)
        done()
      })
    }

    /**
     * @param {MessageInput} msg
     * @param {(msg: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void} send
     * @param {(err?: Error) => void} done
     */
    handleInput(msg, send, done) {
      const { payload } = msg
      if (typeof payload !== 'boolean') {
        done();
        return;
      }

      if (payload === false) {
        // TODO:
        // this.stopCurrentInterval();
        // return;
      }

      if (this.counterInterval) {
        // Counter running
        if (!this.config.restartOnSecondMessage) {
          console.log('do not do anything');
          done();
          return;
        }

        // Restart
          console.log('Restart')
          this.stopCurrentInterval();
      }



      this.ticks = parseInt(this.config.countdownFrom);

      this.sendMessage({
        send,
        currentCountValue: this.ticks
      });

      this.counterInterval = setInterval(() => {
        this.ticks--;
        if (this.ticks < 1) {
          this.stopCurrentInterval();

          this.sendMessage({
            send,
            currentCountValue: 0,
            afterCountdownEnd: 'Countdown ended'
          })

          return;
        }

        this.sendMessage({
          send,
          currentCountValue: this.ticks
        })

      },  1000)

      done()
    }



    /**
     * @typedef SendMessageObject
     * @prop {string} [afterCountdownEnd]
     * @prop {number} [currentCountValue]
     * @prop {(msg: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void} send
     *
     * @param {SendMessageObject} config
     */
    sendMessage(config) {
      const currentCountValue = typeof config.currentCountValue === 'number' ? {
        payload: config.currentCountValue
      } : null;

      const afterCountdownEnd = config.afterCountdownEnd ? {
        payload: config.afterCountdownEnd
      }: null;

      config.send([currentCountValue, afterCountdownEnd])
    }

    stopCurrentInterval() {
      clearInterval(this.counterInterval);
      this.counterInterval = undefined;
      this.ticks = -1;
    }
  }



  // @ts-ignore NodeRed patches the prototype
  RED.nodes.registerType('configurable-countdown-timer', CountdownTimerNode);
};

module.exports = initializer;
