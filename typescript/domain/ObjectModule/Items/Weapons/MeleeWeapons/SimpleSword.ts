import Sword from "./Sword";

export default class SimpleSword extends Sword {
    constructor() {
        super(
            12, // baseDamage
            0.7, // attackSpeed in seconds
            'Espada de Madeira', // name
            'Uma espada simples para treinos. Desperta o poder do Guerreiro.', // description
            4, // itemId
            'common', // rarity
            4, // iconId
            15, // price
            100, // durability
            [], // effects
            1, // requiredLevel
            { strength: 2 }, // requiredAttributes (Exige força)
            false, // isUnique
            true, // isTradable
            'Guerreiro' // unlocksClass
        );
    }
}