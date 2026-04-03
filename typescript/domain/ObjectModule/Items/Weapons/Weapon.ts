import type { baseAttributes } from "../../Entities/Attributes";
import type Effect from "../Effects/Effect";
import type Bullet from "../../Entities/projectiles/Bullet";
import type { IAtack } from "../IAtack";
import Item, { type ItemRarity } from "../Item";
import type { OnHitAction } from "../IAtack";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import type { objectTypeId } from "../../objectType.type";
import type Vector2D from "../../../shared/Vector2D";
import type Entity from "../../Entities/Entity";

export default abstract class Weapon extends Item {
  public unlocksClass?: string | undefined;
  public onHitActions: OnHitAction[] = []; // Permite injetar efeitos de impacto (ex: roubo de vida) na arma
  public projectileType?: objectTypeId;

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
    isTradable: boolean = true,
    unlocksClass?: string
  ) {
    super( name, description, itemId, rarity, 'weapon', iconId, price, false, 1, durability, effects, requiredLevel, requiredAttributes, isUnique, isTradable );
    this.unlocksClass = unlocksClass;
  }

  /** * Define o contrato de ataque para todas as armas. O atacante a utiliza passando a sua própria referência e direção. */
  public abstract attack(attacker: Entity, direction: Vector2D, eventManager: IEventManager): void;

}