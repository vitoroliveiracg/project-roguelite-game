import Food from "./Food/Food";
import SizeBoostEffect from "../Effects/SizeBoostEffect";

export default class MegaMushroom extends Food {
    constructor() {
        super('Cogumelo Mutante', 'Aumenta a Área de Efeito (Armas e Magias) em 5%.', 41, 'uncommon', 41, 60, [
            new SizeBoostEffect(5)
        ]);
    }
}