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
      // @ts-ignore Node Red Patches this.
      this.nodeRef = this;
      this.#initialize();
    }

    #initialize() {
      this.nodeRef.status({
        fill: 'grey',
        shape: 'dot',
        text: 'Ready',
      });

      this.nodeRef.on('input', (msg, send, done) => {
        // @ts-expect-error message is typed here
        this.handleInput(msg, send, done);
      });

      this.nodeRef.on('close', (done) => {
        this.nodeRef.debug('Cleaning up nodes');
        clearInterval(this.counterInterval);
        done();
      });
    }

    /**
     * @param {MessageInput} msg
     * @param {(msg: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void} send
     * @param {(err?: Error) => void} done
     */
    handleInput(msg, send, done) {
      const { payload } = msg;

      if (typeof payload !== 'boolean') {
        done();
        return;
      }

      if (payload === false) {
        if (this.counterInterval) {
          this.stopCurrentInterval();
          this.sendMessage({
            send,
            onCountdownCancel: 'CountdownCancel',
          });
        }

        return;
      }

      if (this.counterInterval) {
        // Counter running
        if (!this.config.restartOnSecondMessage) {
          done();
          return;
        }

        // Restart
        this.stopCurrentInterval();
      }

      this.ticks = parseInt(this.config.countdownFrom);

      this.sendMessage({
        send,
        currentCountValue: this.ticks,
      });

      this.counterInterval = setInterval(() => {
        this.ticks--;
        if (this.ticks < 1) {
          this.stopCurrentInterval();

          this.sendMessage({
            send,
            currentCountValue: 0,
            afterCountdownEnd: 'CountdownEnded',
          });

          return;
        }

        this.sendMessage({
          send,
          currentCountValue: this.ticks,
        });
      }, 1000);

      done();
    }

    /**
     * @typedef SendMessageObject
     * @prop {unknown} [afterCountdownEnd]
     * @prop {number} [currentCountValue]
     * @prop {unknown} [onCountdownCancel]
     * @prop {(msg: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void} send
     *
     * @param {SendMessageObject} config
     */
    sendMessage(config) {
      const currentCountValue =
        typeof config.currentCountValue === 'number'
          ? {
              payload: config.currentCountValue,
            }
          : null;

      const afterCountdownEnd = config.afterCountdownEnd
        ? {
            payload: config.afterCountdownEnd,
          }
        : null;

      const onCountdownCancel = config.onCountdownCancel
        ? {
            payload: config.onCountdownCancel,
          }
        : null;

      const currentDateTime = this.#getCurrentTimeAndDate();

      if (onCountdownCancel) {
        this.nodeRef.status({
          fill: 'red',
          shape: 'dot',
          text: `${this.config.countdownFrom}s countdown cancelled at ${currentDateTime}`,
        });
      } else if (afterCountdownEnd) {
        this.nodeRef.status({
          fill: 'green',
          shape: 'dot',
          text: `${this.config.countdownFrom}s countdown ended at ${currentDateTime}`,
        });
      } else if (currentCountValue) {
        this.nodeRef.status({
          fill: 'yellow',
          shape: 'dot',
          text: `${currentCountValue.payload}s left`,
        });
      }

      config.send([currentCountValue, afterCountdownEnd, onCountdownCancel]);
    }

    stopCurrentInterval() {
      clearInterval(this.counterInterval);
      this.counterInterval = undefined;
      this.ticks = -1;
    }

    #getCurrentTimeAndDate() {
      // Get the current date and time
      const now = new Date();

      // Format the time and date separately, using the user's local time zone
      const formattedTime = now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const formattedDate = now.toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      // Combine the formatted time and date in the desired order
      const formattedDateTime = `${formattedDate} - ${formattedTime}`;

      return formattedDateTime;
    }
  }

  // @ts-ignore NodeRed patches the prototype
  RED.nodes.registerType('configurable-countdown-timer', CountdownTimerNode);
};

module.exports = initializer;
