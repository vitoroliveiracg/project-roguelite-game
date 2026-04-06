import Item, { type ItemCategory, type ItemRarity } from "../Item";
import type Effect from "../Effects/Effect";

export default abstract class Bag extends Item {
    constructor(
        public capacityBonus: number,
        name: string,
        description: string,
        itemId: number,
        rarity: ItemRarity,
        iconId: number,
        price: number,
        effects: Effect[] = []
    ) {
        // A categoria genérica 'storage' notifica o player que este é um item de expansão
        super(name, description, itemId, rarity, 'storage', iconId, price, false, 1, 100, effects, 1, {}, false, true);
    }
}