import Consumable from "../Consumable";
import type { ItemRarity } from "../../Item";
import type Effect from "../../Effects/Effect";

export default abstract class Potion extends Consumable {
    constructor(name: string, description: string, itemId: number, rarity: ItemRarity, iconId: number, price: number, effects: Effect[]) {
        // A categoria 'potion' é fixada para herança
        super(name, description, itemId, rarity, 'potion', iconId, price, effects);
    }
}