import Potion from "./Potions/Potions";
import PowerBoostEffect from "../Effects/PowerBoostEffect";

export default class DemonBlood extends Potion {
    constructor() {
        super('Gota Fervente', 'Aquece o corpo. +2 de Força Base Permanente.', 43, 'uncommon', 43, 50, [
            new PowerBoostEffect(2)
        ]);
    }
}