import Helmet from "./Helmet";

export default class IronHelmet extends Helmet {
    constructor() {
        super(
            5, // damageReductionPercent (Ex: 5% de redução de dano)
            0, // dodgePercent (Capacetes de ferro são pesados, não dão esquiva)
            
            'Capacete de Ferro', // name
            'Um capacete robusto. Protege o que sobrou da sua inteligência.', // description
            10, // itemId
            'common', // rarity
            10, // iconId (Para o item jogado no chão / inventário)
            50, // price
            100, // durability
            [], // effects
            1, // requiredLevel
            { strength: 2 }, // requiredAttributes (Exige 2 de Força para equipar)
            false, // isUnique
            true // isTradable
        );
    }
}