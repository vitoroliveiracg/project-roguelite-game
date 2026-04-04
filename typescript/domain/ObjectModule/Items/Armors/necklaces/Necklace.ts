import type { baseAttributes } from "../../../Entities/Attributes";
import type Effect from "../../Effects/Effect";
import type { ItemRarity } from "../../Item";
import Armor, {type ArmorType} from "../Armor";

export default abstract class Necklace extends Armor {
    constructor(
        damageReductionPercent: number,
        dodgePercent: number,
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
        super(damageReductionPercent, dodgePercent, 'amulet', name, description, itemId, rarity, iconId, price, durability, effects, requiredLevel, requiredAttributes, isUnique, isTradable);
    }
}