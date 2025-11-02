import ObjectElement from "../ObjectElement";
import Vector2D from "../../shared/Vector2D";

import { logger } from "../../../adapters/web/shared/Logger";
import type { objectTypeId } from "../objectType.type";
import type Attributes from "./Attributes";
import type { HitBox } from "../../hitBox/HitBox";
import type { IAtack } from "../Items/IAtack";

export default abstract class Entity extends ObjectElement {
  public velocity: Vector2D = new Vector2D(0, 0);
  public direction: Vector2D = new Vector2D(0, 0);
  public hitBox :HitBox[] | null = null

  constructor(
    id: number,
    coordinates: { x: number; y: number; },
    size: { width: number; height: number; },
    objectId: objectTypeId,
    state :any,
    public attributes :Attributes,
    protected accelator:Vector2D = new Vector2D(0,0),
    protected hurtLaunchFactor:number = 2
  ){ 
    super(size, coordinates, id, state, objectId) 
  }

  //? ----------- Methods -----------

  public move(deltaTime: number):void {
    //! --debug "colisão do personagem"
    
    //? Calcula o deslocamento para este frame (velocidade * tempo) e o aplica.
    this.velocity.multiply(deltaTime)
    
    logger.log("domain", "(Entity) moved");

    this.updatePosition()
  }

  protected updatePosition() {
    this.coordinates.x += this.velocity.x;
    this.coordinates.y += this.velocity.y;
    
    logger.log("domain", "(Entity) moved");
  }

  /**
   * Avança o estado interno da entidade. Pode ser sobrescrito por subclasses.
   * @param deltaTime O tempo em segundos decorrido desde o último frame.
  */
  public abstract update(deltaTime: number): void;

  /**
   * Aplica dano à entidade e retorna se ela foi derrotada.
   * @param atack Dados de um atack
   * @returns `true` se a entidade foi derrotada, `false` caso contrário.
   */
  public takeDamage(atack:IAtack): boolean {
    
    //! Nunca usa console.log no domínio. console.log(this.attributes.hp)
    const atackPercentage = (atack.totalDamage / this.attributes.hp) * this.hurtLaunchFactor
    this.attributes.hp = -atack.totalDamage;
    
    if (this.attributes.hp <= 0) {
      this.state = 'dead'; // Muda o estado para 'morto'
      super.destroy()
      return true;
    }
    const accelatorVectorInfluency = atack.direction.multiply(atackPercentage) 
    this.accelator.add(accelatorVectorInfluency)

    setTimeout(() => {
      this.accelator.reset()
    }, 100);

    return false;
  }

  protected disperseFrom(otherElement: ObjectElement) {
    const dX = this.coordinates.x - otherElement.coordinates.x
    const dY = this.coordinates.y - otherElement.coordinates.y

    const disperseVector = new Vector2D(dX,dY).normalize()

    this.velocity = disperseVector
      .add(this.accelator);
    this.updatePosition();
  }

  /**
   * Calcula a distância euclidiana do centro desta entidade até o centro de outro elemento.
   * @param otherElement O outro elemento para o qual a distância será medida.
   * @returns A distância como um número.
   */
  public getDistanceTo(otherElement: ObjectElement): number {
    const dx = this.coordinates.x - otherElement.coordinates.x;
    const dy = this.coordinates.y - otherElement.coordinates.y;
    // Usa o Teorema de Pitágoras para encontrar a distância
    return Math.sqrt(dx * dx + dy * dy);
  }

}