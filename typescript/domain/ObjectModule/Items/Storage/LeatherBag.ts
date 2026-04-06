import Bag from "./Bag";

export default class LeatherBag extends Bag {
    constructor() {
        // capacityBonus, name, desc, itemId, rarity, iconId, price
        super(12, 'Mochila de Aventureiro', 'Costurada com couro resistente. Concede +12 espaços de inventário.', 100, 'uncommon', 100, 150);
    }
}