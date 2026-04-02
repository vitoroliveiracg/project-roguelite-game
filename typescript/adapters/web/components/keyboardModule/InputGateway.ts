import { InputManager, type GameAction } from "./InputManager";
import type { action } from "../../../../domain/eventDispacher/actions.type";
import { logger } from "../../shared/Logger";
import type { IGameDomain } from "../../../../domain/ports/domain-contracts";

/** @class InputGateway Traduz os inputs brutos do InputManager em intenções lógicas (Actions) para o Domínio. */
export default class InputGateway {
  public inputManager: InputManager;

  constructor(private domain: IGameDomain) {
    this.inputManager = new InputManager();
  }

  /** Coleta as interações ativas e envia para o domínio. */
  public handleInteractions(screenToWorldFn: (x: number, y: number) => { x: number, y: number }): void {
    let actions: Array<action> = [];

    if (this.inputManager.isActionActive('move_up')) {
      actions.push("up");
    }
    if (this.inputManager.isActionActive('move_down')) {
      actions.push("down");
    }
    if (this.inputManager.isActionActive('move_left')) {
      actions.push("left");
    }
    if (this.inputManager.isActionActive('move_right')) {
      actions.push("right");
    }
    if (this.inputManager.isActionActive('shift')) {
      actions.push("shift");
    }
    if (this.inputManager.isActionActive('mouse_left')) {
      actions.push("leftClick");
    }
    if (this.inputManager.isActionActive('mouse_middle')) {
      actions.push("scrollClick");
    }
    if (this.inputManager.isActionActive('mouse_right')) {
      actions.push("rightClick");
    }

    const spellActions: GameAction[] = ['spell_0', 'spell_1', 'spell_2', 'spell_3', 'spell_4', 'spell_5', 'spell_6', 'spell_7', 'spell_8', 'spell_9'];
    spellActions.forEach(spell => {
      if (this.inputManager.consumeAction(spell)) {
        logger.log("input", `(Input Gateway) handled ${spell} to player`);
        actions.push(spell as action);
      }
    });

    if (this.inputManager.consumeAction('cast_spell')) {
      actions.push('castSpell');
    }

    if (actions.length <= 0) return;

    let mouseWorldCoordinates: { x: number, y: number } = { x: 0, y: 0 };
    if (actions.some(action => this.inputManager.clickActions.has(action))) {
      const screenX = this.inputManager.mouseLastCoordinates.x;
      const screenY = this.inputManager.mouseLastCoordinates.y;
      mouseWorldCoordinates = screenToWorldFn(screenX, screenY);
    }

    logger.log('input', 'Input handling complete. Delegating to domain update...');
    this.domain.handlePlayerInteractions({ actions: actions }, mouseWorldCoordinates);
  }
}