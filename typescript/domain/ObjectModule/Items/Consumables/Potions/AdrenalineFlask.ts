import Potion from "./Potions";
import SpeedBoostEffect from "../../Effects/SpeedBoostEffect";

export default class AdrenalineFlask extends Potion {
    constructor() {
        super('Frasco de Adrenalina', 'Acelera levemente os batimentos. +5 de Velocidade.', 42, 'uncommon', 42, 50, [
            new SpeedBoostEffect(5)
        ]);
    }
}