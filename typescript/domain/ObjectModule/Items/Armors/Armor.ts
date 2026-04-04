import type { baseAttributes } from "../../Entities/Attributes";
import type Effect from "../Effects/Effect";
import Item, { type ItemRarity } from "../Item";

export type ArmorType = 'helmet' | 'chestplate' | 'pants' | 'boots' | 'gloves' | 'amulet' | 'ring';

export default abstract class Armor extends Item {
  
  //? ----------- Constructor -----------

  constructor(
    public readonly damageReductionPercent: number,
    public readonly dodgePercent: number,
    public readonly armorType: ArmorType,
    
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
    super(name, description, itemId, rarity, 'armor', iconId, price, false, 1, durability, effects, requiredLevel, requiredAttributes, isUnique, isTradable);
  }

}