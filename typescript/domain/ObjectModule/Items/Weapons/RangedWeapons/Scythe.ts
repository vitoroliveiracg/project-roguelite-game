import RangedWeapon from "./RangedWeapon";
import type { AttackContext } from "../../IAtack";

export default class Scythe extends RangedWeapon {
    constructor() {
        // baseDamage, attackSpeed, name, description, itemId, rarity, iconId, price, durability, effects, requiredLevel, requiredAttributes, isUnique, isTradable, unlocksClass
        super(25, 0.8, 'Foice das Almas', 'Uma arma macabra que drena a força vital dos inimigos.', 3, 'rare', 3, 150, 100, [], 1, {}, true, true, 'Necromante');
        
        this.weaponType = 'scythe';
        // A Mágica do Roubo de Vida (Vampirismo)!
        this.onHitActions.push((context: AttackContext) => {
            const healAmount = context.damageDealt * 0.15; // 15% de roubo de vida
            context.attacker.attributes.hp += healAmount; // A classe Attributes já lida com o limite de (maxHp)
        });
    }
}