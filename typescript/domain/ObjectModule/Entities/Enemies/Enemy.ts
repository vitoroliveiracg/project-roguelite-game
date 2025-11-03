import type { objectTypeId } from "../../objectType.type";
import Entity from "../Entity";
import Attributes from "../Attributes";
import type { IAtack } from "../../Items/IAtack";

export default abstract class Enemy extends Entity {
    
  constructor (
    id: number,
    public level :number,
    private baseXp: number,
    coordinates : { x: number, y :number },
    objectId: objectTypeId,
    attributes: Attributes,
    state: any  
  ){
    const size = { width: 16, height: 16 };
    super(id, coordinates, size, objectId, state, attributes);

  }

  /**
   * Calcula a quantidade de XP que este inimigo concede ao ser derrotado.
   * A fórmula pode ser ajustada para um balanceamento mais complexo.
   */
  public get xpGiven(): number {
    // Exemplo: XP base + 20% do XP base por nível acima do 1.
    return Math.floor(this.baseXp * (1 + (this.level - 1) * 0.2));
  }

  public onStrike(): IAtack {
    return {
      atackerId: this.id,
      damageType: 'magical',
      direction: this.direction,
      isCritical: false,
      totalDamage: 100
    }
  }
}