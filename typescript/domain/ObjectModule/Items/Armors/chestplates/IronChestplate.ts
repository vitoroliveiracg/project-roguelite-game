import Chestplate from "./Chestplate";

export default class IronChestplate extends Chestplate {
    public readonly visualId = 'iron-chestplate';
    constructor() {
        // Exemplo: 15% de redução, -2% de esquiva (pesado)
        super(15, -2, 'Peitoral de Ferro', 'Uma armadura pesada que protege o torso.', 11, 'common', 11, 150, 200, [], 1, { strength: 5 }, false, true);
    }
}