import RangedWeapon from "./RangedWeapon";

export default class FishingRod extends RangedWeapon {
    constructor() {
        super(
            5, // baseDamage
            1.0, // attackSpeed em segundos
            'Vara de Pesca', // name
            'Uma vara de pesca robusta. Use para fisgar e arrastar inimigos. Desperta o poder do Pescador.', // description
            5, // itemId
            'uncommon', // rarity
            5, // iconId
            25, // price
            100, // durability
            [], // effects
            1, // requiredLevel
            { dexterity: 2 }, // requiredAttributes (Exige um pouquinho de destreza para manusear)
            false, // isUnique
            true, // isTradable
            'Pescador' // unlocksClass (O gatilho que libera a Classe Pescador!)
        );
        this.projectileType = 'fishingHook'; 
    }
}