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

    this.rebuildBindings();

    // Escuta a troca de classes para reconstruir a árvore de inputs
    this.eventManager.on('classChanged', () => {
        this.rebuildBindings();
    });
  }

  //? ----------- Methods -----------

  private rebuildBindings(): void {
      this.activeHandlers.clear();
      
      // 1. Registra os comandos básicos do Player
      const playerBindings = ClassActionBindings.get(this.player.constructor.name);
      if (playerBindings) {
          playerBindings.forEach((methodName, actionName) => {
              this.activeHandlers.set(actionName, (this.player as any)[methodName].bind(this.player));
          });
      }

      this.logger.log('actions', `[ActionManager] Reconstruindo atalhos. Classe ativa do Player: '${this.player.activeClass}'`);

      // 2. Registra e sobrescreve com a Classe Ativa (se houver)
      const activeClassInstance = this.player.classes.find(c => c.name === this.player.activeClass);
      if (activeClassInstance) {
          const className = activeClassInstance.constructor.name;
          this.logger.log('actions', `[ActionManager] Instância da Classe Ativa encontrada! Nome na memória: '${className}'`);
          
          const classBindings = ClassActionBindings.get(className);
          if (classBindings) {
              classBindings.forEach((methodName, actionName) => {
                  this.activeHandlers.set(actionName, (activeClassInstance as any)[methodName].bind(activeClassInstance));
                  this.logger.log('actions', `[ActionManager] SUCESSO: Ação '${actionName}' roubada pela Classe ${className}`);
              });
          } else {
              this.logger.log('error', `[ActionManager] FALHA: Nenhum atalho achado para '${className}'. Chaves disponíveis: ${Array.from(ClassActionBindings.keys()).join(', ')}`);
          }
      } else {
          this.logger.log('error', `[ActionManager] FALHA: Instância da Classe Ativa '${this.player.activeClass}' NÃO existe dentro de player.classes!`);
      }
  }

  public checkEvent(actions :action[], mouseLastCoordinates: {x:number,y:number}){
    this.mouseLastCoordinates = mouseLastCoordinates
    actions.forEach(action => {
        const handler = this.activeHandlers.get(action);
        if (handler) {
            handler(this.mouseLastCoordinates, action);
        } else {
            // Roteamento Dinâmico para o Loadout (Deck Building) - Teclas 1, 2, 3 e 4
            const loadoutMatch = action.match(/^slot_([1-4])$/);
            if (loadoutMatch) {
                const slotIndex = parseInt(loadoutMatch[1] as string) - 1;
                const skillId = this.player.activeLoadout[slotIndex];
                if (skillId) {
                    this.player.executeActiveSkill(skillId, this.mouseLastCoordinates);
                }
            } else {
                this.eventManager.dispatch('log', { channel: 'actions', message: `(ActionManager) event not managed: ${action}`, params: [] });
            }
        }
    });
  }

}