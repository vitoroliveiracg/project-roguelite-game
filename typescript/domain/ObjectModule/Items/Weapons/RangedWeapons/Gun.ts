import RangedWeapon from "./RangedWeapon";

export default class Gun extends RangedWeapon {
    constructor() {
        // baseDamage, attackSpeed, name, description, itemId, rarity, iconId, price, durability, effects, requiredLevel, requiredAttributes, isUnique, isTradable, unlocksClass
        super(15, 1.5, 'Pistola Inicial', 'Uma arma de fogo confiável. Desperta o poder do Gunslinger.', 2, 'common', 2, 10, 100, [], 1, {}, false, true, 'Gunslinger');
        this.projectileType = 'simpleBullet';
    }
}