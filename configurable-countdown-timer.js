// @ts-check

/**
 * Represents a LowerCaseNode that converts incoming messages to lowercase and passes them on.
 * @typedef {import('node-red').Node} NodeRedNode
 * @typedef {import('node-red').NodeMessageInFlow} NodeMessageInFlow
 *
 */

/**@type {import('node-red').NodeInitializer} */
const initializer = (RED) => {
  class CountdownTimerNode {
    /**
     * @type NodeRedNode
     */
    nodeRef;
    constructor(config) {
      // @ts-expect-error NodeRed patches the prototype theoretically
      RED.nodes.createNode(this, config);
      // @ts-ignore Node Red Patches this.
      this.nodeRef = this;

      this.nodeRef.on('input', (msg) => {
        this.handleInput(msg);
      });
    }

    /**
     * @param {NodeMessageInFlow} msg
     */
    handleInput(msg) {
      if (typeof msg.payload === 'string') {
        msg.payload = msg.payload.toLowerCase();
        this.nodeRef.send(msg);
      }
    }
  }

  // @ts-ignore NodeRed patches the prototype
  RED.nodes.registerType('configurable-countdown-timer', CountdownTimerNode);
};

module.exports = initializer;
