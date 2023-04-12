import { NodeMessage } from '@node-red/registry';


export interface CCT_MessageInput extends NodeMessage {
  payload?: boolean;
  /**
   * If defined, the countdown will start again
   */
  restart?: boolean;
}


export interface ICountdownTimerNode {
  countdownValue: number;
}
