import { logger } from "../../adapters/web/shared/Logger";
import type { action } from "./actions.type";

export default class ActionManager {

  constructor(
    
  ){}

  //? ----------- Methods -----------

  public checkEvent(actions :action[]){
    
    actions.forEach(action => this.handleAction(action))

  }

  private handleAction(action :action){
    
    switch (action) {
      case 'up':
        break;
      case'down':
        break;
      case'left':
        break;
      case'right':
        break;
      case'shift':
        break;
      case'click':
        break;
      case'rightClick':
        break;
        
      default: logger.log('input', "(EventManager) event not managed", action)
      }
      logger.log('input', "(EventManager) event managed", action)

  }

}