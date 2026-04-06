import Item, { type ItemRarity } from "../Item";
import type Effect from "../Effects/Effect";

export default abstract class Storage extends Item {
    constructor(
        name: string,
        description: string,
        itemId: number,
        rarity: ItemRarity,
        iconId: number,
        price: number,
        effects: Effect[] = []
    ) {
        super(name, description, itemId, rarity, 'storage', iconId, price, false, 1, 100, effects, 1, {}, false, true);
    }
}