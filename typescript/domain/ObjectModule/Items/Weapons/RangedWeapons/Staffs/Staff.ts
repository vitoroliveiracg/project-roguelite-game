import type { baseAttributes } from "../../../../Entities/Attributes";
import type Effect from "../../../Effects/Effect";
import type { ItemRarity } from "../../../Item";
import RangedWeapon from "../RangedWeapon";

export default abstract class Staff extends RangedWeapon {
    constructor(
        baseDamage: number,
        attackSpeed: number,
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
        super(baseDamage, attackSpeed, name, description, itemId, rarity, iconId, price, durability, effects, requiredLevel, requiredAttributes, isUnique, isTradable, unlocksClass);
    }
}