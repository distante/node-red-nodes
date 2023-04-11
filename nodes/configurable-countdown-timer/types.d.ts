import { NodeMessage } from '@node-red/registry';


export interface CCT_MessageInput extends NodeMessage {
  payload?: boolean | unknown;
  /**
   * If defined, the countdown will start again
   */
  restart?: boolean | unknown;
}


export interface ICountdownTimerNode {
  countdownValue: number;
}
