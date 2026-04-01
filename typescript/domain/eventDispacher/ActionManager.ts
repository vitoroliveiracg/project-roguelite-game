import type { IEventManager } from "./IGameEvents";
import type Player from "../ObjectModule/Entities/Player/Player";
import type { action } from "./actions.type";
import type { ILogger } from "../ports/ILogger";

export default class ActionManager {

  public mouseLastCoordinates:{x:number,y:number} = {x:0,y:0} 

  private spellBuffer: action[] = [];
  private lastSpellInputTime: number = 0;
  private readonly SPELL_TIMEOUT = 1500; // 1.5 segundos de tolerância para o mago digitar a próxima tecla

  constructor(private player: Player, private logger: ILogger, private eventManager: IEventManager){
    this.eventManager.on('log', ({ channel, message, params }) => {
      this.logger.log(channel as any, message, ...params);
    });
  }

  //? ----------- Methods -----------

  public checkEvent(actions :action[], mouseLastCoordinates: {x:number,y:number}){
    
    this.mouseLastCoordinates = mouseLastCoordinates

    // Limpa o buffer de magia se passar do tempo limite sem a magia ser finalizada/repassada
    if (this.spellBuffer.length > 0 && Date.now() - this.lastSpellInputTime > this.SPELL_TIMEOUT) {
      this.eventManager.dispatch('log', { channel: 'input', message: "(ActionManager) Spell buffer expired and cleared.", params: [this.spellBuffer] });
      this.spellBuffer = [];
    }

    actions.forEach(action => this.handleAction(action))

  }

  private handleAction(action :action){
    
    if (action.startsWith('spell_')) {
      this.spellBuffer.push(action);
      this.lastSpellInputTime = Date.now();
      this.eventManager.dispatch('log', { channel: 'input', message: "(ActionManager) Spell key added to buffer.", params: [action, this.spellBuffer] });
      return; // Magias são retidas no buffer temporal, não acionam o Player imediatamente
    }

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
        
      default: this.eventManager.dispatch('log', { channel: 'input', message: "(EventManager) event not managed", params: [action] });
      }
      this.eventManager.dispatch('log', { channel: 'input', message: "(EventManager) event managed", params: [action] });

  }

}