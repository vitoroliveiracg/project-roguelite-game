import Staff from "./Staff";

export default class SimpleStaff extends Staff {
    constructor() {
        // baseDamage, attackSpeed, name, description, itemId, rarity, iconId, price, durability, effects, requiredLevel, requiredAttributes, isUnique, isTradable, unlocksClass
        super(10, 1, 'Cajado Simples', 'Um cajado básico de madeira. Desperta o poder do Mago.', 1, 'common', 1, 10, 100, [], 1, {}, false, true, 'Mago');
        this.projectileType = 'magicMissile';
    }
}