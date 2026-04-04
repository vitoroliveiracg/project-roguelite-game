import Pants from "./Pants";

export default class IronPants extends Pants {
    public readonly visualId = 'iron-pants';
    constructor() {
        super(10, -1, 'Calças de Ferro', 'Proteção robusta para as pernas.', 12, 'common', 12, 100, 150, [], 1, { strength: 4 }, false, true);
    }
}