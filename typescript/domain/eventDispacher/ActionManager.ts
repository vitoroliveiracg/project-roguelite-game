import { logger } from "../../adapters/web/shared/Logger";
import type Player from "../ObjectModule/Entities/Player/Player";
import type { action } from "./actions.type";

export default class ActionManager {

  public mouseLastCoordinates:{x:number,y:number} = {x:0,y:0} 

  constructor(
    private player: Player
  ){
  }

  //? ----------- Methods -----------

  public checkEvent(actions :action[], mouseLastCoordinates: {x:number,y:number}){
    
    this.mouseLastCoordinates = mouseLastCoordinates
    actions.forEach(action => this.handleAction(action))

  }

  private handleAction(action :action){
    
    switch (action) {
      case 'up':
        this.player.onUpAction()
        break;
      case'down':
        this.player.onDownAction()
        break;
      case'left':
        this.player.onLeftAction()
        break;
      case'right':
        this.player.onRightAction()
        break;
      case'shift':
        this.player.onShiftAction()
        break;
      case'leftClick':
        this.player.onLeftClickAction(this.mouseLastCoordinates)
        break;
      case'rightClick':
        this.player.onRightClickAction(this.mouseLastCoordinates)
        break;
      case 'scrollClick':
        break;
        
      default: logger.log('input', "(EventManager) event not managed", action)
      }
      logger.log('input', "(EventManager) event managed", action)

  }

}