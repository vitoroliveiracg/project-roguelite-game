import ObjectElement from "../ObjectElement";
import Vector2D from "../../shared/Vector2D";

import { logger } from "../../../adapters/web/shared/Logger";
import type { objectTypeId } from "../objectType.type";
import type Atributes from "./Atributes";

export default abstract class Entity extends ObjectElement {
  public velocity: Vector2D = new Vector2D(0, 0);

  constructor(
    id: number,
    coordinates: { x: number; y: number; },
    size: { width: number; height: number; },
    objectId: objectTypeId,
    state :any,
    public atributes :Atributes,
  ){ 
    super(size, coordinates, id, state, objectId) 
  }

  //? ----------- Methods -----------

  public move(deltaTime: number):void {
    //! --debug "colisão do personagem"
    
    //? Calcula o deslocamento para este frame (velocidade * tempo) e o aplica.
    this.coordinates.x += this.velocity.x * deltaTime;
    this.coordinates.y += this.velocity.y * deltaTime;
    
    logger.log("domain", "(Entity) moved");
  }

  /**
   * Avança o estado interno da entidade. Pode ser sobrescrito por subclasses.
   * @param deltaTime O tempo em segundos decorrido desde o último frame.
  */
  public update(deltaTime: number): void {}

  /**
   * Aplica dano à entidade e retorna se ela foi derrotada.
   * @param damageAmount A quantidade de dano a ser aplicada.
   * @param killerId O ID da entidade que causou o dano (opcional).
   * @returns `true` se a entidade foi derrotada, `false` caso contrário.
   */
  public takeDamage(damageAmount: number, killerId?: number): boolean {
    this.atributes.hp -= damageAmount;
    
    if (this.atributes.hp <= 0) {
      this.state = 'dead'; // Muda o estado para 'morto'
      return true;
    }

    return false;
  }
}