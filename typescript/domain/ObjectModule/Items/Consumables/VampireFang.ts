import Potion from "./Potions/Potions";
import VampirismEffect from "../Effects/VampirismEffect";

export default class VampireFang extends Potion {
    constructor() {
        super('Presa de Morcego', 'Uma presa afiada. Concede +1% de Roubo de Vida Permanente.', 40, 'uncommon', 40, 80, [
            new VampirismEffect(1)
        ]);
    }
}