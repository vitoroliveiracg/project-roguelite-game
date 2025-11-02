import { gameEvents } from "../../../../eventDispacher/eventDispacher";
import type { baseAttributes } from "../../../Entities/Attributes";
import type Bullet from "../../../Entities/bullets/Bullet";
import type { IAtack } from "../../IAtack";
import Item, { type ItemRarity } from "../../Item";
import Weapon from "../Weapon";

export default abstract class RangedWeapon extends Weapon {
  
  //? ----------- Constructor -----------
  
  constructor(
    // --- Atributos herdados de Weapon ---
    baseDamage: number,
    attackSpeed: number,
    name: string,
    description: string,
    itemId: number,
    rarity: ItemRarity,
    iconId: number,
    price: number,
    durability: number,
    effects: any[], // Substitua 'any' por 'Effect[]' quando a classe Effect for definida
    requiredLevel: number = 1,
    requiredAttributes: Partial<baseAttributes> = {},
    isUnique: boolean = false,
    isTradable: boolean = true
  ) {
    super(baseDamage, attackSpeed, name, description, itemId, rarity, iconId, price, durability, effects, requiredLevel, requiredAttributes, isUnique, isTradable);
  }
  
  //? ----------- Methods -----------
  
  /**
   * Implementa o ataque para armas de longo alcance.
   * Dispara um evento para que o ObjectElementManager crie o projétil (munição) no mundo.
   * @param attack - Contém informações sobre o ataque (quem atirou, direção, etc.).
   * @param ammoFactory - Uma função que sabe como criar a instância da munição a ser disparada.
   */
  public attack(attack: IAtack, ammoFactory: (id: number) => Bullet): void {
    gameEvents.dispatch('spawn', { factory: ammoFactory });
  }

  //? ----------- Getters and Setters -----------

}