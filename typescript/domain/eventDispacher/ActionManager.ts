import type { IEventManager } from "./IGameEvents";
import type Player from "../ObjectModule/Entities/Player/Player";
import type { action } from "./actions.type";
import type { ILogger } from "../ports/ILogger";
import { ClassActionBindings } from "./ActionBindings";

export default class ActionManager {

  public mouseLastCoordinates:{x:number,y:number} = {x:0,y:0} 
  private activeHandlers: Map<action, Function> = new Map();

  constructor(private player: Player, private logger: ILogger, private eventManager: IEventManager){
    this.eventManager.on('log', ({ channel, message, params }) => {
      this.logger.log(channel as any, message, ...params);
    });

    // Registra os comandos básicos do Player (movimentação, tiro normal)
    this.registerInstance(this.player);

    const activeClassInstance = this.player.classes.find(c => c.name === this.player.activeClass);
    if (activeClassInstance) this.registerInstance(activeClassInstance);

    // Escuta a troca de classes para desplugar a classe antiga e plugar os inputs da nova
    this.eventManager.on('classChanged', (payload) => {
        if (payload.oldClassInstance) this.unregisterInstance(payload.oldClassInstance);
        if (payload.newClassInstance) this.registerInstance(payload.newClassInstance);
    });
  }

  //? ----------- Methods -----------

  public registerInstance(instance: any): void {
      const bindings = ClassActionBindings.get(instance.constructor);
      if (bindings) {
          bindings.forEach((methodName, actionName) => {
              if (this.activeHandlers.has(actionName)) {
                  throw new Error(`[ActionManager] CONFLITO CRÍTICO: A ação '${actionName}' não pode ser registrada por ${instance.constructor.name} pois já está em uso!`);
              }
              this.activeHandlers.set(actionName, instance[methodName].bind(instance));
              this.logger.log('input', `Bound action '${actionName}' to ${instance.constructor.name}.${methodName}`);
          });
      }
  }

  public unregisterInstance(instance: any): void {
      const bindings = ClassActionBindings.get(instance.constructor);
      if (bindings) {
          bindings.forEach((methodName, actionName) => {
              this.activeHandlers.delete(actionName);
              this.logger.log('input', `Unbound action '${actionName}' from ${instance.constructor.name}`);
          });
      }
  }

  public checkEvent(actions :action[], mouseLastCoordinates: {x:number,y:number}){
    this.mouseLastCoordinates = mouseLastCoordinates
    actions.forEach(action => {
        const handler = this.activeHandlers.get(action);
        if (handler) {
            handler(this.mouseLastCoordinates, action);
        } else {
            this.eventManager.dispatch('log', { channel: 'input', message: `(ActionManager) event not managed: ${action}`, params: [] });
        }
    });
  }

}