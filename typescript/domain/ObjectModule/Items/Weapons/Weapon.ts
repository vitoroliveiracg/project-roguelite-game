import type { baseAttributes } from "../../Entities/Attributes";
import type Effect from "../Effects/Effect";
import type Bullet from "../../Entities/bullets/Bullet";
import type { IAtack } from "../IAtack";
import Item, { type ItemRarity } from "../Item";

export default abstract class Weapon extends Item {
  constructor(
    public readonly baseDamage: number,
    public readonly attackSpeed: number,
    
    name: string,
    description: string,
    itemId: number,
    rarity: ItemRarity,
    iconId: number,
    price: number,
    durability: number,
    effects: Effect[],
    requiredLevel: number = 1,
    requiredAttributes: Partial<baseAttributes> = {},
    isUnique: boolean = false,
    isTradable: boolean = true
  ) {
    super( name, description, itemId, rarity, 'weapon', iconId, price, false, 1, durability, effects, requiredLevel, requiredAttributes, isUnique, isTradable );
  }

  /** * Define o contrato de ataque para todas as armas. * @param attack Contém informações sobre o ataque (quem ataca, direção, etc.). * @param ammoFactory (Opcional) Uma função para criar um projétil, usada por armas de longo alcance. * As classes filhas devem implementar este método. */
  public abstract attack(attack: IAtack, ammoFactory?: (id: number) => Bullet): void;

}