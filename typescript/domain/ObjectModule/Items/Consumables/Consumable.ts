import type Effect from "../Effects/Effect";
import Item, { type ItemCategory, type ItemRarity } from "../Item";
import type Entity from "../../Entities/Entity";

export default abstract class Consumable extends Item {
    constructor(
        name: string,
        description: string,
        itemId: number,
        rarity: ItemRarity,
        category: ItemCategory,
        iconId: number,
        price: number,
        effects: Effect[],
        isStackable: boolean = true,
        maxStackSize: number = 99
    ) {
        super(name, description, itemId, rarity, category, iconId, price, isStackable, maxStackSize, 1, effects, 1, {}, false, true);
    }

    public use(target: Entity): void {
        for (const effect of this.effects) {
            effect.apply(target);
        }
    }
}