import type { objectTypeId } from "../../objectType.type";
import Entity from "../Entity";
import Attributes from "../Attributes";
import Attack from "../../Items/Attack";

export default abstract class Enemy extends Entity {

  private lastAttackTimestamp: number = 0;
  private readonly attackCooldown: number = 500;
  protected baseContactDamage: number = 10;
    
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

  /** * Calcula a quantidade de XP que este inimigo concede ao ser derrotado. * A fórmula pode ser ajustada para um balanceamento mais complexo. */
  public get xpGiven(): number {
    return Math.floor(this.baseXp * (1 + (this.level - 1) * 0.2));
  }

  public onStrike(): Attack | null {
    const now = Date.now();
    if (now - this.lastAttackTimestamp < this.attackCooldown) return null;
    this.lastAttackTimestamp = now;

    const selfKnockbackAction = () => {
      const knockbackDirection = this.direction.clone().multiply(-1);
       //? Define distância da força da empurrada
      this.accelator.add(knockbackDirection.multiply(8));
    };

    const totalContactDamage = this.baseContactDamage * (this.level + 2);

    return new Attack(this, totalContactDamage, 'physical', [selfKnockbackAction]);
  }
}