import RangedWeapon from "./RangedWeapon";

export default class MagicWand extends RangedWeapon {
    constructor() {
        // baseDamage, attackSpeed, name, description, itemId, rarity, iconId, price, durability, effects, requiredLevel, requiredAttributes, isUnique, isTradable, unlocksClass
        super(10, 1, 'Varinha de Madeira', 'Uma varinha básica. Desperta o poder do Mago.', 1, 'common', 1, 10, 100, [], 1, {}, false, true, 'Mago');
    }
}