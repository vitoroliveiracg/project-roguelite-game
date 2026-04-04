import Boots from "./Boots";

export default class IronBoots extends Boots {
    public readonly visualId = 'iron-boots';
    constructor() {
        super(5, 0, 'Botas de Ferro', 'Botas pesadas. Passos firmes.', 13, 'common', 13, 80, 100, [], 1, { strength: 3 }, false, true);
    }
}