// @ts-check

/**
 * Represents a LowerCaseNode that converts incoming messages to lowercase and passes them on.
 * @typedef {import('node-red').Node} NodeRedNode
 * @typedef {import('node-red').NodeMessageInFlow} NodeMessageInFlow
 * @typedef {import('node-red').NodeMessage} NodeMessage
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
      // @ts-expect-error NodeRed patches the prototype
      RED.nodes.createNode(this, config);
      // @ts-ignore Node Red Patches this.
      this.nodeRef = this;

      this.nodeRef.on('input', (msg, send, done) => {
        this.handleInput(msg,send, done);
      });
    }

    /**
     * @param {NodeMessageInFlow} msg
     * @param {(msg: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void} send
     * @param {(err?: Error) => void} done
     */
    handleInput(msg, send, done) {
      this.nodeRef.debug(msg)
      if (typeof msg.payload === 'string') {
        msg.payload = msg.payload.toLowerCase();
        this.nodeRef.send({
          payload: 'saninn',
        });
      }
    }
  }

  // @ts-ignore NodeRed patches the prototype
  RED.nodes.registerType('configurable-countdown-timer', CountdownTimerNode);
};

module.exports = initializer;
