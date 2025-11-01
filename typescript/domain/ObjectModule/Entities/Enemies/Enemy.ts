import type { objectTypeId } from "../../objectType.type";
import Entity from "../Entity";
import Atributes from "../Atributes";
import { gameEvents } from "../../../eventDispacher/eventDispacher";

export default abstract class Enemy extends Entity {
    
  constructor (
    id: number,
    public level :number,
    private baseXp: number,
    coordinates : { x: number, y :number },
    objectId: objectTypeId,
    atributes: { strength: number, dexterity: number, inteligence: number, wisdown: number, charisma: number, constitution: number },
    state: any
  ){
    const size = { width: 16, height: 16 };
    const hpDiceFaces = 8;
    const enemyAtributes = new Atributes(hpDiceFaces, level, atributes.strength, atributes.constitution, atributes.dexterity, atributes.inteligence, atributes.wisdown, atributes.charisma);

    super(id, coordinates, size, objectId, state, enemyAtributes);
  }

  /**
   * Calcula a quantidade de XP que este inimigo concede ao ser derrotado.
   * A fórmula pode ser ajustada para um balanceamento mais complexo.
   */
  public get xpGiven(): number {
    // Exemplo: XP base + 20% do XP base por nível acima do 1.
    return Math.floor(this.baseXp * (1 + (this.level - 1) * 0.2));
  }

  public override takeDamage(damageAmount: number, killerId: number): boolean {
    const wasDefeated = super.takeDamage(damageAmount, killerId);
    if (wasDefeated) {
      gameEvents.dispatch('enemyDied', { xpGiven: this.xpGiven, killerId: killerId });
    }
    return wasDefeated;
  }
}