import { NodeMessageInFlow } from '@node-red/registry';


export interface CCT_MessageInput extends NodeMessageInFlow {
  payload?: boolean | undefined;
  /**
   * If defined, the countdown will start again
   */
  restart?: boolean;
}


export interface ICountdownTimerNode {
  config: CountdownConfig;
}

export interface CountdownConfig {
  countdownFrom: string;
  restartOnSecondMessage: boolean;
}
